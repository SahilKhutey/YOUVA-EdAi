import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GateState, EscalationSeverity } from '../domain/enums';
import { PolicyGateResult, PolicyRuleEvaluation, StudentLearningContext } from '../domain/types';

@Injectable()
export class PolicyEngineService {
  private readonly logger = new Logger(PolicyEngineService.name);

  // Policy Thresholds
  private readonly COGNITIVE_LOAD_LIMIT = 0.85;
  private readonly ERROR_CLUSTER_LIMIT = 0.75;
  private readonly REPEATED_FAILURE_THRESHOLD = 3;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Evaluates the Human-AI policy gate for a student.
   * Enforces safety boundaries, cognitive fatigue thresholds, and human-in-the-loop triggers.
   */
  async evaluateGate(
    userId: string,
    topicId: string,
    context?: StudentLearningContext,
  ): Promise<PolicyGateResult> {
    const ruleEvaluations: PolicyRuleEvaluation[] = [];

    // 1. Check for any unresolved Safety Escalations
    const activeEscalation = await this.prisma.escalationEvent.findFirst({
      where: {
        userId,
        status: { in: ['OPEN', 'IN_REVIEW'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (activeEscalation) {
      ruleEvaluations.push({
        ruleName: 'UNRESOLVED_SAFETY_ESCALATION',
        passed: false,
        severity: activeEscalation.severity as EscalationSeverity,
        reason: `Active escalation found (${activeEscalation.id}): ${activeEscalation.reason}. AI execution is locked.`,
      });

      return {
        gateState: GateState.SAFETY_ESCALATION,
        reason: activeEscalation.reason,
        ruleEvaluations,
        requiresTeacherReview: true,
        requiresSafetyEscalation: true,
        escalationSeverity: activeEscalation.severity as EscalationSeverity,
      };
    }

    // 2. Evaluate Working Memory / Cognitive Overload
    const cognitiveLoad = context?.cognitiveLoad ?? 0.0;
    if (cognitiveLoad >= this.COGNITIVE_LOAD_LIMIT) {
      ruleEvaluations.push({
        ruleName: 'COGNITIVE_OVERLOAD_PREVENTION',
        passed: false,
        severity: EscalationSeverity.MEDIUM,
        reason: `Student cognitive load (${cognitiveLoad.toFixed(2)}) exceeds safe threshold (${this.COGNITIVE_LOAD_LIMIT}). Teacher intervention required.`,
      });

      return {
        gateState: GateState.TEACHER_REVIEW_REQUIRED,
        reason: 'Student cognitive load exceeds maximum threshold. Pausing AI session for human educator review.',
        ruleEvaluations,
        requiresTeacherReview: true,
        requiresSafetyEscalation: false,
      };
    }

    // 3. Evaluate Error Clustering & Frustration
    const errorClusterScore = context?.errorClusterScore ?? 0.0;
    const recentFailures = context?.recentMistakes?.length ?? 0;
    if (
      errorClusterScore >= this.ERROR_CLUSTER_LIMIT &&
      recentFailures >= this.REPEATED_FAILURE_THRESHOLD
    ) {
      ruleEvaluations.push({
        ruleName: 'ERROR_CLUSTERING_INTERVENTION',
        passed: false,
        severity: EscalationSeverity.LOW,
        reason: `Student exhibits high error clustering (${errorClusterScore.toFixed(2)}) with ${recentFailures} consecutive mistakes.`,
      });

      return {
        gateState: GateState.TEACHER_REVIEW_REQUIRED,
        reason: 'System detected repeated systematic misconception pattern requiring pedagogical teacher guidance.',
        ruleEvaluations,
        requiresTeacherReview: true,
        requiresSafetyEscalation: false,
      };
    }

    // 4. Default: AI is clear to continue
    ruleEvaluations.push({
      ruleName: 'NOMINAL_LEARNING_METRICS',
      passed: true,
      reason: 'All learning metrics and safety parameters within nominal boundaries.',
    });

    return {
      gateState: GateState.AI_CONTINUE,
      reason: 'Safe to proceed with AI learning interaction.',
      ruleEvaluations,
      requiresTeacherReview: false,
      requiresSafetyEscalation: false,
    };
  }

  /**
   * Invariant Enforcement: AI can NEVER certify topic or skill mastery.
   * Only human teachers or formal proctored assessment sessions may certify mastery.
   */
  enforceMasteryCertificationRule(isProposedCertified: boolean): boolean {
    if (isProposedCertified) {
      this.logger.warn('AI attempt to certify mastery intercepted and rejected by Policy Engine.');
    }
    // Hard invariant: returns false always for AI recommendations
    return false;
  }
}
