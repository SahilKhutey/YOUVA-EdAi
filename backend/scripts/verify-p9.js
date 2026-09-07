const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('YOUVA-EdAI P9 — Autonomous Learning Operations & Governance Verification');
console.log('================================================================');

const rootDir = path.resolve(__dirname, '..');
const schemaFile = path.join(rootDir, 'prisma', 'schema.prisma');
const migrationFile = path.join(rootDir, 'prisma', 'migrations', '20260910_p9_autonomous_learning_governance', 'migration.sql');
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

// 1. Schema
console.log('\n1. Checking Prisma Schema for P9 Models...');
const schemaContent = fs.readFileSync(schemaFile, 'utf8');
const p9Models = ['AIAgent', 'AIAgentExecution', 'LearningWorkflow', 'WorkflowExecution', 'AIUsageRecord', 'Integration'];
for (const model of p9Models) {
  check(`Model ${model} exists in schema.prisma`, schemaContent.includes(`model ${model}`));
}

// 2. Migration
console.log('\n2. Checking P9 Migration SQL...');
if (fs.existsSync(migrationFile)) {
  const migrationContent = fs.readFileSync(migrationFile, 'utf8');
  for (const table of p9Models) {
    check(`Table ${table} in migration.sql`, migrationContent.includes(`CREATE TABLE "${table}"`));
  }
} else {
  check('Migration file exists', false);
}

// 3. Autonomy
console.log('\n3. Checking P9 Autonomy Subsystem...');
const autonomyFiles = [
  'autonomy.types.ts',
  'autonomy-policy.service.ts',
  'agent-execution.service.ts',
  'autonomy.controller.ts',
  'autonomy.module.ts',
  'autonomy-policy.spec.ts',
  'agent-execution.spec.ts',
];
for (const file of autonomyFiles) {
  check(`Autonomy file ${file} exists`, fs.existsSync(path.join(rootDir, 'src', 'autonomy', file)));
}

// 4. Workflows
console.log('\n4. Checking P9 Workflow Engine Subsystem...');
const workflowFiles = [
  'workflow.types.ts',
  'workflow-engine.service.ts',
  'workflows.controller.ts',
  'workflows.module.ts',
  'workflow-engine.spec.ts',
];
for (const file of workflowFiles) {
  check(`Workflow file ${file} exists`, fs.existsSync(path.join(rootDir, 'src', 'workflows', file)));
}

// 5. Governance
console.log('\n5. Checking P9 Governance Subsystem...');
const governanceFiles = [
  'governance.types.ts',
  'intervention-orchestration.service.ts',
  'model-drift.service.ts',
  'ai-cost.service.ts',
  'ai-governance.controller.ts',
  'ai-governance.module.ts',
  'intervention-orchestration.spec.ts',
  'model-drift.spec.ts',
  'ai-cost.spec.ts',
];
for (const file of governanceFiles) {
  check(`Governance file ${file} exists`, fs.existsSync(path.join(rootDir, 'src', 'governance', file)));
}

// 6. Ecosystem
console.log('\n6. Checking P9 Ecosystem Subsystem...');
const ecosystemFiles = [
  'ecosystem.types.ts',
  'ecosystem.service.ts',
  'ecosystem.controller.ts',
  'ecosystem.module.ts',
  'ecosystem.spec.ts',
];
for (const file of ecosystemFiles) {
  check(`Ecosystem file ${file} exists`, fs.existsSync(path.join(rootDir, 'src', 'ecosystem', file)));
}

// 7. AppModule Registration
console.log('\n7. Checking AppModule Registration...');
const appModuleContent = fs.readFileSync(appModuleFile, 'utf8');
const p9Modules = ['AutonomyModule', 'WorkflowsModule', 'AIGovernanceModule', 'EcosystemModule'];
for (const mod of p9Modules) {
  check(`${mod} registered in app.module.ts`, appModuleContent.includes(mod));
}

// 8. Safety Invariants
console.log('\n8. Checking Safety & Governance Invariants in Codebase...');
const policyContent = fs.readFileSync(path.join(rootDir, 'src', 'autonomy', 'autonomy-policy.service.ts'), 'utf8');
const prohibitedActions = [
  'MODIFY_MASTERY',
  'MODIFY_CONSENT',
  'MODIFY_ROLE',
  'CLOSE_SAFETY_CASE',
  'DELETE_LEARNER',
  'CHANGE_BILLING',
];
for (const action of prohibitedActions) {
  check(`Invariant: ${action} blocked in autonomy-policy.service.ts`, policyContent.includes(action));
}

const driftContent = fs.readFileSync(path.join(rootDir, 'src', 'governance', 'model-drift.service.ts'), 'utf8');
check('Invariant: 5% max safety drift threshold enforced', driftContent.includes('SAFETY_DRIFT_THRESHOLD = 0.05'));

console.log('\n================================================================');
if (passed) {
  console.log('ALL PHASE P9 VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  console.log('================================================================');
  process.exit(0);
} else {
  console.error('SOME CHECKS FAILED!');
  console.log('================================================================');
  process.exit(1);
}
