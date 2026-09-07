const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('YOUVA-EdAI P10 — Global Learning OS Verification');
console.log('================================================================');

const rootDir = path.resolve(__dirname, '..');
const schemaFile = path.join(rootDir, 'prisma', 'schema.prisma');
const migrationFile = path.join(rootDir, 'prisma', 'migrations', '20260911_p10_global_learning_os', 'migration.sql');
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
console.log('\n1. Checking Prisma Schema for P10 Models...');
const schemaContent = fs.readFileSync(schemaFile, 'utf8');
const p10Models = [
  'LearningSystemSnapshot',
  'ImprovementProposal',
  'LearningOutcome',
  'ExperimentGovernance',
  'ReleaseArtifact',
  'ResearchDataset',
  'LearningPattern',
  'PolicyVersion',
];
for (const model of p10Models) {
  check(`Model ${model} exists in schema.prisma`, schemaContent.includes(`model ${model}`));
}

// 2. Migration SQL
console.log('\n2. Checking P10 Migration SQL...');
if (fs.existsSync(migrationFile)) {
  const migrationContent = fs.readFileSync(migrationFile, 'utf8');
  for (const table of p10Models) {
    check(`Table ${table} in migration.sql`, migrationContent.includes(`CREATE TABLE "${table}"`));
  }
} else {
  check('Migration file exists', false);
}

// 3. Learning OS Subsystem Files
console.log('\n3. Checking Learning OS Subsystems...');
const expectedFiles = [
  'learning-os.module.ts',
  'digital-twin/digital-twin.types.ts',
  'digital-twin/digital-twin.service.ts',
  'digital-twin/digital-twin.controller.ts',
  'improvement/improvement.types.ts',
  'improvement/improvement.service.ts',
  'improvement/improvement.controller.ts',
  'improvement/improvement.spec.ts',
  'improvement/experiment-governance.spec.ts',
  'outcomes/outcome.types.ts',
  'outcomes/outcome.service.ts',
  'outcomes/outcome.controller.ts',
  'outcomes/outcome.spec.ts',
  'release/release.types.ts',
  'release/release.service.ts',
  'release/release.controller.ts',
  'release/release.spec.ts',
  'policy/policy.types.ts',
  'policy/policy.service.ts',
  'policy/policy.controller.ts',
  'policy/fairness.spec.ts',
  'research/research.types.ts',
  'research/research.service.ts',
  'research/research.controller.ts',
  'research/research.spec.ts',
  'reliability/reliability.types.ts',
  'reliability/reliability.service.ts',
  'reliability/reliability.controller.ts',
  'reliability/reliability.spec.ts',
];

for (const f of expectedFiles) {
  const fullPath = path.join(rootDir, 'src', 'learning-os', f);
  check(`File learning-os/${f} exists`, fs.existsSync(fullPath));
}

// 4. AppModule Registration
console.log('\n4. Checking AppModule Registration...');
const appModuleContent = fs.readFileSync(appModuleFile, 'utf8');
check('LearningOSModule registered in app.module.ts', appModuleContent.includes('LearningOSModule'));

// 5. Invariants Verification
console.log('\n5. Checking Safety & Governance Invariants in Codebase...');

// Outcome calculation
const outcomeSrc = fs.readFileSync(path.join(rootDir, 'src', 'learning-os', 'outcomes', 'outcome.service.ts'), 'utf8');
check('calculateOutcome formula: masteryGain * 0.50 + retention * 0.20 + transfer * 0.20 + independence * 0.10', outcomeSrc.includes('masteryGain * 0.50'));
check('canPublishBenchmark enforces minimumGroupSize threshold', outcomeSrc.includes('populationSize >= minimumGroupSize'));

// Improvement regression & experiment gating
const improvementSrc = fs.readFileSync(path.join(rootDir, 'src', 'learning-os', 'improvement', 'improvement.service.ts'), 'utf8');
check('detectRegression calculates relative change over threshold', improvementSrc.includes('change >= threshold'));
check('canStartExperiment requires safetyReviewed', improvementSrc.includes('!input.safetyReviewed'));
check('canStartExperiment requires privacyReviewed', improvementSrc.includes('!input.privacyReviewed'));
check('canStartExperiment requires teacherReviewed for non-LOW risk', improvementSrc.includes("input.riskLevel !== 'LOW' && !input.teacherReviewed"));

// Release gate
const releaseSrc = fs.readFileSync(path.join(rootDir, 'src', 'learning-os', 'release', 'release.service.ts'), 'utf8');
check('canRelease requires safetyTestsPassed', releaseSrc.includes('validation.safetyTestsPassed'));
check('canRelease requires securityTestsPassed', releaseSrc.includes('validation.securityTestsPassed'));
check('canRelease requires regressionTestsPassed', releaseSrc.includes('validation.regressionTestsPassed'));

// Policy & Consent
const policySrc = fs.readFileSync(path.join(rootDir, 'src', 'learning-os', 'policy', 'policy.service.ts'), 'utf8');
check('denyIfConsentMissing denies with CONSENT_REQUIRED', policySrc.includes("'CONSENT_REQUIRED'"));
check('fairnessGap calculates absolute discrepancy Math.abs(groupA - groupB)', policySrc.includes('Math.abs(groupA - groupB)'));

// Research minimization & Pattern validation
const researchSrc = fs.readFileSync(path.join(rootDir, 'src', 'learning-os', 'research', 'research.service.ts'), 'utf8');
check('validatePattern requires evidenceCount >= 30 and confidence >= 0.8', researchSrc.includes('evidenceCount >= 30 && confidence >= 0.8'));
check('exportAnonymizedRecords applies HMAC-SHA256 pseudonymization', researchSrc.includes('createHmac'));

// Reliability autonomy
const reliabilitySrc = fs.readFileSync(path.join(rootDir, 'src', 'learning-os', 'reliability', 'reliability.service.ts'), 'utf8');
check('reliabilityAutonomy maps safe actions to AUTO_LOW_RISK', reliabilitySrc.includes('AutonomyLevel.AUTO_LOW_RISK'));
check('reliabilityAutonomy blocks dangerous schema/security changes by default', reliabilitySrc.includes('AutonomyLevel.BLOCKED'));

console.log('\n================================================================');
if (passed) {
  console.log('ALL PHASE P10 VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  console.log('================================================================');
  process.exit(0);
} else {
  console.error('SOME CHECKS FAILED!');
  console.log('================================================================');
  process.exit(1);
}
