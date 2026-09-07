import { Injectable } from '@nestjs/common';

export enum SafetySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum SafetyDecision {
  CONTINUE = 'CONTINUE',
  TEACHER_REVIEW = 'TEACHER_REVIEW',
  ESCALATE = 'ESCALATE',
}

@Injectable()
export class SafetyPolicyService {
  /**
   * Evaluates a safety signal deterministically.
   * Safety policy gates must never allow unvalidated AI models alone to dismiss safety events.
   */
  evaluate(input: {
    category: string;
    confidence: number;
    severity?: SafetySeverity;
  }): SafetyDecision {
    const severity = input.severity ?? this.inferSeverity(input.category);

    if (
      severity === SafetySeverity.CRITICAL ||
      (severity === SafetySeverity.HIGH && input.confidence >= 0.7)
    ) {
      return SafetyDecision.ESCALATE;
    }

    if (
      severity === SafetySeverity.HIGH ||
      (severity === SafetySeverity.MEDIUM && input.confidence >= 0.8)
    ) {
      return SafetyDecision.TEACHER_REVIEW;
    }

    return SafetyDecision.CONTINUE;
  }

  inferSeverity(category: string): SafetySeverity {
    const normalized = category.toUpperCase();

    if (
      normalized.includes('SELF_HARM') ||
      normalized.includes('IMMEDIATE_DANGER')
    ) {
      return SafetySeverity.CRITICAL;
    }

    if (
      normalized.includes('ABUSE') ||
      normalized.includes('SEXUAL') ||
      normalized.includes('BULLYING')
    ) {
      return SafetySeverity.HIGH;
    }

    if (
      normalized.includes('DISTRESS') ||
      normalized.includes('HARASSMENT')
    ) {
      return SafetySeverity.MEDIUM;
    }

    return SafetySeverity.LOW;
  }
}
