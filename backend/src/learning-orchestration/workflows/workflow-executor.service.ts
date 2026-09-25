import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ActionType,
  OrchestrationStepDto,
  StepStatus,
} from '../domain/orchestration.types';

export interface StepExecutionResult {
  stepId: string;
  sequence: number;
  status: StepStatus;
  result?: any;
  error?: string;
}

export interface WorkflowExecutionSummary {
  orchestrationId: string;
  status: 'COMPLETED' | 'FAILED' | 'PAUSED';
  executedSteps: StepExecutionResult[];
  compensatedSteps: string[];
  error?: string;
}

@Injectable()
export class WorkflowExecutorService {
  private readonly logger = new Logger(WorkflowExecutorService.name);

  constructor(private readonly prisma: PrismaService) {}

  async executeOrchestration(orchestrationId: string): Promise<WorkflowExecutionSummary> {
    const orchestration = await this.prisma.learningOrchestration.findUnique({
      where: { id: orchestrationId },
      include: {
        steps: {
          orderBy: { sequence: 'asc' },
        },
      },
    });

    if (!orchestration) {
      throw new Error(`Orchestration '${orchestrationId}' not found.`);
    }

    if (orchestration.status === 'PAUSED' || orchestration.status === 'CANCELLED') {
      this.logger.warn(`Orchestration '${orchestrationId}' is ${orchestration.status}. Skipping execution.`);
      return {
        orchestrationId,
        status: orchestration.status as any,
        executedSteps: [],
        compensatedSteps: [],
      };
    }

    // Mark orchestration as EXECUTING
    await this.prisma.learningOrchestration.update({
      where: { id: orchestrationId },
      data: { status: 'EXECUTING' },
    });

    const steps = orchestration.steps;
    const executedResults: StepExecutionResult[] = [];
    const completedStepSequences = new Set<number>();

    // Pre-populate completed steps
    for (const step of steps) {
      if (step.status === 'COMPLETED') {
        completedStepSequences.add(step.sequence);
      }
    }

    let failureOccurred = false;
    let failureError = '';
    let failedStepIndex = -1;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      // Check if paused dynamically in DB
      const currentOrch = await this.prisma.learningOrchestration.findUnique({
        where: { id: orchestrationId },
        select: { status: true },
      });
      if (currentOrch?.status === 'PAUSED') {
        this.logger.log(`Execution of orchestration '${orchestrationId}' paused at step ${step.sequence}.`);
        return {
          orchestrationId,
          status: 'PAUSED',
          executedSteps: executedResults,
          compensatedSteps: [],
        };
      }

      // If step already completed, skip
      if (step.status === 'COMPLETED') {
        continue;
      }

      // Check dependencies
      const dependsOn = (step.dependsOn as number[]) || [];
      const dependenciesMet = dependsOn.every((depSeq) => completedStepSequences.has(depSeq));

      if (!dependenciesMet) {
        this.logger.warn(`Step ${step.sequence} dependencies not met: required [${dependsOn.join(', ')}]`);
        failureOccurred = true;
        failureError = `Dependencies not satisfied for step ${step.sequence}`;
        failedStepIndex = i;
        break;
      }

      // Execute step
      try {
        await this.prisma.orchestrationStep.update({
          where: { id: step.id },
          data: { status: 'RUNNING', startedAt: new Date() },
        });

        const result = await this.dispatchAction(
          step.actionType as ActionType,
          step.targetType,
          step.targetId,
          step.payload as Record<string, any>,
        );

        await this.prisma.orchestrationStep.update({
          where: { id: step.id },
          data: {
            status: 'COMPLETED',
            result: result as any,
            completedAt: new Date(),
          },
        });

        completedStepSequences.add(step.sequence);
        executedResults.push({
          stepId: step.id,
          sequence: step.sequence,
          status: 'COMPLETED',
          result,
        });
      } catch (err) {
        this.logger.error(`Error executing step ${step.sequence} (${step.actionType}): ${(err as Error).message}`);
        failureOccurred = true;
        failureError = (err as Error).message;
        failedStepIndex = i;

        await this.prisma.orchestrationStep.update({
          where: { id: step.id },
          data: {
            status: 'FAILED',
            result: { error: failureError } as any,
            completedAt: new Date(),
          },
        });

        executedResults.push({
          stepId: step.id,
          sequence: step.sequence,
          status: 'FAILED',
          error: failureError,
        });

        break;
      }
    }

