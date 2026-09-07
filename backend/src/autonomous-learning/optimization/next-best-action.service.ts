import { Injectable } from '@nestjs/common';
import { filterUnsafeActions } from '../actions/action-policy.service';

export interface ActionCandidate {
  type: string;
  score: number;
  confidence: number;
  evidenceIds: string[];
  reversible: boolean;
  requiresHumanApproval: boolean;
}

export interface ScoreActionInput {
  learningBenefit: number;
  goalAlignment: number;
  evidenceConfidence: number;
  urgency: number;
  effort: number;
  teacherPriority: number;
}

/**
 * Multi-objective score function for Next-Best-Action candidates.
 * Formula:
 * 0.30 * learningBenefit + 0.20 * goalAlignment + 0.15 * evidenceConfidence +
 * 0.15 * urgency + 0.10 * teacherPriority + 0.10 * (1 - effort)
 */
export function scoreAction(input: ScoreActionInput): number {
  return (
    input.learningBenefit * 0.30 +
    input.goalAlignment * 0.20 +
    input.evidenceConfidence * 0.15 +
    input.urgency * 0.15 +
    input.teacherPriority * 0.10 +
    (1 - input.effort) * 0.10
  );
}

/**
 * Selects highest-scoring safe action candidate.
 */
export function selectBestAction(
  candidates: ActionCandidate[],
): ActionCandidate | null {
  if (candidates.length === 0) {
    return null;
  }

  const safeCandidates = filterUnsafeActions(candidates);
  if (safeCandidates.length === 0) {
    return null;
  }

  return [...safeCandidates].sort((a, b) => b.score - a.score)[0];
}

@Injectable()
export class NextBestActionService {
  /**
   * Evaluates candidates, filters forbidden actions, and selects the top action.
   */
  evaluateCandidates(candidates: ActionCandidate[]): ActionCandidate | null {
    return selectBestAction(candidates);
  }

  /**
   * Scores an individual action candidate.
   */
  scoreCandidate(input: ScoreActionInput): number {
    return scoreAction(input);
  }
}
