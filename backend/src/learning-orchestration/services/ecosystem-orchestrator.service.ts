import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ApproveOrchestrationDto,
  AutonomyLevel,
  ExplainabilityContract,
  LearningOrchestrationDto,
  OrchestrationScope,
  OrchestrationStatus,
  StepStatus,
  TriggerOrchestrationDto,
} from '../domain/orchestration.types';
import { AutonomyPolicy } from '../policies/autonomy-policy';
import { LoopPreventionPolicy } from '../policies/loop-prevention.policy';
import { ScopePolicy } from '../policies/scope-policy';
import { WorkflowExecutorService } from '../workflows/workflow-executor.service';
import { WorkflowRegistryService } from '../workflows/workflow-registry.service';
import { EscalationService } from './escalation.service';

@Injectable()
export class EcosystemOrchestratorService {
  private readonly logger = new Logger(EcosystemOrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly autonomyPolicy: AutonomyPolicy,
    private readonly scopePolicy: ScopePolicy,
    private readonly loopPreventionPolicy: LoopPreventionPolicy,
    private readonly workflowRegistry: WorkflowRegistryService,
    private readonly workflowExecutor: WorkflowExecutorService,
    private readonly escalationService: EscalationService,
  ) {}

  async triggerOrchestration(dto: TriggerOrchestrationDto): Promise<LearningOrchestrationDto> {
    const tenantId = dto.tenantId ?? 'default-tenant';
    const scope: OrchestrationScope = dto.scope ?? 'LEARNER';
    const workflowKey = dto.workflowId ?? (scope === 'LEARNER' ? 'prerequisite-remediation-v1' : 'concept-review-v1');
    const workflowVersion = dto.workflowVersion ?? '1.0.0';

    this.logger.log(
      `Triggering orchestration for objective '${dto.objective}' with workflow ${workflowKey}@${workflowVersion} at scope ${scope}`,
    );

    // 1. Resolve workflow definition
    const workflow = await this.workflowRegistry.getWorkflow(workflowKey, workflowVersion);
    if (!workflow) {
      throw new NotFoundException(`Workflow '${workflowKey}@${workflowVersion}' not found in registry.`);
    }

    // 2. Loop Prevention Check
    const loopCheck = await this.loopPreventionPolicy.checkRepetition(
      tenantId,
      dto.learnerId,
      workflowKey,
    );

    // 3. Scope Policy Check
    const scopeCheck = this.scopePolicy.validateScope(scope, workflow.scope);

    // 4. Autonomy Policy Check
    const requestedAutonomy: AutonomyLevel = dto.autonomyLevel ?? workflow.autonomyLevel;
    const autonomyEval = this.autonomyPolicy.evaluate(requestedAutonomy);

    // Determine initial status
    let initialStatus: OrchestrationStatus = 'CREATED';
    if (!scopeCheck.allowed) {
      initialStatus = 'FAILED';
    } else if (loopCheck.loopDetected) {
      initialStatus = 'AWAITING_APPROVAL';
    } else if (autonomyEval.requiresHumanApproval) {
      initialStatus = 'AWAITING_APPROVAL';
    } else if (autonomyEval.effectiveAutonomyLevel === 'OBSERVE') {
      initialStatus = 'COMPLETED';
    } else {
      initialStatus = 'APPROVED';
    }

    // Create DB record
    const orchestration = await this.prisma.learningOrchestration.create({
      data: {
        tenantId,
        learnerId: dto.learnerId,
        objective: dto.objective,
        triggerType: dto.triggerType,
        autonomyLevel: autonomyEval.effectiveAutonomyLevel,
        status: initialStatus,
        workflowId: workflowKey,
        workflowVersion,
        policyVersion: workflow.policyVersion,
        scope,
        metadata: {
          context: dto.context ?? {},
          evidenceIds: dto.evidenceIds ?? [],
          autonomyReason: autonomyEval.reason,
          loopCheckReason: loopCheck.reason,
          scopeCheckReason: scopeCheck.reason,
        } as any,
      },
    });

    // Create steps from workflow definition
    const stepsData = workflow.definition.steps.map((stepDef) => {
      let targetId = stepDef.targetId ?? 'default';
      if (stepDef.targetIdPattern) {
        if (stepDef.targetIdPattern === '{{learnerId}}') targetId = dto.learnerId ?? 'global-learner';
        else if (stepDef.targetIdPattern === '{{conceptId}}') targetId = dto.context?.conceptId ?? 'concept-auto';
        else if (stepDef.targetIdPattern === '{{sessionId}}') targetId = dto.context?.sessionId ?? 'session-auto';
        else if (stepDef.targetIdPattern === '{{classId}}') targetId = dto.context?.classId ?? 'class-auto';
        else if (stepDef.targetIdPattern === '{{courseId}}') targetId = dto.context?.courseId ?? 'course-auto';
        else targetId = dto.context?.[stepDef.targetIdPattern.replace(/[{}]/g, '')] ?? targetId;
      }

      return {
        orchestrationId: orchestration.id,
        sequence: stepDef.sequence,
        actionType: stepDef.actionType,
        targetType: stepDef.targetType,
        targetId,
        status: 'PENDING',
        dependsOn: (stepDef.dependsOn as any) ?? [],
        payload: (stepDef.payloadTemplate ?? {}) as any,
        compensationAction: stepDef.compensationAction ?? null,
      };
    });

    for (const stepData of stepsData) {
      await this.prisma.orchestrationStep.create({ data: stepData });
    }

    // Handle Escalations if loop detected or scope violation
    if (!scopeCheck.allowed) {
      await this.escalationService.createEscalation({
        tenantId,
        orchestrationId: orchestration.id,
        reason: scopeCheck.reason ?? 'Scope escalation violation',
        severity: 'CRITICAL',
        evidenceIds: dto.evidenceIds ?? [],
        recommendedAction: 'Review and correct orchestration scope permissions or assign appropriate role.',
      });
    } else if (loopCheck.loopDetected) {
      await this.escalationService.createEscalation({
        tenantId,
        orchestrationId: orchestration.id,
        reason: loopCheck.reason ?? 'Autonomous loop repetition detected',
        severity: 'HIGH',
        evidenceIds: dto.evidenceIds ?? [],
        recommendedAction: 'Teacher intervention required to assess student blockages and modify learning path.',
      });
    }

    // Auto-execute if status is APPROVED
    if (initialStatus === 'APPROVED') {
      // Execute asynchronously in background or synchronously
      await this.workflowExecutor.executeOrchestration(orchestration.id);
    }

    return this.getOrchestration(orchestration.id);
  }

