const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('YOUVA-EdAI P11 — Verified Learning Network Verification');
console.log('================================================================');

const rootDir = path.resolve(__dirname, '..');
const schemaFile = path.join(rootDir, 'prisma', 'schema.prisma');
const migrationFile = path.join(rootDir, 'prisma', 'migrations', '20260912_p11_verified_learning_network', 'migration.sql');
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
console.log('\n1. Checking Prisma Schema for P11 Models...');
const schemaContent = fs.readFileSync(schemaFile, 'utf8');
const p11Models = [
  'EvidenceProvenance',
  'EvidenceCorrection',
  'LearningClaim',
  'ClaimEvidence',
  'VerifiedLearningKnowledge',
  'CausalStudy',
  'InterventionEffectiveness',
  'AIDecisionTrace',
  'AIPromptVersion',
  'KnowledgeContribution',
  'VerifiedContent',
  'ResearchStudyVersion',
  'ResearchResult',
  'GovernanceDecision',
];
for (const model of p11Models) {
  check(`Model ${model} exists in schema.prisma`, schemaContent.includes(`model ${model}`));
}

// 2. Migration SQL
console.log('\n2. Checking P11 Migration SQL...');
if (fs.existsSync(migrationFile)) {
  const migrationContent = fs.readFileSync(migrationFile, 'utf8');
  for (const table of p11Models) {
    check(`Table ${table} in migration.sql`, migrationContent.includes(`CREATE TABLE "${table}"`));
  }
} else {
  check('Migration file exists', false);
}

// 3. Verified Learning Subsystems
console.log('\n3. Checking Verified Learning Subsystem Files...');
const expectedFiles = [
  'verified-learning.module.ts',
  'evidence/evidence.types.ts',
  'evidence/evidence-integrity.service.ts',
  'evidence/evidence.service.ts',
  'evidence/evidence.controller.ts',
  'evidence/evidence-integrity.spec.ts',
  'claims/claim.types.ts',
  'claims/claim.service.ts',
  'claims/claim.controller.ts',
  'claims/claim-verification.spec.ts',
  'causal/causal.types.ts',
  'causal/causal-study.service.ts',
  'causal/causal-study.controller.ts',
  'causal/outcome.spec.ts',
  'knowledge/knowledge.types.ts',
  'knowledge/knowledge.service.ts',
  'knowledge/knowledge.controller.ts',
  'knowledge/knowledge-gate.spec.ts',
  'ai-trace/ai-trace.types.ts',
  'ai-trace/ai-trace.service.ts',
  'ai-trace/ai-trace.controller.ts',
  'trust/trust.types.ts',
  'trust/trust.service.ts',
  'trust/trust.spec.ts',
  'governance/governance.types.ts',
  'governance/governance.service.ts',
  'governance/governance.controller.ts',
];

for (const f of expectedFiles) {
  const fullPath = path.join(rootDir, 'src', 'verified-learning', f);
  check(`File verified-learning/${f} exists`, fs.existsSync(fullPath));
}

// 4. AppModule Registration
console.log('\n4. Checking AppModule Registration...');
const appModuleContent = fs.readFileSync(appModuleFile, 'utf8');
check('VerifiedLearningModule registered in app.module.ts', appModuleContent.includes('VerifiedLearningModule'));

// 5. Invariants Verification
console.log('\n5. Checking P11 Invariants in Codebase...');

// Evidence canonicalization and hashing
const evidenceIntegritySrc = fs.readFileSync(path.join(rootDir, 'src', 'verified-learning', 'evidence', 'evidence-integrity.service.ts'), 'utf8');
check('hashCanonicalEvidence uses SHA-256 over canonicalized JSON', evidenceIntegritySrc.includes("createHash('sha256')") && evidenceIntegritySrc.includes('canonicalize(evidence)'));
check('EvidenceIntegrityService verifies against expected hash', evidenceIntegritySrc.includes('actualHash !== expectedHash'));

// Claim verification gate
const claimSrc = fs.readFileSync(path.join(rootDir, 'src', 'verified-learning', 'claims', 'claim.service.ts'), 'utf8');
check('canVerifyClaim enforces sampleSize >= 30 and evidenceQuality >= 0.8', claimSrc.includes('input.sampleSize >= 30 &&') && claimSrc.includes('input.evidenceQuality >= 0.8'));
check('canVerifyClaim enforces replicationCount >= 2 and independentSources >= 1', claimSrc.includes('input.replicationCount >= 2 &&') && claimSrc.includes('input.independentSources >= 1'));
check('canVerifyClaim enforces safety, privacy, and reviewer approval', claimSrc.includes('input.safetyPassed &&') && claimSrc.includes('input.privacyPassed &&') && claimSrc.includes('input.reviewerApproved'));

// Knowledge gate
const knowledgeSrc = fs.readFileSync(path.join(rootDir, 'src', 'verified-learning', 'knowledge', 'knowledge.service.ts'), 'utf8');
check('canEnterGlobalKnowledge requires privacy, safety, replication, expert review', knowledgeSrc.includes('input.privacyApproved &&') && knowledgeSrc.includes('input.safetyApproved &&') && knowledgeSrc.includes('input.replicated &&') && knowledgeSrc.includes('input.expertReviewed'));

// Causal treatment effect
const causalSrc = fs.readFileSync(path.join(rootDir, 'src', 'verified-learning', 'causal', 'causal-study.service.ts'), 'utf8');
check('averageTreatmentEffect calculates treatmentOutcome - controlOutcome', causalSrc.includes('treatmentOutcome - controlOutcome'));

// Trust score
const trustSrc = fs.readFileSync(path.join(rootDir, 'src', 'verified-learning', 'trust', 'trust.service.ts'), 'utf8');
check('evidenceTrustScore computes decomposed weighted score', trustSrc.includes('input.provenance * 0.30 +'));

// AI Decision trace
const aiTraceSrc = fs.readFileSync(path.join(rootDir, 'src', 'verified-learning', 'ai-trace', 'ai-trace.service.ts'), 'utf8');
check('AIDecisionTraceService hashes inputs and outputs cryptographically', aiTraceSrc.includes('hashCanonicalEvidence(dto.inputPayload)'));

console.log('\n================================================================');
if (passed) {
  console.log('ALL PHASE P11 VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  console.log('================================================================');
  process.exit(0);
} else {
  console.error('SOME CHECKS FAILED!');
  console.log('================================================================');
  process.exit(1);
}
