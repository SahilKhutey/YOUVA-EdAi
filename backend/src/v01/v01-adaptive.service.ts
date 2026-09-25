import { Injectable } from '@nestjs/common';
import { Difficulty, LearningItem } from './v01.types';
import { V01_LEARNING_ITEMS } from './v01-content';

@Injectable()
export class V01AdaptiveService {
  /**
   * Deterministic Adaptive Transition Rule (v0.1 Contract):
   * Correct:
   *   EASY -> MEDIUM
   *   MEDIUM -> HARD
   *   HARD -> HARD
   *
   * Incorrect:
   *   HARD -> MEDIUM
   *   MEDIUM -> EASY
   *   EASY -> EASY
   */
  nextDifficulty(current: Difficulty, correct: boolean): Difficulty {
    if (correct) {
      if (current === 'EASY') return 'MEDIUM';
      if (current === 'MEDIUM') return 'HARD';
      return 'HARD';
    }

    if (current === 'HARD') return 'MEDIUM';
    if (current === 'MEDIUM') return 'EASY';
    return 'EASY';
  }

  /**
   * Robust math answer normalization and evaluation:
   * Handles whitespace, case, variable prefixes (e.g. "x=6", "x = 6", "X=6", "6").
   */
  evaluateAnswer(userAnswer: string, expectedAnswer: string): boolean {
    if (!userAnswer || typeof userAnswer !== 'string') return false;

    const clean = (val: string): string => {
      let s = val.trim().toLowerCase();
      // Remove variable prefix e.g., "x=", "y=", "m=", "x ="
      s = s.replace(/^[a-z]\s*=\s*/i, '');
      // Strip spaces
      s = s.replace(/\s+/g, '');
      return s;
    };

    const cleanUser = clean(userAnswer);
    const cleanExpected = clean(expectedAnswer);

    if (cleanUser === cleanExpected) return true;

    // Numeric comparison fallback (e.g., "6.5" vs "6.50", "07" vs "7")
    const numUser = Number(cleanUser);
    const numExpected = Number(cleanExpected);
    if (!isNaN(numUser) && !isNaN(numExpected)) {
      return Math.abs(numUser - numExpected) < 1e-6;
    }

    return false;
  }

  /**
   * Selects an unencountered item matching the target difficulty.
   */
  selectNextItem(targetDifficulty: Difficulty, answeredItemIds: string[] = []): LearningItem {
    const candidates = V01_LEARNING_ITEMS.filter(
      (item) => item.difficulty === targetDifficulty && !answeredItemIds.includes(item.id),
    );

    if (candidates.length > 0) {
      return candidates[0];
    }

    // Fallback 1: Any item of target difficulty
    const sameDiff = V01_LEARNING_ITEMS.filter((item) => item.difficulty === targetDifficulty);
    if (sameDiff.length > 0) {
      return sameDiff[0];
    }

    // Fallback 2: Any first item
    return V01_LEARNING_ITEMS[0];
  }
}
