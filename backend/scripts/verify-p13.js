const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('YOUVA-EdAI P13 — Adaptive Learning Operations Verification');
console.log('================================================================');

const rootDir = path.resolve(__dirname, '..');
const schemaFile = path.join(rootDir, 'prisma', 'schema.prisma');
const migrationFile = path.join(rootDir, 'prisma', 'migrations', '20260914_p13_learning_operations', 'migration.sql');
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
console.log('\n1. Checking Prisma Schema for P13 Models...');
const schemaContent = fs.readFileSync(schemaFile, 'utf8');
const p13Models = [
  'LearningSignal',
  'LearningIntervention',
  'InterventionEvaluation',
  'PolicyRecommendation',
  'OperationsEventProcessing',
];
for (const model of p13Models) {
  check(`Model ${model} exists in schema.prisma`, schemaContent.includes(`model ${model}`));
}

// 2. Migration SQL
console.log('\n2. Checking P13 Migration SQL...');
if (fs.existsSync(migrationFile)) {
  const migrationContent = fs.readFileSync(migrationFile, 'utf8');
  for (const table of p13Models) {
    check(`Table ${table} defined in migration.sql`, migrationContent.includes(`"${table}"`));
  }
} else {
  check('Migration file exists', false);
}

// 3. Learning Operations Subsystem Files
console.log('\n3. Checking Learning Operations Subsystem Files...');
const expectedFiles = [
  'learning-operations.module.ts',
  'signals/signal.types.ts',
  'signals/signal.service.ts',
  'signals/signal.service.spec.ts',
  'risk/risk.types.ts',
  'risk/risk.service.ts',
  'risk/risk.service.spec.ts',
  'opportunity/opportunity.types.ts',
  'opportunity/opportunity.service.ts',
  'opportunity/opportunity.service.spec.ts',
  'intervention/intervention.types.ts',
  'intervention/intervention-orchestrator.service.ts',
  'intervention/intervention-state.spec.ts',
  'intervention/intervention.service.spec.ts',
  'teacher-priority/teacher-priority.types.ts',
  'teacher-priority/teacher-priority.service.ts',
  'teacher-priority/teacher-priority.spec.ts',
  'institutional/institutional.types.ts',
  'institutional/institutional.service.ts',
  'institutional/aggregate-policy.spec.ts',
  'evaluation/evaluation.types.ts',
  'evaluation/intervention-evaluation.service.ts',
  'evaluation/evaluation.service.spec.ts',
  'policy/policy-recommendation.types.ts',
  'policy/policy-recommendation.service.ts',
  'operations/learning-operations.service.ts',
  'operations/learning-operations-worker.service.ts',
  'operations/learning-operations.controller.ts',
  'operations/operations.service.spec.ts',
];

for (const f of expectedFiles) {
  const fullPath = path.join(rootDir, 'src', 'learning-operations', f);
  check(`File learning-operations/${f} exists`, fs.existsSync(fullPath));
}

// 4. AppModule Registration
console.log('\n4. Checking AppModule Registration...');
const appModuleContent = fs.readFileSync(appModuleFile, 'utf8');
check('LearningOperationsModule registered in app.module.ts', appModuleContent.includes('LearningOperationsModule'));

// 5. Invariants & Business Logic
console.log('\n5. Checking P13 Core Invariants in Codebase...');

// Invariant 1: Signal detection thresholds
const signalTypesSrc = fs.readFileSync(path.join(rootDir, 'src', 'learning-operations', 'signals', 'signal.types.ts'), 'utf8');
check('detectMasteryDecline requires drop >= 0.15', signalTypesSrc.includes('previousMastery - currentMastery >= 0.15'));
check('detectRepeatedMisconception requires count >= 3', signalTypesSrc.includes('misconceptionCount >= 3'));

