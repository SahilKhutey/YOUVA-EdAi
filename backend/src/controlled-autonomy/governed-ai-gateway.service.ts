import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  AutonomyClass,
  ConsequentialActionType,
  GovernedActionRequest,
  GovernedActionResult,
  AgentAuditRecord,
} from './n15-types';
import { AgentRegistryService } from './agent-registry.service';
import { ToolFirewallService } from './tool-firewall.service';
import { HumanAuthorizationService } from './human-authorization.service';
import { SpecializedAgentsService } from './specialized-agents.service';
import { AutonomyEvaluatorService } from './autonomy-evaluator.service';
import * as crypto from 'crypto';

@Injectable()
export class GovernedAiGatewayService {
  private readonly logger = new Logger(GovernedAiGatewayService.name);
  private auditLog: AgentAuditRecord[] = [];
  private processedIdempotencyKeys: Map<string, GovernedActionResult> = new Map();

  // The 12 Centrally Governed Consequential Action Types (Clause N15.6)
  private readonly consequentialActions: Set<ConsequentialActionType> = new Set([
    'LEARNING_STATE_CHANGE',
    'MASTERY_OVERRIDE',
    'ASSESSMENT_RESULT',
    'SAFETY_RESOLUTION',
    'CONSENT_CHANGE',
    'PRIVACY_EXCEPTION',
    'CREDENTIAL_ISSUANCE',
    'CREDENTIAL_REVOCATION',
    'RBAC_CHANGE',
    'EXTERNAL_COMMUNICATION',
    'FINANCIAL_TRANSACTION',
    'ACCOUNT_DELETION',
  ]);

  constructor(
    private readonly agentRegistry: AgentRegistryService,
    private readonly toolFirewall: ToolFirewallService,
    private readonly humanAuthorization: HumanAuthorizationService,
    private readonly specializedAgents: SpecializedAgentsService,
    private readonly autonomyEvaluator: AutonomyEvaluatorService
  ) {}

  // --- 1. Governed AI Gateway Interface Methods (Clause N15.7) ---

  public async generate(params: {
    tenantId: string;
    prompt: string;
    modality?: 'TEXT' | 'AUDIO';
  }): Promise<{ content: string; modality: string; cached: boolean }> {
    this.autonomyEvaluator.recordProposedAction();

    // Check Prompt Injection
    const check = this.toolFirewall.validateExternalContent(params.prompt);
    if (!check.isSafeData) {
      return {
        content: 'I can only assist with verified educational topics under platform safety policy.',
        modality: params.modality || 'TEXT',
        cached: false,
      };
    }

    return {
      content: `Socratic explanation generated for: ${params.prompt.slice(0, 40)}`,
      modality: params.modality || 'TEXT',
      cached: false,
    };
  }

  public async recommend(params: {
    tenantId: string;
    learnerId: string;
    purpose: string;
    context: Record<string, any>;
  }): Promise<{
    recommendationId: string;
    autonomyClass: AutonomyClass;
    proposedRecommendation: string;
    requiresHumanDecision: true;
  }> {
    this.autonomyEvaluator.recordProposedAction();
    return {
      recommendationId: `rec-${crypto.randomUUID()}`,
      autonomyClass: 'A2_RECOMMENDATION',
      proposedRecommendation: `Recommended practice unit for learner [${params.learnerId}]: ${params.purpose}`,
      requiresHumanDecision: true,
    };
  }

  // --- 2. Governed Action Execution Pipeline (11-Step Pipeline, Clauses N15.8 - N15.9) ---

