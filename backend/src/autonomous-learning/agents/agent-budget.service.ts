export interface AgentBudget {
  maxSteps: number;
  maxToolCalls: number;
  maxExecutionMs: number;
  maxOutputTokens: number;
}

/**
 * Enforces strict operational boundaries to prevent runaway autonomous agent loops.
 */
export function canContinue(
  steps: number,
  toolCalls: number,
  elapsedMs: number,
  budget: AgentBudget,
): boolean {
  return (
    steps < budget.maxSteps &&
    toolCalls < budget.maxToolCalls &&
    elapsedMs < budget.maxExecutionMs
  );
}
