import { canContinue, AgentBudget } from './agent-budget.service';
import { AgentToolsService } from './agent-tools.service';

describe('canContinue & Agent Security Boundaries', () => {
  const budget: AgentBudget = {
    maxSteps: 10,
    maxToolCalls: 10,
    maxExecutionMs: 1000,
    maxOutputTokens: 1000,
  };

  it('allows execution when well within budget', () => {
    expect(canContinue(5, 5, 200, budget)).toBe(true);
  });

  it('stops after maximum steps reached', () => {
    expect(canContinue(10, 1, 100, budget)).toBe(false);
    expect(canContinue(11, 1, 100, budget)).toBe(false);
  });

  it('stops after maximum tool calls reached', () => {
    expect(canContinue(2, 10, 100, budget)).toBe(false);
  });

  it('stops after execution deadline exceeded', () => {
    expect(canContinue(2, 2, 1500, budget)).toBe(false);
  });

  it('strictly rejects wildcard and unauthorized tools', () => {
    const toolsService = new AgentToolsService();
    expect(toolsService.isToolAllowed('LEARNING_AGENT', '*')).toBe(false);
    expect(toolsService.isToolAllowed('LEARNING_AGENT', 'read_curriculum')).toBe(true);
    expect(toolsService.isToolAllowed('LEARNING_AGENT', 'mutate_database_raw')).toBe(false);
  });
});