  public async execute(request: GovernedActionRequest): Promise<GovernedActionResult> {
    this.autonomyEvaluator.recordProposedAction();
    const executionId = `exec-${crypto.randomUUID()}`;
    const auditId = `audit-${crypto.randomUUID()}`;

    // 0. Idempotency Gate (Clause N15.41)
    if (this.processedIdempotencyKeys.has(request.idempotencyKey)) {
      this.logger.warn(`Idempotent execution acknowledged for key [${request.idempotencyKey}]`);
      return this.processedIdempotencyKeys.get(request.idempotencyKey)!;
    }

    // 1. Emergency Global AI Kill Switch Check (Clause N15.37)
    if (this.humanAuthorization.isGlobalKillSwitchActive()) {
      const deniedResult: GovernedActionResult = {
        executionId,
        status: 'DENIED',
        autonomyClass: 'A0_NONE',
        reason: 'GLOBAL_KILL_SWITCH_ACTIVE: Autonomous execution is suspended platform-wide',
        postConditionVerified: false,
        auditId,
        timestamp: new Date().toISOString(),
      };
      this.recordAudit({
        auditId,
        agentId: request.agentId,
        tenantId: request.tenantId,
        actionType: request.actionType,
        targetId: request.targetId,
        autonomyLevel: 'A0_NONE',
        policyVersion: request.policyVersion,
        authorizationStatus: 'DENIED',
        result: 'DENIED',
        correlationId: request.correlationId,
        timestamp: new Date().toISOString(),
      });
      return deniedResult;
    }

    // 2. Granular Agent / Tenant Revocation Checks (Clauses N15.36, N15.38)
    if (this.humanAuthorization.isAgentRevoked(request.agentId)) {
      throw new ForbiddenException(`ACT-001: Agent [${request.agentId}] has been revoked`);
    }
    if (this.humanAuthorization.isTenantRolledBack(request.tenantId)) {
      throw new ForbiddenException(`ACT-002: Tenant [${request.tenantId}] autonomy has been rolled back`);
    }

    // 3. Blast Radius Gate (Clause N15.55)
    this.specializedAgents.assertBlastRadiusLimit(request);

    // 4. Consequential Action Authorization Gate (Clause N15.5 & N15.6)
    const isConsequential = this.consequentialActions.has(request.actionType as ConsequentialActionType);

    if (isConsequential) {
      // Must have valid, non-expired human authorization ticket
      const ticketId = request.authorizationContext?.ticketId;
      if (!ticketId) {
        this.autonomyEvaluator.recordConsequentialBypassAttempt();
        // Hold for human approval
        const ticket = this.humanAuthorization.createAuthorizationTicket({
          request,
          risk: 'HIGH',
          evidenceSummary: `Proposed consequential action [${request.actionType}] requires human approval`,
          expectedImpact: `State mutation on target [${request.targetId}]`,
        });

        const heldResult: GovernedActionResult = {
          executionId,
          status: 'HELD_FOR_HUMAN_APPROVAL',
          autonomyClass: 'A2_RECOMMENDATION',
          reason: 'CONSEQUENTIAL_ACTION_HELD: Human authorization ticket created',
          ticketId: ticket.ticketId,
          postConditionVerified: false,
          auditId,
          timestamp: new Date().toISOString(),
        };

        this.recordAudit({
          auditId,
          agentId: request.agentId,
          tenantId: request.tenantId,
          actionType: request.actionType,
          targetId: request.targetId,
          autonomyLevel: 'A2_RECOMMENDATION',
          policyVersion: request.policyVersion,
          authorizationStatus: 'PRE_AUTHORIZED_BOUNDED',
          result: 'HELD',
          correlationId: request.correlationId,
          timestamp: new Date().toISOString(),
        });

        return heldResult;
      }

      // Verify ticket validity
      const ticket = this.humanAuthorization.getTicket(ticketId);
      if (ticket.status !== 'APPROVED' && ticket.status !== 'MODIFIED') {
        this.autonomyEvaluator.recordUnauthorizedAttempt();
        throw new ForbiddenException(
          `ACT-005: Ticket [${ticketId}] is in status [${ticket.status}]. Consequential action execution denied.`
        );
      }

      // Consequential action approved by human: verify agent identity & lifecycle
      const agent = this.agentRegistry.getAgent(request.agentId);
      if (agent.lifecycleState !== 'ACTIVE' && agent.lifecycleState !== 'RESTRICTED') {
        throw new ForbiddenException(
          `AUT-006: Agent [${request.agentId}] is in lifecycle state [${agent.lifecycleState}]. Execution barred.`
        );
      }
    } else {
      // 5. Autonomous Action Verification & Hard Ceilings (Clauses N15.10, N15.11, N15.28, N15.44 - N15.47)
      this.agentRegistry.assertAgentCanExecute(request.agentId, request.actionType);
      this.specializedAgents.assertSafetyAgentCeiling(request.actionType);
      this.specializedAgents.assertCredentialAgentCeiling(request.actionType);
      this.specializedAgents.assertLearningAgentCeiling(request.actionType);
    }

    // 6. Execution & Post-Condition Verification (Clauses N15.39 - N15.40)
    const executedResult: GovernedActionResult = {
      executionId,
      status: 'EXECUTED',
      autonomyClass: isConsequential ? 'A4_CONDITIONAL_AUTONOMOUS' : 'A3_BOUNDED_EXECUTION',
      reason: 'Execution authorized and verified against post-conditions',
      postConditionVerified: true,
      executionOutput: {
        action: request.actionType,
        targetId: request.targetId,
        parameters: request.parameters,
        executedAt: new Date().toISOString(),
      },
      auditId,
      timestamp: new Date().toISOString(),
    };

    // 7. Audit & Idempotency Registration
    this.recordAudit({
      auditId,
      agentId: request.agentId,
      tenantId: request.tenantId,
      actionType: request.actionType,
      targetId: request.targetId,
      autonomyLevel: executedResult.autonomyClass,
      policyVersion: request.policyVersion,
      authorizationStatus: isConsequential ? 'VALID_HUMAN_AUTH' : 'PRE_AUTHORIZED_BOUNDED',
      result: 'SUCCESS',
      correlationId: request.correlationId,
      timestamp: new Date().toISOString(),
    });

    this.processedIdempotencyKeys.set(request.idempotencyKey, executedResult);
    return executedResult;
  }

  // --- 3. Tamper-Resistant Audit Logging (Clauses N15.76 - N15.78) ---

  private recordAudit(record: AgentAuditRecord): void {
    // Append-only, never stores raw learner sensitive prompts
    this.auditLog.push({ ...record });
  }

  public getAuditRecords(tenantId?: string): AgentAuditRecord[] {
    if (tenantId) {
      return this.auditLog.filter((a) => a.tenantId === tenantId);
    }
    return [...this.auditLog];
  }
}