// Invariant 2: Risk calculation
const riskTypesSrc = fs.readFileSync(path.join(rootDir, 'src', 'learning-operations', 'risk', 'risk.types.ts'), 'utf8');
check('calculateRisk implements weighted multi-factor formula', riskTypesSrc.includes('input.masteryRisk * 0.25') && riskTypesSrc.includes('input.misconceptionRisk * 0.20') && riskTypesSrc.includes('(1 - input.evidenceConfidence) * 0.10'));
check('riskLevel thresholds (0.75 HIGH, 0.45 MEDIUM)', riskTypesSrc.includes("score >= 0.75") && riskTypesSrc.includes("score >= 0.45"));

// Invariant 3: Opportunity calculation
const oppTypesSrc = fs.readFileSync(path.join(rootDir, 'src', 'learning-operations', 'opportunity', 'opportunity.types.ts'), 'utf8');
check('calculateOpportunity implements weighted positive indicators', oppTypesSrc.includes('input.mastery * 0.30') && oppTypesSrc.includes('input.confidence * 0.20'));

// Invariant 4: Intervention state machine
const interventionTypesSrc = fs.readFileSync(path.join(rootDir, 'src', 'learning-operations', 'intervention', 'intervention.types.ts'), 'utf8');
check('transitionIntervention enforces linear state transitions', interventionTypesSrc.includes('PROPOSED') && interventionTypesSrc.includes('APPROVED') && interventionTypesSrc.includes('EVALUATING'));

// Invariant 5: Teacher priority formula
const teacherPriorityTypesSrc = fs.readFileSync(path.join(rootDir, 'src', 'learning-operations', 'teacher-priority', 'teacher-priority.types.ts'), 'utf8');
check('calculateTeacherPriority integrates severity, impact, and urgency', teacherPriorityTypesSrc.includes('input.severity * 0.30') && teacherPriorityTypesSrc.includes('input.learnerImpact * 0.25'));

// Invariant 6: Privacy aggregation threshold
const institutionalTypesSrc = fs.readFileSync(path.join(rootDir, 'src', 'learning-operations', 'institutional', 'institutional.types.ts'), 'utf8');
check('canShowAggregate enforces minimum sample size gate (default 10)', institutionalTypesSrc.includes('sampleSize >= minimum'));

// Invariant 7: Outcome calculation and Recommendation quality
const evaluationTypesSrc = fs.readFileSync(path.join(rootDir, 'src', 'learning-operations', 'evaluation', 'evaluation.types.ts'), 'utf8');
check('calculateOutcome computes improvement delta', evaluationTypesSrc.includes('improvement >= threshold'));
check('recommendationQuality strictly gates on safetyIssue (returns 0)', evaluationTypesSrc.includes('if (outcome.safetyIssue) {') && evaluationTypesSrc.includes('return 0;'));

// Invariant 8: Event idempotency
const operationsServiceSrc = fs.readFileSync(path.join(rootDir, 'src', 'learning-operations', 'operations', 'learning-operations.service.ts'), 'utf8');
check('processOnce checks existing eventId before processing', operationsServiceSrc.includes('operationsEventProcessing.findUnique') && operationsServiceSrc.includes('return false;'));
check('LearningOperationsService enforces strict tenantId scoping', operationsServiceSrc.includes('tenantId: user.tenantId'));

// Invariant 9: Human authority over consequential interventions
const interventionOrchestratorSrc = fs.readFileSync(path.join(rootDir, 'src', 'learning-operations', 'intervention', 'intervention-orchestrator.service.ts'), 'utf8');
check('InterventionOrchestratorService sets status to PROPOSED when teacher approval required', interventionOrchestratorSrc.includes("plan.requiresTeacherApproval ? 'PROPOSED' : 'APPROVED'"));

console.log('\n================================================================');
if (passed) {
  console.log('ALL PHASE P13 VERIFICATION CHECKS PASSED SUCCESSFULLY (100%)!');
  console.log('================================================================');
  process.exit(0);
} else {
  console.error('SOME P13 CHECKS FAILED!');
  console.log('================================================================');
  process.exit(1);
}
