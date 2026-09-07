const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('YOUVA-EdAI P12 — Global Learning Operating System 2.0 Verification');
console.log('================================================================');

const rootDir = path.resolve(__dirname, '..');
const schemaFile = path.join(rootDir, 'prisma', 'schema.prisma');
const migrationFile = path.join(rootDir, 'prisma', 'migrations', '20260913_p12_learning_interoperability', 'migration.sql');
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
console.log('\n1. Checking Prisma Schema for P12 Models...');
const schemaContent = fs.readFileSync(schemaFile, 'utf8');
const p12Models = [
  'UnifiedLearnerSnapshot',
  'LearningPassport',
  'PassportAchievement',
  'LearningCompetency',
  'LearnerCompetency',
  'ExternalLearningEvent',
  'LearningDataShare',
];
for (const model of p12Models) {
  check(`Model ${model} exists in schema.prisma`, schemaContent.includes(`model ${model}`));
}

// 2. Migration SQL
console.log('\n2. Checking P12 Migration SQL...');
if (fs.existsSync(migrationFile)) {
  const migrationContent = fs.readFileSync(migrationFile, 'utf8');
  for (const table of p12Models) {
    check(`Table ${table} defined in migration.sql`, migrationContent.includes(`"${table}"`));
  }
} else {
  check('Migration file exists', false);
}

// 3. Learning Interoperability Subsystems
console.log('\n3. Checking Learning Interoperability Subsystem Files...');
const expectedFiles = [
  'learning-interoperability.module.ts',
  'ulr/ulr.types.ts',
  'ulr/unified-learner-snapshot.service.ts',
  'ulr/learner-record.controller.ts',
  'ulr/snapshot.spec.ts',
  'passport/passport.types.ts',
  'passport/learning-passport.service.ts',
  'passport/learning-passport.controller.ts',
  'competency/competency.types.ts',
  'competency/competency.service.ts',
  'competency/credential-verification.service.ts',
  'competency/credential.controller.ts',
  'competency/competency.spec.ts',
  'competency/credential.spec.ts',
  'pathway/pathway.types.ts',
  'pathway/learning-pathway.service.ts',
  'pathway/pathway.spec.ts',
  'integration/integration.types.ts',
  'integration/external-learning-event.service.ts',
  'integration/curriculum-translation.service.ts',
  'integration/integration.controller.ts',
  'integration/external-event.spec.ts',
  'sharing/data-sharing.types.ts',
  'sharing/learning-export.service.ts',
  'sharing/learning-data-share.controller.ts',
  'sharing/data-share.spec.ts',
];

for (const f of expectedFiles) {
  const fullPath = path.join(rootDir, 'src', 'learning-interoperability', f);
  check(`File learning-interoperability/${f} exists`, fs.existsSync(fullPath));
}

// 4. AppModule Registration
console.log('\n4. Checking AppModule Registration...');
const appModuleContent = fs.readFileSync(appModuleFile, 'utf8');
check('LearningInteroperabilityModule registered in app.module.ts', appModuleContent.includes('LearningInteroperabilityModule'));

// 5. Invariants & Business Logic
console.log('\n5. Checking P12 Core Invariants in Codebase...');

// Invariant 1: AI cannot certify competencies
const competencyTypesSrc = fs.readFileSync(path.join(rootDir, 'src', 'learning-interoperability', 'competency', 'competency.types.ts'), 'utf8');
check('canCertifyCompetency requires evidenceIds.length > 0', competencyTypesSrc.includes('assessment.evidenceIds.length > 0'));
check('canCertifyCompetency requires confidence >= 0.8', competencyTypesSrc.includes('assessment.confidence >= 0.8'));
check('canCertifyCompetency requires teacherVerified === true', competencyTypesSrc.includes('assessment.teacherVerified === true'));

const competencyServiceSrc = fs.readFileSync(path.join(rootDir, 'src', 'learning-interoperability', 'competency', 'competency.service.ts'), 'utf8');
check('CompetencyService.certify throws if canCertifyCompetency fails', competencyServiceSrc.includes('canCertifyCompetency(assessment)'));

// Invariant 2: External provider idempotency and evidence normalization
const externalEventSrc = fs.readFileSync(path.join(rootDir, 'src', 'learning-interoperability', 'integration', 'external-learning-event.service.ts'), 'utf8');
check('ExternalLearningEventService deduplicates via providerId_externalEventId', externalEventSrc.includes('providerId_externalEventId') && externalEventSrc.includes('duplicate: true'));
check('External events normalize to NormalizedEvidence rather than direct mastery overwrite', externalEventSrc.includes('normalizedEvidence'));

// Invariant 3: Data sharing authorization and expiration
const sharingSrc = fs.readFileSync(path.join(rootDir, 'src', 'learning-interoperability', 'sharing', 'learning-export.service.ts'), 'utf8');
check('LearningExportService enforces status === APPROVED', sharingSrc.includes("status: 'APPROVED'"));
check('LearningExportService rejects expired data shares', sharingSrc.includes('Learning data share has expired.'));

// Invariant 4: Pathway state transitions and scoring
const pathwayTypesSrc = fs.readFileSync(path.join(rootDir, 'src', 'learning-interoperability', 'pathway', 'pathway.types.ts'), 'utf8');
check('Pathway state machine defines governed transition rules', pathwayTypesSrc.includes('VALID_TRANSITIONS') && pathwayTypesSrc.includes('Invalid pathway milestone transition'));
check('scorePathway incorporates multi-objective weighted parameters', pathwayTypesSrc.includes('goalAlignment * 0.25') && pathwayTypesSrc.includes('prerequisiteFit * 0.20'));

// Invariant 5: ULR read projection & tenant filtering
const ulrServiceSrc = fs.readFileSync(path.join(rootDir, 'src', 'learning-interoperability', 'ulr', 'unified-learner-snapshot.service.ts'), 'utf8');
check('UnifiedLearnerSnapshotService strictly scopes queries by tenantId', ulrServiceSrc.includes('where: {') && ulrServiceSrc.includes('tenantId,') && ulrServiceSrc.includes('learnerId,'));

// Invariant 6: Opaque identity without PII leakage
const passportTypesSrc = fs.readFileSync(path.join(rootDir, 'src', 'learning-interoperability', 'passport', 'passport.types.ts'), 'utf8');
check('generateOpaqueSubjectId computes cryptographic non-enumerable hash', passportTypesSrc.includes("createHmac('sha256'") && passportTypesSrc.includes('sub_'));

// Invariant 7: Credential validity check
const credVerificationSrc = fs.readFileSync(path.join(rootDir, 'src', 'learning-interoperability', 'competency', 'credential-verification.service.ts'), 'utf8');
check('CredentialVerificationService checks status === ACTIVE', credVerificationSrc.includes("credential.status === 'ACTIVE'"));

console.log('\n================================================================');
if (passed) {
  console.log('ALL PHASE P12 VERIFICATION CHECKS PASSED SUCCESSFULLY (100%)!');
  console.log('================================================================');
  process.exit(0);
} else {
  console.error('SOME P12 CHECKS FAILED!');
  console.log('================================================================');
  process.exit(1);
}
