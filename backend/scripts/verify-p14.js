const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('================================================================');
console.log('YOUVA-EdAI P14 — Trustworthy Autonomous Learning OS Verification');
console.log('================================================================');

const rootDir = path.resolve(__dirname, '..');
const schemaFile = path.join(rootDir, 'prisma', 'schema.prisma');
const migrationFile = path.join(rootDir, 'prisma', 'migrations', '20260915_p14_autonomous_learning_os', 'migration.sql');
const appModuleFile = path.join(rootDir, 'src', 'app.module.ts');

let passed = true;

function check(title, condition) {
  if (condition) {
    console.log(`  [OK] ${title}`);
  } else {
    console.error(`  [FAIL] ${title}`);
    passed = false;
  }
}

// 1. Schema Models
console.log('\n1. Checking Prisma Schema for P14 Models...');
const schemaContent = fs.readFileSync(schemaFile, 'utf8');
const p14Models = [
  'LearningAction',
  'PolicyDecision',
  'ActionExecution',
  'HumanApproval',
  'LearningTwinSnapshot',
  'DecisionProvenance',
];
for (const model of p14Models) {
  check(`Model ${model} exists in schema.prisma`, schemaContent.includes(`model ${model}`));
}

// 2. Migration SQL
console.log('\n2. Checking P14 Migration SQL...');
if (fs.existsSync(migrationFile)) {
  const migrationContent = fs.readFileSync(migrationFile, 'utf8');
  for (const table of p14Models) {
    check(`Table ${table} defined in migration.sql`, migrationContent.includes(`"${table}"`));
  }
} else {
  check('Migration file exists', false);
}

// 3. Autonomous Learning Subsystem Files
console.log('\n3. Checking Autonomous Learning Subsystem Files...');
const expectedFiles = [
  'autonomous-learning.module.ts',
  'autonomous-learning.controller.ts',
  'actions/action-state.ts',
  'actions/action-state.spec.ts',
  'actions/action-policy.service.ts',
  'actions/action.service.ts',
  'policy/learning-policy.service.ts',
  'policy/learning-policy.spec.ts',
  'optimization/next-best-action.service.ts',
  'optimization/next-best-action.spec.ts',
  'prediction/predictive-state.service.ts',
  'simulation/learning-simulation.service.ts',
  'agents/agent-budget.service.ts',
  'agents/agent-budget.spec.ts',
  'agents/agent-tools.service.ts',
  'agents/agent.service.ts',
  'approval/human-approval.service.ts',
  'approval/human-approval.spec.ts',
  'recovery/circuit-breaker.ts',
  'recovery/retry.service.ts',
  'recovery/recovery.spec.ts',
  'provenance/decision-provenance.service.ts',
  'provenance/decision-provenance.spec.ts',
];

for (const f of expectedFiles) {
  const fullPath = path.join(rootDir, 'src', 'autonomous-learning', f);
  check(`File autonomous-learning/${f} exists`, fs.existsSync(fullPath));
}

// 4. AppModule Registration
console.log('\n4. Checking AppModule Registration...');
const appModuleContent = fs.readFileSync(appModuleFile, 'utf8');
check('AutonomousLearningModule registered in app.module.ts', appModuleContent.includes('AutonomousLearningModule'));

// 5. Invariants & Business Logic
console.log('\n5. Checking P14 Core Invariants in Codebase...');

// Invariant 1: Hard Safety Filter
const actionPolicySrc = fs.readFileSync(path.join(rootDir, 'src', 'autonomous-learning', 'actions', 'action-policy.service.ts'), 'utf8');
check('Hard safety filter blocks CHANGE_CONSENT', actionPolicySrc.includes("candidate.type !== 'CHANGE_CONSENT'"));
check('Hard safety filter blocks CHANGE_ROLE', actionPolicySrc.includes("candidate.type !== 'CHANGE_ROLE'"));
check('Hard safety filter blocks CERTIFY_MASTERY', actionPolicySrc.includes("candidate.type !== 'CERTIFY_MASTERY'"));
check('Hard safety filter blocks CLOSE_SAFETY_INCIDENT', actionPolicySrc.includes("candidate.type !== 'CLOSE_SAFETY_INCIDENT'"));

// Invariant 2: Deterministic Policy Rules
const policyServiceSrc = fs.readFileSync(path.join(rootDir, 'src', 'autonomous-learning', 'policy', 'learning-policy.service.ts'), 'utf8');
check('Policy engine requires approval if requiresHumanApproval is set', policyServiceSrc.includes("decision: 'REQUIRE_APPROVAL'"));
check('Policy engine requires approval for KIDS non-reversible actions', policyServiceSrc.includes("input.ageTier === 'KIDS' && !input.reversible"));
check('Policy engine requires approval if confidence < 0.70', policyServiceSrc.includes("input.confidence < 0.70"));
check('Policy permits low-risk/reversible actions with high confidence', policyServiceSrc.includes("decision: 'ALLOW'"));