  async approveOrchestration(
    id: string,
    dto: ApproveOrchestrationDto,
  ): Promise<LearningOrchestrationDto> {
    const existing = await this.prisma.learningOrchestration.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Orchestration '${id}' not found.`);
    }

    const updatedMetadata = {
      ...((existing.metadata as Record<string, any>) || {}),
      approvedBy: dto.approvedBy,
      approvedAt: new Date().toISOString(),
      approvalNotes: dto.notes,
    };

    await this.prisma.learningOrchestration.update({
      where: { id },
      data: {
        status: 'APPROVED',
        metadata: updatedMetadata as any,
      },
    });

    this.logger.log(`Orchestration '${id}' approved by ${dto.approvedBy}. Starting execution...`);
    await this.workflowExecutor.executeOrchestration(id);

    return this.getOrchestration(id);
  }

  async pauseOrchestration(id: string): Promise<LearningOrchestrationDto> {
    const existing = await this.prisma.learningOrchestration.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Orchestration '${id}' not found.`);
    }

    await this.prisma.learningOrchestration.update({
      where: { id },
      data: { status: 'PAUSED' },
    });

    this.logger.log(`Orchestration '${id}' paused.`);
    return this.getOrchestration(id);
  }

  async resumeOrchestration(id: string): Promise<LearningOrchestrationDto> {
    const existing = await this.prisma.learningOrchestration.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Orchestration '${id}' not found.`);
    }

    await this.prisma.learningOrchestration.update({
      where: { id },
      data: { status: 'APPROVED' },
    });

    this.logger.log(`Orchestration '${id}' resumed. Continuing execution...`);
    await this.workflowExecutor.executeOrchestration(id);

    return this.getOrchestration(id);
  }

  async cancelOrchestration(id: string, reason?: string): Promise<LearningOrchestrationDto> {
    const existing = await this.prisma.learningOrchestration.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Orchestration '${id}' not found.`);
    }

    const updatedMetadata = {
      ...((existing.metadata as Record<string, any>) || {}),
      cancellationReason: reason,
      cancelledAt: new Date().toISOString(),
    };

    await this.prisma.learningOrchestration.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        metadata: updatedMetadata as any,
      },
    });

    this.logger.log(`Orchestration '${id}' cancelled.`);
    return this.getOrchestration(id);
  }

  async getOrchestration(id: string): Promise<LearningOrchestrationDto> {
    const record = await this.prisma.learningOrchestration.findUnique({
      where: { id },
      include: {
        steps: { orderBy: { sequence: 'asc' } },
        escalations: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!record) {
      throw new NotFoundException(`Orchestration '${id}' not found.`);
    }

    const metadata = (record.metadata as Record<string, any>) || {};

    const explainability: ExplainabilityContract = {
      triggerReason: record.objective,
      evidenceIds: metadata.evidenceIds || [],
      policyEvaluated: {
        policyVersion: record.policyVersion,
        autonomyLevel: record.autonomyLevel as AutonomyLevel,
        requiresHumanApproval: record.status === 'AWAITING_APPROVAL',
        killSwitchActive: !this.autonomyPolicy.isAutomationEnabled(),
        scopeChecked: true,
        scopeBreached: record.status === 'FAILED' && !!metadata.scopeCheckReason,
        loopDetected: !!metadata.loopCheckReason,
      },
      workflowId: record.workflowId,
      workflowVersion: record.workflowVersion,
      approvedBy: metadata.approvedBy,
      approvedAt: metadata.approvedAt,
      executionAudit: record.steps.map((s) => ({
        stepSequence: s.sequence,
        actionType: s.actionType,
        targetId: s.targetId,
        status: s.status as StepStatus,
        timestamp: (s.completedAt || s.startedAt || s.createdAt).toISOString(),
        details: s.result ? JSON.stringify(s.result) : undefined,
      })),
    };

    return {
      id: record.id,
      tenantId: record.tenantId,
      learnerId: record.learnerId,
      objective: record.objective,
      triggerType: record.triggerType,
      autonomyLevel: record.autonomyLevel,
      status: record.status,
      workflowId: record.workflowId,
      workflowVersion: record.workflowVersion,
      policyVersion: record.policyVersion,
      scope: record.scope,
      metadata: record.metadata,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      steps: record.steps.map((s) => ({
        id: s.id,
        orchestrationId: s.orchestrationId,
        sequence: s.sequence,
        actionType: s.actionType,
        targetType: s.targetType,
        targetId: s.targetId,
        status: s.status as StepStatus,
        dependsOn: s.dependsOn,
        payload: s.payload,
        result: s.result,
        compensationAction: s.compensationAction,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
        createdAt: s.createdAt,
      })),
      escalations: record.escalations.map((e) => ({
        id: e.id,
        tenantId: e.tenantId,
        orchestrationId: e.orchestrationId,
        reason: e.reason,
        severity: e.severity as any,
        evidenceIds: e.evidenceIds as string[],
        recommendedAction: e.recommendedAction,
        status: e.status as any,
        assignedTo: e.assignedTo,
        createdAt: e.createdAt,
        resolvedAt: e.resolvedAt,
      })),
      explainability,
    };
  }

  async listOrchestrations(filter?: {
    tenantId?: string;
    learnerId?: string;
    status?: string;
    autonomyLevel?: string;
  }): Promise<LearningOrchestrationDto[]> {
    const records = await this.prisma.learningOrchestration.findMany({
      where: {
        tenantId: filter?.tenantId,
        learnerId: filter?.learnerId,
        status: filter?.status,
        autonomyLevel: filter?.autonomyLevel,
      },
      include: {
        steps: { orderBy: { sequence: 'asc' } },
        escalations: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return records.map((record) => {
      const metadata = (record.metadata as Record<string, any>) || {};
      return {
        id: record.id,
        tenantId: record.tenantId,
        learnerId: record.learnerId,
        objective: record.objective,
        triggerType: record.triggerType,
        autonomyLevel: record.autonomyLevel,
        status: record.status,
        workflowId: record.workflowId,
        workflowVersion: record.workflowVersion,
        policyVersion: record.policyVersion,
        scope: record.scope,
        metadata: record.metadata,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        steps: record.steps.map((s) => ({
          id: s.id,
          orchestrationId: s.orchestrationId,
          sequence: s.sequence,
          actionType: s.actionType,
          targetType: s.targetType,
          targetId: s.targetId,
          status: s.status as StepStatus,
          dependsOn: s.dependsOn,
          payload: s.payload,
          result: s.result,
          compensationAction: s.compensationAction,
          startedAt: s.startedAt,
          completedAt: s.completedAt,
          createdAt: s.createdAt,
        })),
        escalations: record.escalations.map((e) => ({
          id: e.id,
          tenantId: e.tenantId,
          orchestrationId: e.orchestrationId,
          reason: e.reason,
          severity: e.severity as any,
          evidenceIds: e.evidenceIds as string[],
          recommendedAction: e.recommendedAction,
          status: e.status as any,
          assignedTo: e.assignedTo,
          createdAt: e.createdAt,
          resolvedAt: e.resolvedAt,
        })),
      };
    });
  }
}
