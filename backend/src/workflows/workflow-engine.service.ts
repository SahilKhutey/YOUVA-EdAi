import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateWorkflowDto,
  LEGAL_WORKFLOW_TRANSITIONS,
  StepType,
  WorkflowDefinition,
  WorkflowStatus,
} from './workflow.types';

@Injectable()
export class WorkflowEngineService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Register or update a workflow definition.
   */
  async createWorkflow(dto: CreateWorkflowDto) {
    const prismaClient = this.prisma as any;
    return prismaClient.learningWorkflow.upsert({
      where: { key: dto.key },
      create: {
        key: dto.key,
        name: dto.name,
        description: dto.description,
        version: dto.version ?? '1.0.0',
        status: 'ACTIVE',
        definition: dto.definition,
      },
      update: {
        name: dto.name,
        description: dto.description,
        version: dto.version ?? '1.0.0',
        definition: dto.definition,
      },
    });
  }

  /**
   * Get workflow by key.
   */
  async getWorkflow(key: string) {
    const prismaClient = this.prisma as any;
    const workflow = await prismaClient.learningWorkflow.findUnique({
      where: { key },
    });
    if (!workflow) {
      throw new NotFoundException(`Workflow with key '${key}' not found`);
    }
    return workflow;
  }

  /**
   * Start executing a defined workflow.
   */
  async startExecution(
    workflowKey: string,
    learnerId?: string,
    tenantId?: string,
    initialContext: any = {},
  ) {
    const workflow = await this.getWorkflow(workflowKey);
    const def = workflow.definition as unknown as WorkflowDefinition;

    if (!def.initialStepId || !def.steps[def.initialStepId]) {
      throw new BadRequestException(`Workflow '${workflowKey}' has invalid initialStepId`);
    }

    const prismaClient = this.prisma as any;
    const initialStep = def.steps[def.initialStepId];
    const initialStatus =
      initialStep.type === StepType.HUMAN_GATE || initialStep.requiresApproval
        ? WorkflowStatus.WAITING_APPROVAL
        : WorkflowStatus.RUNNING;

    return prismaClient.workflowExecution.create({
      data: {
        workflowId: workflow.id,
        tenantId,
        learnerId,
        status: initialStatus,
        state: def.initialStepId,
        contextJson: {
          ...initialContext,
          history: [
            {
              state: def.initialStepId,
              status: initialStatus,
              timestamp: new Date().toISOString(),
            },
          ],
        },
      },
      include: {
        workflow: true,
      },
    });
  }

  /**
   * Advance execution to the next deterministic step.
   */
  async stepForward(executionId: string, stepContext: any = {}) {
    const execution = await this.getExecution(executionId);
    const def = execution.workflow.definition as unknown as WorkflowDefinition;
    const currentStep = def.steps[execution.state];

    if (!currentStep) {
      throw new BadRequestException(`Execution state '${execution.state}' not in workflow definition`);
    }

    if (execution.status === WorkflowStatus.COMPLETED || execution.status === WorkflowStatus.FAILED || execution.status === WorkflowStatus.CANCELLED) {
      throw new BadRequestException(`Cannot step forward an execution in terminal state '${execution.status}'`);
    }

    if (execution.status === WorkflowStatus.WAITING_APPROVAL) {
      throw new BadRequestException(`Execution is waiting for human approval. Use approveGate() instead.`);
    }

    const nextStepId = currentStep.nextStepId;
    const currentContext = execution.contextJson ?? {};

    // If no next step, mark as completed
    if (!nextStepId) {
      return this.transitionStatus(
        executionId,
        execution.status as WorkflowStatus,
        WorkflowStatus.COMPLETED,
        execution.state,
        { ...currentContext, ...stepContext, completedAt: new Date().toISOString() },
      );
    }

    const nextStep = def.steps[nextStepId];
    if (!nextStep) {
      throw new BadRequestException(`Next step '${nextStepId}' does not exist in workflow`);
    }

    const nextStatus =
      nextStep.type === StepType.HUMAN_GATE || nextStep.requiresApproval
        ? WorkflowStatus.WAITING_APPROVAL
        : WorkflowStatus.RUNNING;

    return this.transitionStatus(
      executionId,
      execution.status as WorkflowStatus,
      nextStatus,
      nextStepId,
      { ...currentContext, ...stepContext },
    );
  }

  /**
   * Approve a human gate to advance the workflow.
   */
  async approveGate(executionId: string, approvedBy: string, gateContext: any = {}) {
    const execution = await this.getExecution(executionId);

    if (execution.status !== WorkflowStatus.WAITING_APPROVAL) {
      throw new BadRequestException(`Execution '${executionId}' is not awaiting approval (status: ${execution.status})`);
    }

    const def = execution.workflow.definition as unknown as WorkflowDefinition;
    const currentStep = def.steps[execution.state];
    const nextStepId = currentStep.nextStepId;
    const currentContext = execution.contextJson ?? {};

    const updatedContext = {
      ...currentContext,
      ...gateContext,
      approvals: [
        ...(currentContext.approvals || []),
        {
          stepId: execution.state,
          approvedBy,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    if (!nextStepId) {
      return this.transitionStatus(
        executionId,
        WorkflowStatus.WAITING_APPROVAL,
        WorkflowStatus.COMPLETED,
        execution.state,
        updatedContext,
      );
    }

    const nextStep = def.steps[nextStepId];
    const nextStatus =
      nextStep.type === StepType.HUMAN_GATE || nextStep.requiresApproval
        ? WorkflowStatus.WAITING_APPROVAL
        : WorkflowStatus.RUNNING;

    return this.transitionStatus(
      executionId,
      WorkflowStatus.WAITING_APPROVAL,
      nextStatus,
      nextStepId,
      updatedContext,
    );
  }

  /**
   * Mark execution as failed.
   */
  async failExecution(executionId: string, errorMessage: string) {
    const execution = await this.getExecution(executionId);
    return this.transitionStatus(
      executionId,
      execution.status as WorkflowStatus,
      WorkflowStatus.FAILED,
      execution.state,
      {
        ...(execution.contextJson ?? {}),
        error: errorMessage,
        failedAt: new Date().toISOString(),
      },
    );
  }

  /**
   * Cancel execution.
   */
  async cancelExecution(executionId: string, reason: string) {
    const execution = await this.getExecution(executionId);
    return this.transitionStatus(
      executionId,
      execution.status as WorkflowStatus,
      WorkflowStatus.CANCELLED,
      execution.state,
      {
        ...(execution.contextJson ?? {}),
        cancelReason: reason,
        cancelledAt: new Date().toISOString(),
      },
    );
  }

  /**
   * Fetch single execution.
   */
  async getExecution(executionId: string) {
    const prismaClient = this.prisma as any;
    const execution = await prismaClient.workflowExecution.findUnique({
      where: { id: executionId },
      include: { workflow: true },
    });
    if (!execution) {
      throw new NotFoundException(`Execution with id '${executionId}' not found`);
    }
    return execution;
  }

  /**
   * List executions with filters.
   */
  async listExecutions(filters: {
    workflowId?: string;
    learnerId?: string;
    tenantId?: string;
    status?: WorkflowStatus;
    limit?: number;
  }) {
    const prismaClient = this.prisma as any;
    const where: any = {};
    if (filters.workflowId) where.workflowId = filters.workflowId;
    if (filters.learnerId) where.learnerId = filters.learnerId;
    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.status) where.status = filters.status;

    return prismaClient.workflowExecution.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: filters.limit ?? 50,
      include: { workflow: true },
    });
  }

  /**
   * Enforce legal state machine transitions.
   */
  private async transitionStatus(
    executionId: string,
    currentStatus: WorkflowStatus,
    nextStatus: WorkflowStatus,
    nextState: string,
    context: any,
  ) {
    const allowed = LEGAL_WORKFLOW_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(nextStatus)) {
      throw new BadRequestException(
        `Illegal workflow state transition from '${currentStatus}' to '${nextStatus}'`,
      );
    }

    const prismaClient = this.prisma as any;
    const isCompleted =
      nextStatus === WorkflowStatus.COMPLETED ||
      nextStatus === WorkflowStatus.FAILED ||
      nextStatus === WorkflowStatus.CANCELLED;

    const historyEntry = {
      state: nextState,
      status: nextStatus,
      timestamp: new Date().toISOString(),
    };

    return prismaClient.workflowExecution.update({
      where: { id: executionId },
      data: {
        status: nextStatus,
        state: nextState,
        contextJson: {
          ...context,
          history: [...(context.history || []), historyEntry],
        },
        completedAt: isCompleted ? new Date() : undefined,
      },
      include: {
        workflow: true,
      },
    });
  }
}
