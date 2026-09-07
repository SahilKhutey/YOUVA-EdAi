import { Injectable, ForbiddenException } from '@nestjs/common';
import { AgentToolsService, AgentRole } from './agent-tools.service';
import { AgentBudget, canContinue } from './agent-budget.service';

export interface AgentRequest {
  agentId: string;
  tenantId: string;
  role: AgentRole;
  actorId?: string;
  task: string;
  context: Record<string, unknown>;
  allowedTools: string[];
  budget: AgentBudget;
}

export interface AgentResult {
  agentId: string;
  status: 'COMPLETED' | 'BLOCKED' | 'REQUIRES_HUMAN' | 'FAILED';
  recommendations: unknown[];
  toolCalls: number;
  policyChecks: number;
  auditEventId: string;
}

@Injectable()
export class AgentService {
  constructor(private readonly toolsService: AgentToolsService) {}

  /**
   * Dispatches an agent task within bounded tools and execution budget.
   * Invariants:
   * 1. Wildcard tool access is rejected.
   * 2. Execution stops when budget (steps, toolCalls, elapsedMs) is exhausted.
   * 3. Agent cannot access raw database directly.
   */
  async executeAgentTask(request: AgentRequest): Promise<AgentResult> {
    // Validate requested tools against allowlist
    for (const tool of request.allowedTools) {
      if (!this.toolsService.isToolAllowed(request.role, tool)) {
        throw new ForbiddenException(`Tool '${tool}' is unauthorized for agent role '${request.role}'.`);
      }
    }

    const startTime = Date.now();
    let steps = 0;
    let toolCalls = 0;
    const recommendations: unknown[] = [];

    // Simulated bounded execution
    while (canContinue(steps, toolCalls, Date.now() - startTime, request.budget) && steps < 3) {
      steps += 1;
      toolCalls += 1;
    }

    recommendations.push({
      action: 'recommend_prerequisite_practice',
      conceptId: request.context.conceptId ?? 'concept-math-basics',
      confidence: 0.9,
    });

    return {
      agentId: request.agentId,
      status: 'COMPLETED',
      recommendations,
      toolCalls,
      policyChecks: steps,
      auditEventId: `aud_agent_${Date.now()}`,
    };
  }
}
