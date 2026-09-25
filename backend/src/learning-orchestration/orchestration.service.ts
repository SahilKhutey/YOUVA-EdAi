import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CandidateService } from './candidate/candidate.service';
import { ConstraintEngine } from './constraints/constraint.engine';
import { DecisionEngine } from './decision/decision.engine';
import { RemediationService } from './remediation/remediation.service';
import { AdaptiveSessionService } from './session/adaptive-session.service';
import { InterventionService } from './intervention/intervention.service';
import {
  AdaptiveActionType,
  AdaptiveLearningAction,
  AdaptivePolicy,
  AdaptiveReasonCode,
  AdaptiveSessionContext,
} from './decision/decision.types';
import { DEFAULT_ADAPTIVE_POLICY, CURRENT_POLICY_VERSION } from './decision/decision.policy';

@Injectable()
export class OrchestrationService {
  private readonly logger = new Logger(OrchestrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly candidateService: CandidateService,
    private readonly constraintEngine: ConstraintEngine,
    private readonly decisionEngine: DecisionEngine,
    private readonly remediationService: RemediationService,
    private readonly sessionService: AdaptiveSessionService,
    private readonly interventionService: InterventionService,
  ) {}

  /**
   * Primary adaptive entrypoint: determines the next appropriate learning action
   * for a learner based on knowledge graph, mastery, constraints, and sessions.
   */
  async getNextAction(
    learnerId: string,
    currentKnowledgeId?: string,
    tenantId: string = 'default-tenant',
    policy: AdaptivePolicy = DEFAULT_ADAPTIVE_POLICY,
  ): Promise<AdaptiveLearningAction> {
    // 1. Get or create persistent session
    const session = await this.sessionService.getOrCreateSession(
      learnerId,
      tenantId,
      currentKnowledgeId,
    );

    const activeKnowledgeId = currentKnowledgeId || session.currentKnowledgeId;

    // 2. Check Return-to-Target Rule if learner is in an ongoing remediation
    if (session.remediationTargetId && activeKnowledgeId && session.remediationTargetId !== activeKnowledgeId) {
      const returnCheck = await this.remediationService.checkReturnToTarget(
        learnerId,
        activeKnowledgeId,
        session.remediationTargetId,
        tenantId,
      );

      if (returnCheck.canReturn) {
        // Clear remediationTargetId and return to original concept
        const targetObj = await this.prisma.knowledgeObject.findUnique({
          where: { id: session.remediationTargetId },
          select: { id: true, title: true },
        });

        await this.sessionService.updateSession(learnerId, tenantId, {
          currentKnowledgeId: session.remediationTargetId,
          currentAction: returnCheck.nextAction,
          remediationTargetId: null,
          remediationDepth: 0,
        });

        return this.persistDecision({
          learnerId,
          tenantId,
          sourceKnowledgeId: activeKnowledgeId,
          targetKnowledgeId: session.remediationTargetId,
          targetTitle: targetObj?.title,
          action: returnCheck.nextAction,
          reasonCode: returnCheck.reasonCode,
          reasonMessage: returnCheck.reasonMessage,
          priority: 85,
          confidence: 0.9,
          required: false,
        });
      }
    }

    // 3. Generate candidates across authoritative sources
    const candidates = await this.candidateService.generateCandidates(
      learnerId,
      activeKnowledgeId,
      tenantId,
    );

    // 4. Filter candidates through constraints (tenant, published, assignments, anti-loop)
    const validCandidates = await this.constraintEngine.filterCandidates(
      candidates,
      learnerId,
      policy,
      session.remediationDepth,
      tenantId,
    );

    // 5. Decision Engine scores candidates and picks top action
    const decision = this.decisionEngine.decide(
      validCandidates,
      learnerId,
      policy,
      tenantId,
      activeKnowledgeId,
    );

    // 6. If action is REMEDIATE, track remediationTargetId and increment depth
    let updatedDepth = session.remediationDepth;
    let targetReturnId = session.remediationTargetId;
    if (decision.action === AdaptiveActionType.REMEDIATE) {
      updatedDepth = session.remediationDepth + 1;
      targetReturnId = activeKnowledgeId || null;
    }

    // 7. Update session with new action & target
    await this.sessionService.updateSession(learnerId, tenantId, {
      currentKnowledgeId: decision.targetKnowledgeId,
      currentAction: decision.action,
      remediationDepth: updatedDepth,
      remediationTargetId: targetReturnId,
      actionTakenId: decision.id,
    });

    // 8. Fetch target title for rich UX representation
    const targetObj = await this.prisma.knowledgeObject.findUnique({
      where: { id: decision.targetKnowledgeId },
      select: { title: true },
    });
    decision.targetTitle = targetObj?.title;

    // 9. Persist decision for audit and diagnostics
    return this.persistDecision(decision);
  }

  /**
   * Retrieves active session context for the learner.
   */
  async getContext(
    learnerId: string,
    tenantId: string = 'default-tenant',
  ): Promise<AdaptiveSessionContext> {
    return this.sessionService.getOrCreateSession(learnerId, tenantId);
  }

  /**
   * Retrieves decision record by ID for diagnostics and audit.
   */
  async getDecision(decisionId: string, tenantId: string = 'default-tenant') {
    const decision = await this.prisma.adaptiveDecision.findUnique({
      where: { id: decisionId },
    });
    if (!decision) {
      throw new NotFoundException(`Adaptive decision '${decisionId}' not found`);
    }
    return decision;
  }