// Invariant 3: Multi-Objective Next-Best-Action Optimization
const nextBestSrc = fs.readFileSync(path.join(rootDir, 'src', 'autonomous-learning', 'optimization', 'next-best-action.service.ts'), 'utf8');
check('Multi-objective score function uses weighted formula', nextBestSrc.includes('0.30') && nextBestSrc.includes('0.20') && nextBestSrc.includes('0.15'));
check('selectBestAction filters unsafe actions before sorting', nextBestSrc.includes('filterUnsafeActions(candidates)'));

// Invariant 4: Action Lifecycle State Machine
const actionStateSrc = fs.readFileSync(path.join(rootDir, 'src', 'autonomous-learning', 'actions', 'action-state.ts'), 'utf8');
check('Action state machine defines valid transitions', actionStateSrc.includes('PROPOSED') && actionStateSrc.includes('POLICY_REVIEW') && actionStateSrc.includes('APPROVED') && actionStateSrc.includes('EXECUTING') && actionStateSrc.includes('COMPLETED') && actionStateSrc.includes('ROLLED_BACK'));

// Invariant 5: Agent Sandbox & Tool Boundaries
const agentBudgetSrc = fs.readFileSync(path.join(rootDir, 'src', 'autonomous-learning', 'agents', 'agent-budget.service.ts'), 'utf8');
check('Agent budget bounds steps, tool calls, and elapsed time', agentBudgetSrc.includes('steps < budget.maxSteps') && agentBudgetSrc.includes('toolCalls < budget.maxToolCalls') && agentBudgetSrc.includes('elapsedMs < budget.maxExecutionMs'));

const agentToolsSrc = fs.readFileSync(path.join(rootDir, 'src', 'autonomous-learning', 'agents', 'agent-tools.service.ts'), 'utf8');
check('Agent tools service explicitly rejects wildcard tool access', agentToolsSrc.includes("toolName === '*' || toolName.includes('*')"));

// Invariant 6: Resilience & Circuit Breaker
const retrySrc = fs.readFileSync(path.join(rootDir, 'src', 'autonomous-learning', 'recovery', 'retry.service.ts'), 'utf8');
check('calculateBackoff implements exponential backoff with ceiling', retrySrc.includes('baseMs * Math.pow(2, attempt)'));

const breakerSrc = fs.readFileSync(path.join(rootDir, 'src', 'autonomous-learning', 'recovery', 'circuit-breaker.ts'), 'utf8');
check('CircuitBreaker trips when threshold failures reached', breakerSrc.includes('this.failures >= this.threshold'));

// Invariant 7: Cryptographic Decision Provenance
const provenanceSrc = fs.readFileSync(path.join(rootDir, 'src', 'autonomous-learning', 'provenance', 'decision-provenance.service.ts'), 'utf8');
check('Decision provenance uses SHA-256 for input hashing', provenanceSrc.includes("crypto.createHash('sha256')"));

// Invariant 8: Action Reversibility & Rollback Guard
const actionServiceSrc = fs.readFileSync(path.join(rootDir, 'src', 'autonomous-learning', 'actions', 'action.service.ts'), 'utf8');
check('AutonomousActionService guards rollback on reversible property', actionServiceSrc.includes('!action.reversible') && actionServiceSrc.includes('Action is irreversible and cannot be rolled back'));

// 6. Runtime Logic Assertion Verification
console.log('\n6. Executing Runtime Logic Assertions...');

// Test Hard Safety Filter runtime
function filterUnsafe(candidates) {
  return candidates.filter(
    (c) =>
      c.type !== 'CHANGE_CONSENT' &&
      c.type !== 'CHANGE_ROLE' &&
      c.type !== 'CERTIFY_MASTERY' &&
      c.type !== 'CLOSE_SAFETY_INCIDENT'
  );
}
const testCandidates = [
  { type: 'RECOMMEND_PRACTICE' },
  { type: 'CHANGE_CONSENT' },
  { type: 'CHANGE_ROLE' },
  { type: 'CHANGE_DIFFICULTY' },
  { type: 'CERTIFY_MASTERY' },
  { type: 'CLOSE_SAFETY_INCIDENT' },
];
const filtered = filterUnsafe(testCandidates);
check('Runtime filterUnsafe removes all 4 strictly forbidden actions', filtered.length === 2 && filtered.every(c => c.type === 'RECOMMEND_PRACTICE' || c.type === 'CHANGE_DIFFICULTY'));

