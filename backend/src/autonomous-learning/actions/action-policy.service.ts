import { Injectable } from '@nestjs/common';

export enum AutonomyLevel {
  NONE = 'NONE',
  ASSISTED = 'ASSISTED',
  AUTO_REVERSIBLE = 'AUTO_REVERSIBLE',
  AUTO_LOW_RISK = 'AUTO_LOW_RISK',
  HUMAN_REQUIRED = 'HUMAN_REQUIRED',
  BLOCKED = 'BLOCKED',
}

export interface LearningAction {
  id: string;
  learnerId: string;
  tenantId: string;
  type: string;
  parameters: Record<string, unknown>;
  rationale: string;
  evidenceIds: string[];
  confidence: number;
  autonomyLevel: AutonomyLevel;
  reversible: boolean;
  expiresAt?: string;
}

export const ACTION_POLICY = {
  CHANGE_DIFFICULTY: {
    reversible: true,
    humanRequired: false,
    autonomyLevel: AutonomyLevel.AUTO_LOW_RISK,
  },
  RECOMMEND_PRACTICE: {
    reversible: true,
    humanRequired: false,
    autonomyLevel: AutonomyLevel.AUTO_LOW_RISK,
  },
  GENERATE_HINT: {
    reversible: true,
    humanRequired: false,
    autonomyLevel: AutonomyLevel.AUTO_LOW_RISK,
  },
  SCHEDULE_REVISION: {
    reversible: true,
    humanRequired: false,
    autonomyLevel: AutonomyLevel.AUTO_REVERSIBLE,
  },
  TEACHER_INTERVENTION: {
    reversible: true,
    humanRequired: true,
    autonomyLevel: AutonomyLevel.ASSISTED,
  },
  CHANGE_CURRICULUM: {
    reversible: false,
    humanRequired: true,
    autonomyLevel: AutonomyLevel.HUMAN_REQUIRED,
  },
  CHANGE_CONSENT: {
    reversible: false,
    humanRequired: true,
    blockedForAI: true,
    autonomyLevel: AutonomyLevel.BLOCKED,
  },
  CHANGE_ROLE: {
    reversible: false,
    humanRequired: true,
    blockedForAI: true,
    autonomyLevel: AutonomyLevel.BLOCKED,
  },
  CERTIFY_MASTERY: {
    reversible: false,
    humanRequired: true,
    blockedForAI: true,
    autonomyLevel: AutonomyLevel.BLOCKED,
  },
  CLOSE_SAFETY_INCIDENT: {
    reversible: false,
    humanRequired: true,
    blockedForAI: true,
    autonomyLevel: AutonomyLevel.BLOCKED,
  },
} as const;

/**
 * Hard safety filter: Removes actions that are strictly forbidden for autonomous AI execution.
 */
export function filterUnsafeActions<T extends { type: string }>(
  candidates: T[],
): T[] {
  return candidates.filter(
    (candidate) =>
      candidate.type !== 'CHANGE_CONSENT' &&
      candidate.type !== 'CHANGE_ROLE' &&
      candidate.type !== 'CERTIFY_MASTERY' &&
      candidate.type !== 'CLOSE_SAFETY_INCIDENT',
  );
}

@Injectable()
export class ActionPolicyRegistryService {
  getPolicy(actionType: string) {
    return (ACTION_POLICY as Record<string, any>)[actionType] ?? {
      reversible: false,
      humanRequired: true,
      autonomyLevel: AutonomyLevel.HUMAN_REQUIRED,
    };
  }

  isBlockedForAI(actionType: string): boolean {
    const policy = this.getPolicy(actionType);
    return Boolean(policy.blockedForAI);
  }
}