  /**
   * Recalculates the next learning action (e.g. after an event like answer submitted).
   */
  async recalculate(
    learnerId: string,
    currentKnowledgeId?: string,
    triggerEvent?: string,
    tenantId: string = 'default-tenant',
  ): Promise<AdaptiveLearningAction> {
    this.logger.debug(
      `Recalculating adaptive action for learner '${learnerId}' triggered by event '${triggerEvent || 'MANUAL'}'`,
    );

    // Invalidate previously active decisions
    await this.prisma.adaptiveDecision.updateMany({
      where: {
        learnerId,
        tenantId,
        status: 'ACTIVE',
      },
      data: { status: 'SUPERSEDED' },
    });

    return this.getNextAction(learnerId, currentKnowledgeId, tenantId);
  }

  /**
   * Marks an action completed by the learner.
   */
  async completeAction(
    actionId: string,
    learnerId: string,
    tenantId: string = 'default-tenant',
  ): Promise<{ status: string }> {
    await this.prisma.adaptiveDecision.updateMany({
      where: {
        id: actionId,
        learnerId,
        tenantId,
      },
      data: {
        status: 'EXECUTED',
        executedAt: new Date(),
      },
    });

    return { status: 'EXECUTED' };
  }

  /**
   * Skips an adaptive action.
   */
  async skipAction(
    actionId: string,
    learnerId: string,
    tenantId: string = 'default-tenant',
  ): Promise<{ status: string }> {
    await this.prisma.adaptiveDecision.updateMany({
      where: {
        id: actionId,
        learnerId,
        tenantId,
      },
      data: {
        status: 'SUPERSEDED',
      },
    });

    return { status: 'SUPERSEDED' };
  }

  /**
   * Records a teacher override.
   */
  async recordTeacherOverride(
    teacherId: string,
    learnerId: string,
    input: {
      action: string;
      targetKnowledgeId?: string;
      reason?: string;
    },
    tenantId: string = 'default-tenant',
  ) {
    // Deactivate existing overrides for this learner
    await this.prisma.teacherAdaptiveOverride.updateMany({
      where: { learnerId, tenantId, active: true },
      data: { active: false },
    });

    const override = await this.prisma.teacherAdaptiveOverride.create({
      data: {
        tenantId,
        teacherId,
        learnerId,
        action: input.action,
        targetKnowledgeId: input.targetKnowledgeId || null,
        reason: input.reason || null,
        active: true,
      },
    });

    // Invalidate current decision and recalculate with override
    await this.recalculate(learnerId, input.targetKnowledgeId, 'TEACHER_OVERRIDE', tenantId);

    return override;
  }

  /**
   * Builds the teacher's adaptive view for a specific student.
   */
  async getTeacherLearnerView(
    teacherId: string,
    learnerId: string,
    tenantId: string = 'default-tenant',
  ) {
    const session = await this.sessionService.getOrCreateSession(learnerId, tenantId);

    const latestDecision = await this.prisma.adaptiveDecision.findFirst({
      where: { learnerId, tenantId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    const activeOverride = await this.prisma.teacherAdaptiveOverride.findFirst({
      where: { learnerId, tenantId, active: true },
      orderBy: { createdAt: 'desc' },
    });

    const masteryStates = await this.prisma.learnerKnowledgeState.findMany({
      where: { learnerId, tenantId },
      include: { knowledgeObject: { select: { title: true, type: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });

    return {
      learnerId,
      session,
      currentAction: latestDecision?.action || session.currentAction,
      reasonCode: latestDecision?.reasonCode || 'SESSION_RESUME',
      reasonMessage: latestDecision?.reasonMessage || 'Session in progress.',
      interventionLevel: session.interventionLevel,
      activeOverride,
      recentMastery: masteryStates.map((m: any) => ({
        knowledgeId: m.knowledgeObjectId,
        title: m.knowledgeObject?.title || 'Concept',
        type: m.knowledgeObject?.type || 'LESSON',
        masteryLevel: m.masteryLevel,
        confidence: m.confidence,
        status: m.status,
      })),
    };
  }

  private async persistDecision(
    action: Partial<AdaptiveLearningAction> & {
      learnerId: string;
      tenantId: string;
      targetKnowledgeId: string;
      action: AdaptiveActionType;
      reasonCode: AdaptiveReasonCode;
    },
  ): Promise<AdaptiveLearningAction> {
    const decisionRecord = await this.prisma.adaptiveDecision.create({
      data: {
        tenantId: action.tenantId,
        learnerId: action.learnerId,
        sourceKnowledgeId: action.sourceKnowledgeId || null,
        sourceVersionId: action.sourceKnowledgeVersionId || null,
        targetKnowledgeId: action.targetKnowledgeId,
        targetVersionId: action.targetKnowledgeVersionId || null,
        action: action.action,
        reasonCode: action.reasonCode,
        reasonMessage: action.reasonMessage || null,
        priority: action.priority ?? 50,
        confidence: action.confidence ?? 0.85,
        required: action.required ?? false,
        policyVersion: action.policyVersion || CURRENT_POLICY_VERSION,
        status: 'ACTIVE',
      },
    });

    return {
      id: decisionRecord.id,
      learnerId: decisionRecord.learnerId,
      tenantId: decisionRecord.tenantId,
      sourceKnowledgeId: decisionRecord.sourceKnowledgeId || undefined,
      targetKnowledgeId: decisionRecord.targetKnowledgeId,
      targetTitle: action.targetTitle,
      action: decisionRecord.action as AdaptiveActionType,
      reasonCode: decisionRecord.reasonCode as AdaptiveReasonCode,
      reasonMessage: decisionRecord.reasonMessage || '',
      priority: decisionRecord.priority,
      confidence: decisionRecord.confidence,
      required: decisionRecord.required,
      decisionId: decisionRecord.id,
      policyVersion: decisionRecord.policyVersion,
      createdAt: decisionRecord.createdAt,
    };
  }
}
