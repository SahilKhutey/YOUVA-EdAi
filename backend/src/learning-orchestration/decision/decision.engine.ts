import { Injectable, Logger } from '@nestjs/common';
import {
  AdaptiveActionType,
  AdaptiveCandidate,
  AdaptiveLearningAction,
  AdaptivePolicy,
  AdaptiveReasonCode,
  CandidateScore,
} from './decision.types';
import { CURRENT_POLICY_VERSION } from './decision.policy';

@Injectable()
export class DecisionEngine {
  private readonly logger = new Logger(DecisionEngine.name);

  /**
   * Scores eligible candidates and selects the single most appropriate AdaptiveLearningAction.
   */
  decide(
    candidates: AdaptiveCandidate[],
    learnerId: string,
    policy: AdaptivePolicy,
    tenantId: string = 'default-tenant',
    sourceKnowledgeId?: string,
  ): AdaptiveLearningAction {
    if (!candidates || candidates.length === 0) {
      // Fallback: Continue current knowledge or baseline discovery
      const fallbackId = sourceKnowledgeId || 'default-knowledge';
      return {
        id: `act-${Date.now()}`,
        learnerId,
        tenantId,
        sourceKnowledgeId,
        targetKnowledgeId: fallbackId,
        action: AdaptiveActionType.CONTINUE,
        reasonCode: AdaptiveReasonCode.CURRICULUM_SEQUENCE,
        reasonMessage: 'Continue following the structured curriculum pathway.',
        priority: 50,
        confidence: 0.8,
        required: false,
        decisionId: `dec-${Date.now()}`,
        policyVersion: CURRENT_POLICY_VERSION,
        createdAt: new Date(),
      };
    }

    // Score all candidates
    const scored = candidates.map((cand) => ({
      candidate: cand,
      score: this.scoreCandidate(cand),
    }));

    // Sort by totalScore desc, then priority desc, then required desc
    scored.sort((a, b) => {
      if (b.score.totalScore !== a.score.totalScore) {
        return b.score.totalScore - a.score.totalScore;
      }
      if (b.candidate.priority !== a.candidate.priority) {
        return b.candidate.priority - a.candidate.priority;
      }
      return (b.candidate.required ? 1 : 0) - (a.candidate.required ? 1 : 0);
    });

    const winning = scored[0].candidate;
    const reasonCode = winning.reasonCodes[0] || AdaptiveReasonCode.CURRICULUM_SEQUENCE;
    const reasonMessage = this.buildReasonMessage(winning.action, reasonCode);

    return {
      id: `act-${Date.now()}`,
      learnerId,
      tenantId,
      sourceKnowledgeId,
      targetKnowledgeId: winning.knowledgeId,
      action: winning.action,
      reasonCode,
      reasonMessage,
      priority: winning.priority,
      confidence: winning.confidence ?? 0.85,
      required: winning.required,
      decisionId: `dec-${Date.now()}`,
      policyVersion: CURRENT_POLICY_VERSION,
      createdAt: new Date(),
    };
  }

  private scoreCandidate(cand: AdaptiveCandidate): CandidateScore {
    let teacherPriority = cand.source === 'TEACHER_PATH' ? 1.0 : 0.0;
    let assignmentFit = cand.source === 'ASSIGNMENT' ? 0.95 : 0.0;
    let prerequisiteFit = cand.action === AdaptiveActionType.REMEDIATE ? 0.9 : 0.0;
    let struggleNeed = cand.reasonCodes.includes(AdaptiveReasonCode.REPEATED_ERROR) ? 0.85 : 0.0;
    let reviewNeed = cand.action === AdaptiveActionType.REVIEW ? 0.75 : 0.0;
    let masteryNeed = cand.action === AdaptiveActionType.PRACTICE ? 0.7 : 0.0;
    let curriculumFit = cand.action === AdaptiveActionType.ADVANCE ? 0.8 : 0.5;
    let learnerPreferenceFit = 0.5;

    // Weighted aggregation
    const totalScore =
      cand.priority * 10 +
      teacherPriority * 200 +
      assignmentFit * 90 +
      prerequisiteFit * 85 +
      struggleNeed * 80 +
      curriculumFit * 70 +
      reviewNeed * 65 +
      masteryNeed * 60 +
      learnerPreferenceFit * 10;

    return {
      curriculumFit,
      assignmentFit,
      prerequisiteFit,
      masteryNeed,
      reviewNeed,
      struggleNeed,
      learnerPreferenceFit,
      teacherPriority,
      totalScore,
    };
  }

  private buildReasonMessage(action: AdaptiveActionType, reasonCode: AdaptiveReasonCode): string {
    switch (reasonCode) {
      case AdaptiveReasonCode.TEACHER_DIRECTED:
        return 'Directed by your teacher.';
      case AdaptiveReasonCode.ASSIGNMENT_REQUIRED:
        return 'Required course assignment.';
      case AdaptiveReasonCode.PREREQUISITE_NOT_READY:
        return 'Prerequisite concept needs strengthening before advancing.';
      case AdaptiveReasonCode.REPEATED_ERROR:
        return 'Let’s review the foundational principles to resolve repeated errors.';
      case AdaptiveReasonCode.INSUFFICIENT_EVIDENCE:
        return 'More practice is needed to confirm mastery before moving on.';
      case AdaptiveReasonCode.READY_TO_ADVANCE:
        return 'Demonstrated strong mastery and confidence; ready for the next concept!';
      case AdaptiveReasonCode.REVIEW_DUE:
        return 'Scheduled spaced review to ensure long-term retention.';
      case AdaptiveReasonCode.SESSION_RESUME:
        return 'Resuming your previous learning session.';
      case AdaptiveReasonCode.EXTENSION_AVAILABLE:
        return 'Extension and challenge content available for advanced exploration.';
      default:
        return 'Recommended next step based on your current learning trajectory.';
    }
  }
}
