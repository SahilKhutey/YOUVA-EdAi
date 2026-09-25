import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface LoopValidationResult {
  allowed: boolean;
  loopDetected: boolean;
  reason?: string;
}

@Injectable()
export class LoopPreventionPolicy {
  private readonly logger = new Logger(LoopPreventionPolicy.name);
  public static readonly MAX_DEPTH = 3;
  public static readonly MAX_STEP_RETRIES = 2;
  public static readonly REPETITION_THRESHOLD = 3;
  public static readonly WINDOW_HOURS = 24;

  constructor(private readonly prisma: PrismaService) {}

  checkDepth(depth = 0): LoopValidationResult {
    if (depth > LoopPreventionPolicy.MAX_DEPTH) {
      const reason = `Maximum orchestration depth exceeded (${depth} > ${LoopPreventionPolicy.MAX_DEPTH}). Halting recursive orchestration.`;
      this.logger.warn(reason);
      return { allowed: false, loopDetected: true, reason };
    }
    return { allowed: true, loopDetected: false };
  }

  checkStepRetries(retryCount = 0): LoopValidationResult {
    if (retryCount > LoopPreventionPolicy.MAX_STEP_RETRIES) {
      const reason = `Step retry limit exceeded (${retryCount} > ${LoopPreventionPolicy.MAX_STEP_RETRIES}). Failing step without further retries.`;
      this.logger.warn(reason);
      return { allowed: false, loopDetected: true, reason };
    }
    return { allowed: true, loopDetected: false };
  }

  async checkRepetition(
    tenantId: string,
    learnerId?: string,
    workflowId?: string,
  ): Promise<LoopValidationResult> {
    if (!learnerId || !workflowId) {
      return { allowed: true, loopDetected: false };
    }

    const windowStart = new Date(Date.now() - LoopPreventionPolicy.WINDOW_HOURS * 60 * 60 * 1000);

    try {
      const recentCount = await this.prisma.learningOrchestration.count({
        where: {
          tenantId,
          learnerId,
          workflowId,
          createdAt: {
            gte: windowStart,
          },
        },
      });

      if (recentCount >= LoopPreventionPolicy.REPETITION_THRESHOLD) {
        const reason = `Repetition threshold reached: ${recentCount} orchestrations for workflow '${workflowId}' and learner '${learnerId}' within the last ${LoopPreventionPolicy.WINDOW_HOURS} hours. Pausing autonomous loop and requiring human escalation.`;
        this.logger.warn(reason);
        return { allowed: false, loopDetected: true, reason };
      }

      return { allowed: true, loopDetected: false };
    } catch (error) {
      this.logger.error(`Error during repetition check: ${(error as Error).message}`);
      // Fail closed if we cannot determine repetition status safely
      return {
        allowed: false,
        loopDetected: false,
        reason: `Could not verify repetition safety: ${(error as Error).message}`,
      };
    }
  }
}
