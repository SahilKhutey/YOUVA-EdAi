import { Injectable, Logger } from '@nestjs/common';
import { SpacedRepetitionItem } from './personalization-types';

@Injectable()
export class SpacedRepetitionService {
  private readonly logger = new Logger(SpacedRepetitionService.name);

  /**
   * Calculates retention risk index R in [0.0, 1.0] based on exponential forgetting curve.
   * R = 1.0 - exp(-elapsedDays / intervalDays)
   */
  calculateRetentionRisk(lastReviewedAt: Date, intervalDays: number): number {
    const elapsedDays = Math.max(0, (Date.now() - lastReviewedAt.getTime()) / (1000 * 60 * 60 * 24));
    if (intervalDays <= 0) return 1.0;
    const risk = 1.0 - Math.exp(-elapsedDays / intervalDays);
    return Math.round(Math.min(1.0, Math.max(0.0, risk)) * 1000) / 1000;
  }

  /**
   * Updates spaced repetition schedule using modified SM-2 algorithm.
   * @param item current schedule state
   * @param quality 0-5 response rating (0-2 fail, 3-5 pass)
   */
  updateSchedule(item: SpacedRepetitionItem, quality: number): SpacedRepetitionItem {
    let { intervalDays, easeFactor, repetitionNumber } = item;

    if (quality < 3) {
      // Failed recall: reset repetition interval
      repetitionNumber = 0;
      intervalDays = 1;
    } else {
      // Successful recall: advance interval
      if (repetitionNumber === 0) {
        intervalDays = 1;
      } else if (repetitionNumber === 1) {
        intervalDays = 3;
      } else if (repetitionNumber === 2) {
        intervalDays = 7;
      } else if (repetitionNumber === 3) {
        intervalDays = 14;
      } else {
        intervalDays = Math.round(intervalDays * easeFactor);
      }
      repetitionNumber += 1;
    }

    // Adjust ease factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    easeFactor = Math.max(1.3, Math.round(easeFactor * 100) / 100);

    const now = new Date();
    const nextReview = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    return {
      topicId: item.topicId,
      intervalDays,
      easeFactor,
      repetitionNumber,
      lastReviewedAt: now.toISOString(),
      nextReviewDate: nextReview.toISOString(),
      retentionRisk: 0.0, // Freshly reviewed
    };
  }

  /**
   * Identifies topics due for spaced retrieval practice.
   */
  getDueRetrievalTopics(items: SpacedRepetitionItem[], riskThreshold = 0.50): SpacedRepetitionItem[] {
    const now = new Date();
    return items.filter((item) => {
      const isDueDatePast = new Date(item.nextReviewDate).getTime() <= now.getTime();
      const currentRisk = this.calculateRetentionRisk(new Date(item.lastReviewedAt), item.intervalDays);
      return isDueDatePast || currentRisk >= riskThreshold;
    });
  }
}
