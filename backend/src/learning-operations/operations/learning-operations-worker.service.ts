import { Injectable } from '@nestjs/common';
import { LearningSignalService } from '../signals/signal.service';
import { InterventionOrchestratorService } from '../intervention/intervention-orchestrator.service';
import { LearningOperationsService } from './learning-operations.service';

@Injectable()
export class LearningOperationsWorker {
  constructor(
    private readonly signalService: LearningSignalService,
    private readonly interventionService: InterventionOrchestratorService,
    private readonly operationsService: LearningOperationsService,
  ) {}

  /**
   * Processes domain events asynchronously with strict idempotency protection.
   */
  async process(event: { id: string; type: string; payload: any }) {
    const isNew = await this.operationsService.processOnce(event.id, event.type);
    if (!isNew) {
      return { skipped: true, reason: 'DUPLICATE_EVENT' };
    }

    switch (event.type) {
      case 'learning.evidence.recorded':
        await this.signalService.processEvidence(event.payload);
        break;

      case 'mastery.updated':
        await this.signalService.processMastery(event.payload);
        break;

      default:
        break;
    }

    return { processed: true, eventId: event.id };
  }
}
