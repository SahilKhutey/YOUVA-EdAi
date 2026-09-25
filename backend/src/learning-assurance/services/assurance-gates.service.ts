import { Injectable, Logger } from '@nestjs/common';
import {
  AssuranceGate,
  ExecutionGateResult,
  GateStatus,
} from '../domain/assurance.types';
import { AssuranceEvaluationService } from './assurance-evaluation.service';
import { OrchestrationAssuranceEvaluator } from '../rules/evaluators/orchestration-assurance.evaluator';

@Injectable()
export class AssuranceGatesService {
  private readonly logger = new Logger(AssuranceGatesService.name);

  constructor(
    private readonly evaluationService: AssuranceEvaluationService,
    private readonly orchestrationEvaluator: OrchestrationAssuranceEvaluator,
  ) {}

  async evaluatePublicationGate(
    targetType: string,
    targetId: string,
    payload: any = {},
  ): Promise<AssuranceGate> {
    this.logger.log(`Evaluating pre-publication assurance gate for ${targetType}:${targetId}`);

    const evaluation = await this.evaluationService.evaluateTarget({
      targetType,
      targetId,
      domains: ['KNOWLEDGE', 'ASSESSMENT', 'AI', 'SECURITY'],
      payload,
    });

    const checks = (evaluation.result?.checks as Array<any>) || [];
    const checkNames = checks.map((c) => c.checkId);
    const requiredChecks = ['KNOW-002', 'KNOW-003', 'AI-002', 'SEC-001'];

    let status: GateStatus = 'PASSED';
    const reasons: string[] = [];

    for (const check of checks) {
      if (check.status === 'FAIL' && check.severity === 'CRITICAL') {
        status = 'BLOCKED';
        reasons.push(`Critical failure: ${check.message}`);
      } else if (check.status === 'FAIL') {
        status = 'FAILED';
        reasons.push(`Failure: ${check.message}`);
      } else if (check.status === 'WARNING' && status !== 'BLOCKED' && status !== 'FAILED') {
        status = 'WARNING';
        reasons.push(`Quality warning: ${check.message}`);
      }
    }

    return {
      targetType,
      targetId,
      checks: checkNames,
      requiredChecks,
      status,
      policyVersion: '1.0.0',
      evaluatedAt: new Date(),
      reasons,
    };
  }

  evaluateExecutionGate(
    orchestrationId: string,
    gateParams: {
      workflowValid: boolean;
      policyValid: boolean;
      authorizationValid: boolean;
      scopeValid: boolean;
      dependenciesValid: boolean;
      versionValid: boolean;
      killSwitchActive?: boolean;
    },
  ): ExecutionGateResult {
    this.logger.log(`Evaluating pre-execution assurance gate for orchestration ${orchestrationId}`);
    return this.orchestrationEvaluator.evaluateExecutionGate({
      orchestrationId,
      ...gateParams,
    });
  }
}
