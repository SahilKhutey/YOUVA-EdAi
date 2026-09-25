import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { ActionType, ExecutionMode } from '../domain/improvement-action';

export enum ActionRiskClass {
  CLASS_A_READ_ONLY = 'CLASS_A_READ_ONLY',
  CLASS_B_DERIVED_MODIFICATION = 'CLASS_B_DERIVED_MODIFICATION',
  CLASS_C_DRAFT_CREATION = 'CLASS_C_DRAFT_CREATION',
  CLASS_D_CANONICAL_CHANGE = 'CLASS_D_CANONICAL_CHANGE',
  CLASS_E_HIGH_IMPACT_LEARNER = 'CLASS_E_HIGH_IMPACT_LEARNER',
}

export class ExecutionPolicy {
  /**
   * Classifies an action type into its risk class.
   */
  static classifyAction(type: ActionType): ActionRiskClass {
    switch (type) {
      case 'CREATE_KNOWLEDGE':
      case 'REVISE_KNOWLEDGE':
      case 'REVISE_ASSESSMENT':
      case 'REVISE_RELATIONSHIP':
      case 'REVISE_PATH':
        return ActionRiskClass.CLASS_D_CANONICAL_CHANGE;

      case 'ADD_EXAMPLE':
      case 'ADD_PRACTICE':
      case 'ADD_REMEDIATION':
        return ActionRiskClass.CLASS_C_DRAFT_CREATION;

      case 'CREATE_EXPERIMENT':
      case 'UPDATE_POLICY':
        return ActionRiskClass.CLASS_D_CANONICAL_CHANGE;

      default:
        return ActionRiskClass.CLASS_A_READ_ONLY;
    }
  }

  /**
   * Validates whether an action is authorized for execution.
   */
  static validateAuthorization(
    type: ActionType,
    mode: ExecutionMode,
    isPlanApproved: boolean,
    isActionApproved: boolean,
    userRole?: string,
  ): void {
    const riskClass = this.classifyAction(type);

    // Class E: Prohibited automated mutation
    if (riskClass === ActionRiskClass.CLASS_E_HIGH_IMPACT_LEARNER) {
      throw new ForbiddenException(
        `Execution Policy Violation: Class E action '${type}' (Mastery/Grading Mutation) cannot be executed automatically.`,
      );
    }

    // Class D: Canonical educational changes strictly require human approval
    if (riskClass === ActionRiskClass.CLASS_D_CANONICAL_CHANGE) {
      if (!isPlanApproved || !isActionApproved) {
        throw new ForbiddenException(
          `Execution Policy Violation: Class D action '${type}' requires explicit authorized approval before execution.`,
        );
      }
      if (mode === 'CONTROLLED_AUTOMATION') {
        throw new ForbiddenException(
          `Execution Policy Violation: Class D action '${type}' cannot be executed in CONTROLLED_AUTOMATION mode without human in the loop.`,
        );
      }
    }

    // Class C: Draft creation can be AI_ASSISTED but if plan is not approved, can only generate drafts
    if (riskClass === ActionRiskClass.CLASS_C_DRAFT_CREATION) {
      if (!isPlanApproved && mode !== 'AI_ASSISTED') {
        throw new ForbiddenException(
          `Execution Policy Violation: Class C action '${type}' requires an approved plan or AI_ASSISTED draft mode.`,
        );
      }
    }
  }
}
