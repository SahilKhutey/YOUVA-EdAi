import { Injectable } from '@nestjs/common';
import { AdaptiveActionType } from '../decision/decision.types';

@Injectable()
export class InterventionService {
  /**
   * Evaluates struggle indicators to determine the appropriate intervention level (0 - 6).
   * Level 0: Normal learning
   * Level 1: Additional example
   * Level 2: Hint
   * Level 3: Simplified explanation
   * Level 4: Guided practice
   * Level 5: Prerequisite remediation
   * Level 6: Teacher intervention
   */
  determineLevel(
    consecutiveFailures: number,
    hintCount: number = 0,
    attemptNumber: number = 1,
  ): number {
    if (consecutiveFailures >= 5 || attemptNumber >= 6) {
      return 6; // Teacher intervention
    }
    if (consecutiveFailures >= 3 || attemptNumber >= 4) {
      return 5; // Prerequisite remediation
    }
    if (consecutiveFailures === 2 || (attemptNumber === 3 && hintCount >= 2)) {
      return 4; // Guided practice
    }
    if (hintCount >= 3 || attemptNumber === 3) {
      return 3; // Simplified explanation
    }
    if (hintCount === 2 || attemptNumber === 2) {
      return 2; // Hint
    }
    if (hintCount === 1) {
      return 1; // Example
    }
    return 0; // Normal learning
  }

  /**
   * Maps an intervention level to an AdaptiveActionType.
   */
  mapLevelToAction(level: number): AdaptiveActionType {
    switch (level) {
      case 1:
        return AdaptiveActionType.EXAMPLE;
      case 2:
        return AdaptiveActionType.HINT;
      case 3:
        return AdaptiveActionType.EXPLAIN;
      case 4:
        return AdaptiveActionType.PRACTICE;
      case 5:
        return AdaptiveActionType.REMEDIATE;
      case 6:
        return AdaptiveActionType.TEACHER_INTERVENTION;
      default:
        return AdaptiveActionType.CONTINUE;
    }
  }

  escalate(currentLevel: number): number {
    return Math.min(currentLevel + 1, 6);
  }

  deescalate(currentLevel: number): number {
    return Math.max(currentLevel - 1, 0);
  }
}
