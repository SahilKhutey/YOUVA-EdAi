import { Injectable, Logger } from '@nestjs/common';
import { ParentCoPilotSummary, AgeBand } from './early-childhood-types';
import { AgePolicyService } from './age-policy.service';

@Injectable()
export class ParentCoPilotService {
  private readonly logger = new Logger(ParentCoPilotService.name);

  constructor(private readonly agePolicyService: AgePolicyService) {}

  /**
   * Generates a supportive, jargon-free learning progress summary for parents (Clause N13.38).
   * Strips internal probabilistic BKT equations and replaces them with actionable guidance.
   */
  generateParentSummary(params: {
    learnerId: string;
    learnerName: string;
    internalMasteryScore: number; // e.g. 0.68
    totalMinutesUsed: number; // e.g. 12.5
    completedActivitiesCount: number;
    safetyAlertsCount?: number;
    recentDomain: string; // e.g. 'NUMERACY'
  }): ParentCoPilotSummary {
    const policy = this.agePolicyService.getPolicyForLearner(params.learnerId);

    // Human translation of internal BKT scores (Clause N13.38)
    let humanReadableProgress = '';
    if (params.internalMasteryScore >= 0.80) {
      humanReadableProgress = `${params.learnerName} has shown strong confidence with ${params.recentDomain.toLowerCase()} concepts and is excited to try creative challenges!`;
    } else if (params.internalMasteryScore >= 0.50) {
      humanReadableProgress = `${params.learnerName} is making steady progress with ${params.recentDomain.toLowerCase()} and enjoys exploring step-by-step with gentle guidance.`;
    } else {
      humanReadableProgress = `${params.learnerName} is just beginning with ${params.recentDomain.toLowerCase()}. Short, fun practice sessions together will build great confidence!`;
    }

    // Suggested adult offline support
    const suggestedHomeSupport = [
      'Celebrate effort and curiosity rather than just getting answers right.',
      'Try a 5-minute offline counting or rhyming game during dinner or storytime.',
      'Ask open questions like: "What was your favorite story character today?"',
    ];

    // Screen-time status evaluation (Clause N13.42)
    let screenTimeStatus: 'HEALTHY' | 'BREAK_RECOMMENDED' | 'LIMIT_REACHED' = 'HEALTHY';
    if (params.totalMinutesUsed >= policy.maxSessionMinutes) {
      screenTimeStatus = 'LIMIT_REACHED';
    } else if (params.totalMinutesUsed >= policy.maxSessionMinutes * 0.75) {
      screenTimeStatus = 'BREAK_RECOMMENDED';
    }

    return {
      learnerId: params.learnerId,
      learnerName: params.learnerName,
      ageBand: policy.ageBand,
      learningTimeMinutes: params.totalMinutesUsed,
      completedActivitiesCount: params.completedActivitiesCount,
      humanReadableProgress,
      suggestedHomeSupport,
      safetyAlertsCount: params.safetyAlertsCount || 0,
      screenTimeStatus,
    };
  }
}
