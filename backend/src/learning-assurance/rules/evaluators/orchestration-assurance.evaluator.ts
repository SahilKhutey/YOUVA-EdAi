import { Injectable } from '@nestjs/common';
import { ExecutionGateResult } from '../../domain/assurance.types';

@Injectable()
export class OrchestrationAssuranceEvaluator {
  evaluateExecutionGate(gate: {
    orchestrationId: string;
    workflowValid: boolean;
    policyValid: boolean;
    authorizationValid: boolean;
    scopeValid: boolean;
    dependenciesValid: boolean;
    versionValid: boolean;
    killSwitchActive?: boolean;
  }): ExecutionGateResult {
    const reasons: string[] = [];

    if (!gate.workflowValid) reasons.push('Workflow definition is invalid or unverified.');
    if (!gate.policyValid) reasons.push('Policy validation failed for orchestration.');
    if (!gate.authorizationValid) reasons.push('Actor lacks authorization to trigger orchestration.');
    if (!gate.scopeValid) reasons.push('ORCH-001: Scope escalation violation detected.');
    if (!gate.dependenciesValid) reasons.push('Workflow step dependencies are not satisfied.');
    if (!gate.versionValid) reasons.push('Workflow version mismatch or deprecated.');
    if (gate.killSwitchActive) reasons.push('Emergency kill switch is active.');

    let status: 'ALLOW' | 'PAUSE' | 'BLOCK' = 'ALLOW';

    if (!gate.scopeValid || !gate.authorizationValid) {
      status = 'BLOCK';
    } else if (gate.killSwitchActive || !gate.dependenciesValid || !gate.workflowValid || !gate.policyValid || !gate.versionValid) {
      status = 'PAUSE';
    }

    return {
      orchestrationId: gate.orchestrationId,
      workflowValid: gate.workflowValid,
      policyValid: gate.policyValid,
      authorizationValid: gate.authorizationValid,
      scopeValid: gate.scopeValid,
      dependenciesValid: gate.dependenciesValid,
      versionValid: gate.versionValid,
      status,
      reasons,
    };
  }
}