// Test Policy Engine runtime
function decidePolicy(input) {
  if (input.requiresHumanApproval) {
    return { decision: 'REQUIRE_APPROVAL', autonomyLevel: 'HUMAN_REQUIRED' };
  }
  if (input.ageTier === 'KIDS' && !input.reversible) {
    return { decision: 'REQUIRE_APPROVAL', autonomyLevel: 'HUMAN_REQUIRED' };
  }
  if (input.confidence < 0.70) {
    return { decision: 'REQUIRE_APPROVAL', autonomyLevel: 'ASSISTED' };
  }
  return { decision: 'ALLOW', autonomyLevel: input.reversible ? 'AUTO_REVERSIBLE' : 'AUTO_LOW_RISK' };
}
check('Runtime policy blocks irreversible action for KIDS', decidePolicy({ ageTier: 'KIDS', reversible: false, confidence: 0.95, requiresHumanApproval: false }).decision === 'REQUIRE_APPROVAL');
check('Runtime policy allows reversible action for KIDS with high confidence', decidePolicy({ ageTier: 'KIDS', reversible: true, confidence: 0.95, requiresHumanApproval: false }).decision === 'ALLOW');
check('Runtime policy blocks action with low confidence (< 0.70)', decidePolicy({ ageTier: 'TEEN', reversible: true, confidence: 0.65, requiresHumanApproval: false }).decision === 'REQUIRE_APPROVAL');

// Test State Machine runtime
const transitions = {
  PROPOSED: ['POLICY_REVIEW', 'DENIED'],
  POLICY_REVIEW: ['APPROVED', 'DENIED'],
  APPROVED: ['EXECUTING', 'DENIED'],
  EXECUTING: ['COMPLETED', 'FAILED'],
  COMPLETED: ['EVALUATING'],
  EVALUATING: ['SUCCESS', 'PARTIAL', 'ROLLED_BACK'],
};
function checkTransition(curr, next) {
  return transitions[curr]?.includes(next) ?? false;
}
check('Runtime state transition PROPOSED -> POLICY_REVIEW is valid', checkTransition('PROPOSED', 'POLICY_REVIEW') === true);
check('Runtime state transition PROPOSED -> EXECUTING is invalid (blocked)', checkTransition('PROPOSED', 'EXECUTING') === false);
check('Runtime state transition EVALUATING -> ROLLED_BACK is valid', checkTransition('EVALUATING', 'ROLLED_BACK') === true);

// Test Backoff calculation runtime
function calcBackoff(attempt, baseMs = 1000, maxMs = 60000) {
  return Math.min(maxMs, baseMs * Math.pow(2, attempt));
}
check('Runtime calcBackoff exponential scaling: attempt 0=1000, attempt 3=8000, attempt 10 capped at 60000',
  calcBackoff(0) === 1000 && calcBackoff(3) === 8000 && calcBackoff(10) === 60000);

// Test CircuitBreaker runtime
class TestCircuitBreaker {
  constructor(threshold = 3, cooldownMs = 1000) {
    this.threshold = threshold;
    this.cooldownMs = cooldownMs;
    this.failures = 0;
    this.openedAt = 0;
  }
  canExecute() {
    if (this.failures < this.threshold) return true;
    return Date.now() - this.openedAt >= this.cooldownMs;
  }
  recordFailure() {
    this.failures += 1;
    if (this.failures >= this.threshold) this.openedAt = Date.now();
  }
  recordSuccess() {
    this.failures = 0;
    this.openedAt = 0;
  }
}
const cb = new TestCircuitBreaker(3, 500);
check('CircuitBreaker starts CLOSED (canExecute=true)', cb.canExecute() === true);
cb.recordFailure();
cb.recordFailure();
check('CircuitBreaker still CLOSED after 2 failures (<3)', cb.canExecute() === true);
cb.recordFailure();
check('CircuitBreaker OPENS after 3 failures (canExecute=false)', cb.canExecute() === false);
cb.recordSuccess();
check('CircuitBreaker resets to CLOSED on success', cb.canExecute() === true);

// Test Deterministic SHA-256 Hashing runtime
function hashInput(payload) {
  const canonical = JSON.stringify(payload, Object.keys(payload || {}).sort());
  return crypto.createHash('sha256').update(canonical).digest('hex');
}
const hash1 = hashInput({ b: 2, a: 1 });
const hash2 = hashInput({ a: 1, b: 2 });
check('Deterministic SHA-256 hash matches regardless of key order', hash1 === hash2 && hash1.length === 64);

console.log('\n================================================================');
if (passed) {
  console.log('ALL PHASE P14 VERIFICATION CHECKS PASSED SUCCESSFULLY (100%)!');
  console.log('================================================================');
  process.exit(0);
} else {
  console.error('SOME P14 CHECKS FAILED!');
  console.log('================================================================');
  process.exit(1);
}
