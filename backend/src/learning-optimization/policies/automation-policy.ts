import { ForbiddenException } from '@nestjs/common';
import { ActionRiskClass, ExecutionPolicy } from './execution-policy';
import { ActionType } from '../domain/improvement-action';

export class AutomationPolicy {
  /**
   * System default automation level is 0 (Observation only).
   */
  private static currentAutomationLevel = 0;

  static setAutomationLevel(level: number): void {
    if (level < 0 || level > 3) {
      throw new Error(`Invalid automation level: ${level}. Must be 0, 1, 2, or 3.`);
    }
    this.currentAutomationLevel = level;
  }

  static getAutomationLevel(): number {
    return this.currentAutomationLevel;
  }

  /**
   * Verifies if an action type can be executed automatically under the current automation level.
   */
  static assertPermittedForAutomation(type: ActionType): void {
    const riskClass = ExecutionPolicy.classifyAction(type);

    if (this.currentAutomationLevel === 0) {
      // Level 0: Observation only
      if (riskClass !== ActionRiskClass.CLASS_A_READ_ONLY) {
        throw new ForbiddenException(
          `Automation Policy Violation: At Level 0 (Observation), only Class A read-only actions are permitted.`,
        );
      }
    } else if (this.currentAutomationLevel === 1) {
      // Level 1: Recommendation
      if (
        riskClass !== ActionRiskClass.CLASS_A_READ_ONLY &&
        riskClass !== ActionRiskClass.CLASS_B_DERIVED_MODIFICATION
      ) {
        throw new ForbiddenException(
          `Automation Policy Violation: At Level 1 (Recommendation), only Class A/B actions are permitted.`,
        );
      }
    } else if (this.currentAutomationLevel === 2) {
      // Level 2: Draft Generation
      if (
        riskClass === ActionRiskClass.CLASS_D_CANONICAL_CHANGE ||
        riskClass === ActionRiskClass.CLASS_E_HIGH_IMPACT_LEARNER
      ) {
        throw new ForbiddenException(
          `Automation Policy Violation: At Level 2 (Draft), Class D canonical changes and Class E mutations are strictly forbidden.`,
        );
      }
    }
    // Level 3 allows controlled execution of Class A, B, and authorized Class C. Class D still requires human approval.
  }
}
