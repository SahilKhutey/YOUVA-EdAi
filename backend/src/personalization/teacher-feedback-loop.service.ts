import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  TeacherFeedbackRecord,
  TeacherFeedbackAction,
  TeacherOverrideReasonCode,
} from './personalization-types';

export interface OverrideAnalyticsSummary {
  totalReviewed: number;
  acceptedCount: number;
  modifiedCount: number;
  rejectedCount: number;
  overrideRatePct: number;
  reasonDistribution: Record<TeacherOverrideReasonCode, number>;
  statusIndicator: 'NORMAL' | 'HIGH_OVERRIDE_WARNING' | 'EXTREME_ALARM';
  checksumSha256: string;
}

@Injectable()
export class TeacherFeedbackLoopService {
  private readonly logger = new Logger(TeacherFeedbackLoopService.name);
  private readonly feedbackStore = new Map<string, TeacherFeedbackRecord>();

  /**
   * Records a teacher review, authorization, modification, or rejection.
   */
  recordFeedback(record: TeacherFeedbackRecord): { recorded: boolean; feedbackId: string; hash: string } {
    const serialized = JSON.stringify(record);
    const hash = crypto.createHash('sha256').update(serialized).digest('hex');
    this.feedbackStore.set(record.id, record);

    this.logger.log(
      `Teacher feedback recorded [${record.id}]: action=${record.action}, reason=${record.reasonCode}, teacher=${record.teacherId}`,
    );

    return { recorded: true, feedbackId: record.id, hash };
  }

  getFeedbackById(id: string): TeacherFeedbackRecord | undefined {
    return this.feedbackStore.get(id);
  }

  getAllFeedback(): TeacherFeedbackRecord[] {
    return Array.from(this.feedbackStore.values());
  }

  /**
   * Computes comprehensive teacher override analytics (N10.12).
   */
  getOverrideAnalytics(): OverrideAnalyticsSummary {
    const records = this.getAllFeedback();
    const totalReviewed = records.length;

    let acceptedCount = 0;
    let modifiedCount = 0;
    let rejectedCount = 0;

    const reasonDistribution: Record<TeacherOverrideReasonCode, number> = {
      INCORRECT_DIAGNOSIS: 0,
      WRONG_DIFFICULTY: 0,
      WRONG_CONTENT: 0,
      LEARNER_CONTEXT: 0,
      TIMING_ISSUE: 0,
      ALREADY_MASTERED: 0,
      INSUFFICIENT_EVIDENCE: 0,
      OTHER: 0,
    };

    for (const r of records) {
      if (r.action === 'ACCEPT') acceptedCount++;
      else if (r.action === 'MODIFY') modifiedCount++;
      else if (r.action === 'REJECT') rejectedCount++;

      if (r.action !== 'ACCEPT') {
        reasonDistribution[r.reasonCode] = (reasonDistribution[r.reasonCode] || 0) + 1;
      }
    }

    const overriddenCount = modifiedCount + rejectedCount;
    const overrideRatePct = totalReviewed > 0 ? Math.round((overriddenCount / totalReviewed) * 1000) / 10 : 0;

    let statusIndicator: 'NORMAL' | 'HIGH_OVERRIDE_WARNING' | 'EXTREME_ALARM' = 'NORMAL';
    if (overrideRatePct > 40.0) {
      statusIndicator = 'EXTREME_ALARM';
    } else if (overrideRatePct > 25.0) {
      statusIndicator = 'HIGH_OVERRIDE_WARNING';
    }

    const checksumSha256 = crypto
      .createHash('sha256')
      .update(JSON.stringify({ totalReviewed, acceptedCount, modifiedCount, rejectedCount, reasonDistribution }))
      .digest('hex');

    return {
      totalReviewed,
      acceptedCount,
      modifiedCount,
      rejectedCount,
      overrideRatePct,
      reasonDistribution,
      statusIndicator,
      checksumSha256,
    };
  }

  /**
   * Extracts labeled evaluation dataset for offline counterfactual policy simulation (N10.46).
   */
  exportLabeledEvaluationDataset(): Array<{
    recommendationId: string;
    action: TeacherFeedbackAction;
    reasonCode: TeacherOverrideReasonCode;
    notes?: string;
  }> {
    return this.getAllFeedback().map((f) => ({
      recommendationId: f.recommendationId,
      action: f.action,
      reasonCode: f.reasonCode,
      notes: f.teacherNotes,
    }));
  }
}
