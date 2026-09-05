import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PolicyEngineService } from './policy/policy-engine.service';
import { EvidenceProcessorService, ProcessEvidenceResult } from './evidence/evidence-processor.service';
import { PersonalizationEngineService } from './personalization/personalization-engine.service';
import { EscalationStateMachineService } from './escalation/escalation-state-machine.service';
import { TeacherInterventionService } from './intervention/teacher-intervention.service';
import { LearningLoopAuditService } from './audit/learning-loop-audit.service';
import { SubmitEvidenceDto } from './dto/submit-evidence.dto';
import { GateState, EscalationSeverity, ActorType, InterventionStatus } from './domain/enums';
import { PolicyGateResult, PersonalizationRecommendation } from './domain/types';

export interface LearningLoopStepResult {
  evidence: ProcessEvidenceResult;
  gate: PolicyGateResult;
  nextAction?: PersonalizationRecommendation | null;
  statusMessage: string;
}

@Injectable()
export class LearningLoopService {
  private readonly logger = new Logger(LearningLoopService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly policyEngine: PolicyEngineService,
    private readonly evidenceProcessor: EvidenceProcessorService,
    private readonly personalizationEngine: PersonalizationEngineService,
    private readonly escalationStateMachine: EscalationStateMachineService,
    private readonly teacherIntervention: TeacherInterventionService,
    private readonly auditService: LearningLoopAuditService,
  ) {}

  /**
   * Retrieves dynamic student learning context.
   */
  async getContext(userId: string, topicId: string) {
    return this.personalizationEngine.buildStudentContext(userId, topicId);
  }

  /**
   * Generates a deterministic personalized recommendation for a student.
   */
  async personalize(userId: string, topicId: string) {
    const context = await this.personalizationEngine.buildStudentContext(userId, topicId);

    // Evaluate gate before returning recommendation
    const gateResult = await this.policyEngine.evaluateGate(userId, topicId, context);

    if (gateResult.gateState !== GateState.AI_CONTINUE) {
      return {
        isAllowed: false,
        gate: gateResult,
        recommendation: null,
        message: 'Personalization held by Policy Gate: ' + gateResult.reason,
      };
    }

    const { decisionId, recommendation } = await this.personalizationEngine.generateRecommendation(context);

    // Save policy gate log attached to decision
    await this.prisma.policyGateDecision.create({
      data: {
        decisionId,
        userId,
        gateState: gateResult.gateState,
        reason: gateResult.reason,
        triggeredRules: JSON.stringify(gateResult.ruleEvaluations),
      },
    });

    return {
      isAllowed: true,
      decisionId,
      gate: gateResult,
      recommendation,
    };
  }

  /**
   * Ingests student learning evidence, updates mastery deterministically,
   * evaluates the policy safety gate, and dispatches the next loop step.
   */
  async processEvidenceAndAdvance(
    userId: string,
    dto: SubmitEvidenceDto,
  ): Promise<LearningLoopStepResult> {
    // 1. Process evidence with idempotency and BKT/RL mastery updates
    const evidenceResult = await this.evidenceProcessor.processEvidence({
      idempotencyKey: dto.idempotencyKey,
      userId,
      topicId: dto.topicId,
      answer: dto.answer,
      accuracy: dto.accuracy,
      attemptNumber: dto.attemptNumber || 1,
      hintCount: dto.hintCount || 0,
      misconception: dto.misconception,
      engagementScore: dto.engagementScore,
      metadata: dto.metadata,
    });

    // 2. Fetch updated context
    const updatedContext = await this.personalizationEngine.buildStudentContext(userId, dto.topicId);

    // 3. Evaluate Policy / Safety Gate
    const gateResult = await this.policyEngine.evaluateGate(userId, dto.topicId, updatedContext);

    let nextAction: PersonalizationRecommendation | null = null;
    let statusMessage = '';

    // 4. Handle Gate Result
    if (gateResult.gateState === GateState.AI_CONTINUE) {
      const { decisionId, recommendation } =
        await this.personalizationEngine.generateRecommendation(updatedContext);
      nextAction = recommendation;
      statusMessage = 'Evidence processed successfully. Next AI activity generated.';

      // Persist Gate Log
      await this.prisma.policyGateDecision.create({
        data: {
          decisionId,
          userId,
          gateState: gateResult.gateState,
          reason: gateResult.reason,
          triggeredRules: JSON.stringify(gateResult.ruleEvaluations),
        },
      });
    } else if (gateResult.gateState === GateState.TEACHER_REVIEW_REQUIRED) {
      statusMessage = 'Session paused: Teacher review required before proceeding.';

      const gateRecord = await this.prisma.policyGateDecision.create({
        data: {
          userId,
          gateState: gateResult.gateState,
          reason: gateResult.reason,
          triggeredRules: JSON.stringify(gateResult.ruleEvaluations),
        },
      });

      // Find teacher assigned to student if any, or create pending intervention
      const activeSession = await this.prisma.digitalClassroomSession.findFirst({
        where: { studentId: userId },
      });

      if (activeSession) {
        await this.prisma.teacherIntervention.create({
          data: {
            teacherId: activeSession.teacherId,
            studentId: userId,
            action: 'INTERVENE',
            feedback: gateResult.reason,
            status: InterventionStatus.PENDING,
          },
        });
      }

      await this.auditService.logAction({
        userId,
        actorType: ActorType.SYSTEM,
        actorId: 'POLICY_GATE',
        action: 'TEACHER_REVIEW_TRIGGERED',
        stateBefore: { gateState: GateState.AI_CONTINUE },
        stateAfter: { gateState: GateState.TEACHER_REVIEW_REQUIRED, reason: gateResult.reason },
      });
    } else if (gateResult.gateState === GateState.SAFETY_ESCALATION) {
      statusMessage = 'SAFETY LOCK ENGAGED: Safety escalation opened. Requires human educator or admin intervention.';

      await this.escalationStateMachine.triggerEscalation(
        userId,
        gateResult.escalationSeverity || EscalationSeverity.HIGH,
        gateResult.reason,
        ActorType.SYSTEM,
        'POLICY_ENGINE',
      );
    }

    return {
      evidence: evidenceResult,
      gate: gateResult,
      nextAction,
      statusMessage,
    };
  }

  /**
   * Retrieves active policy gate status for a student.
   */
  async getGateStatus(userId: string, topicId: string) {
    const context = await this.personalizationEngine.buildStudentContext(userId, topicId);
    return this.policyEngine.evaluateGate(userId, topicId, context);
  }
}