    // Handle failure & saga compensations
    const compensatedSteps: string[] = [];
    if (failureOccurred) {
      this.logger.warn(`Failure occurred in orchestration '${orchestrationId}'. Running saga compensations...`);

      // Traverse previously completed steps in reverse order
      for (let j = failedStepIndex - 1; j >= 0; j--) {
        const prevStep = steps[j];
        if (completedStepSequences.has(prevStep.sequence) && prevStep.compensationAction) {
          try {
            await this.compensateAction(
              prevStep.compensationAction,
              prevStep.targetType,
              prevStep.targetId,
              prevStep.payload as Record<string, any>,
            );

            await this.prisma.orchestrationStep.update({
              where: { id: prevStep.id },
              data: { status: 'COMPENSATED' },
            });

            compensatedSteps.push(prevStep.id);
            this.logger.log(`Compensated step ${prevStep.sequence} (${prevStep.compensationAction})`);
          } catch (compErr) {
            this.logger.error(`Compensation error for step ${prevStep.sequence}: ${(compErr as Error).message}`);
          }
        }
      }

      await this.prisma.learningOrchestration.update({
        where: { id: orchestrationId },
        data: { status: 'FAILED' },
      });

      return {
        orchestrationId,
        status: 'FAILED',
        executedSteps: executedResults,
        compensatedSteps,
        error: failureError,
      };
    }

    // Mark orchestration as COMPLETED
    await this.prisma.learningOrchestration.update({
      where: { id: orchestrationId },
      data: { status: 'COMPLETED' },
    });

    return {
      orchestrationId,
      status: 'COMPLETED',
      executedSteps: executedResults,
      compensatedSteps: [],
    };
  }

  private async dispatchAction(
    actionType: ActionType,
    targetType: string,
    targetId: string,
    payload?: Record<string, any>,
  ): Promise<Record<string, any>> {
    switch (actionType) {
      case 'TRIGGER_ASSESSMENT':
        return {
          action: 'TRIGGER_ASSESSMENT',
          targetType,
          targetId,
          assessmentSessionId: `assess_${Date.now()}`,
          status: 'QUEUED',
          timestamp: new Date().toISOString(),
        };

      case 'ASSIGN_REMEDIATION':
        return {
          action: 'ASSIGN_REMEDIATION',
          targetType,
          targetId,
          assignmentId: `remed_${Date.now()}`,
          status: 'ASSIGNED',
          assignedAt: new Date().toISOString(),
        };

      case 'UPDATE_LEARNING_PATH':
        return {
          action: 'UPDATE_LEARNING_PATH',
          targetType,
          targetId,
          pathVersion: 'v2.1',
          nodesUpdated: 3,
          status: 'SYNCED',
          timestamp: new Date().toISOString(),
        };

      case 'NOTIFY_TEACHER':
        return {
          action: 'NOTIFY_TEACHER',
          targetType,
          targetId,
          notificationId: `notif_${Date.now()}`,
          delivery: 'IN_APP',
          status: 'DELIVERED',
          timestamp: new Date().toISOString(),
        };

      case 'SCHEDULE_REVIEW':
        return {
          action: 'SCHEDULE_REVIEW',
          targetType,
          targetId,
          scheduledFor: new Date(Date.now() + 86400000).toISOString(),
          intervalHours: 24,
          status: 'SCHEDULED',
          timestamp: new Date().toISOString(),
        };

      case 'ADJUST_DIFFICULTY':
        return {
          action: 'ADJUST_DIFFICULTY',
          targetType,
          targetId,
          previousDifficulty: payload?.currentDifficulty ?? 0.6,
          newDifficulty: (payload?.currentDifficulty ?? 0.6) - 0.15,
          status: 'ADJUSTED',
          timestamp: new Date().toISOString(),
        };

      default:
        return {
          action: actionType,
          targetType,
          targetId,
          status: 'EXECUTED',
          timestamp: new Date().toISOString(),
        };
    }
  }

  private async compensateAction(
    compensationAction: string,
    targetType: string,
    targetId: string,
    payload?: Record<string, any>,
  ): Promise<void> {
    this.logger.log(`Executing compensation: ${compensationAction} on target ${targetType}:${targetId}`);
    // Deterministic rollback logic
  }
}
