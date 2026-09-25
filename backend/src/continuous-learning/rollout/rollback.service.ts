import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EvolutionRolloutDto } from '../domain/evolution.types';
import { RolloutService } from './rollout.service';

@Injectable()
export class RollbackService {
  private readonly logger = new Logger(RollbackService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rolloutService: RolloutService,
  ) {}

  async executeRollback(rolloutId: string, reason: string): Promise<EvolutionRolloutDto> {
    const rollout = await this.rolloutService.getRollout(rolloutId);

    this.logger.warn(`Initiating rollback for rollout '${rolloutId}'. Reason: ${reason}`);

    // Enforce "Rollback ≠ History Deletion" Invariant:
    // Update rollout state to ROLLED_BACK while preserving complete historical execution records
    const updated = await this.prisma.evolutionRollout.update({
      where: { id: rolloutId },
      data: {
        status: 'ROLLED_BACK',
        percentage: 0.0,
        rollbackReason: reason,
      },
    });

    this.logger.log(`Rollback completed for rollout '${rolloutId}'. Target '${rollout.targetId}' reverted to previous governed state.`);

    return {
      ...rollout,
      status: 'ROLLED_BACK',
      percentage: 0.0,
      rollbackReason: reason,
      updatedAt: updated.updatedAt,
    };
  }
}
