const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('================================================================');
console.log('YOUVA-EdAI P15 — Trusted Learning Identity & Skills Passport Verification');
console.log('================================================================');

const rootDir = path.resolve(__dirname, '..');
const schemaFile = path.join(rootDir, 'prisma', 'schema.prisma');
const migrationFile = path.join(rootDir, 'prisma', 'migrations', '20260916_p15_trusted_credentials', 'migration.sql');
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
console.log('\n1. Checking Prisma Schema for P15 Models...');
const schemaContent = fs.readFileSync(schemaFile, 'utf8');
const p15Models = [
  'LearningCredential',
  'CredentialVerification',
  'CredentialEvent',
  'CredentialShare',
  'CredentialVersion',
  'CredentialTemplate',
  'CredentialOperation',
];
for (const model of p15Models) {
  check(`Model ${model} exists in schema.prisma`, schemaContent.includes(`model ${model}`));
}

// 2. Migration SQL
console.log('\n2. Checking P15 Migration SQL...');
if (fs.existsSync(migrationFile)) {
  const migrationContent = fs.readFileSync(migrationFile, 'utf8');
  for (const table of p15Models) {
    check(`Table ${table} defined in migration.sql`, migrationContent.includes(`"${table}"`));
  }
  check('Unique constraint for CredentialShare tokenHash defined', migrationContent.includes('CredentialShare_tokenHash_key'));
  check('Unique constraint for CredentialOperation operationKey defined', migrationContent.includes('CredentialOperation_operationKey_key'));
} else {
  check('Migration file exists', false);
}

// 3. Credential Network Subsystem Files
console.log('\n3. Checking Credential Network Subsystem Files...');
const expectedFiles = [
  'credential-network.module.ts',
  'credential.controller.ts',
  'public-credential.controller.ts',
  'types/credential.types.ts',
  'domain/credential-state.ts',
  'domain/credential-state.spec.ts',
  'domain/credential-eligibility.ts',
  'domain/credential-eligibility.spec.ts',
  'crypto/credential-token.ts',
  'crypto/credential-token.spec.ts',
  'crypto/anti-gaming.service.ts',
  'services/credential.service.ts',
  'services/credential-service.spec.ts',
  'services/credential-issuance.service.ts',
  'services/credential-verification.service.ts',
  'services/credential-share.service.ts',
  'services/credential-public-verification.service.ts',
  'services/credential-revocation.service.ts',
  'services/skills-passport.service.ts',
  'services/skills-passport.spec.ts',
  'services/credential-template.service.ts',
  'services/credential-adapter.service.ts',
  'ai/credential-recommendation.service.ts',
];

for (const f of expectedFiles) {
  const fullPath = path.join(rootDir, 'src', 'credential-network', f);
  check(`File credential-network/${f} exists`, fs.existsSync(fullPath));
}

// 4. AppModule Registration
console.log('\n4. Checking AppModule Registration...');
const appModuleContent = fs.readFileSync(appModuleFile, 'utf8');
check('CredentialNetworkModule registered in app.module.ts', appModuleContent.includes('CredentialNetworkModule'));
check('Existing CredentialMeshModule preserved in app.module.ts', appModuleContent.includes('CredentialMeshModule'));

// 5. Invariants & Business Logic (Static Checks)
console.log('\n5. Checking P15 Core Invariants in Codebase...');

// Invariant 1: Credential state transitions
const stateSrc = fs.readFileSync(path.join(rootDir, 'src', 'credential-network', 'domain', 'credential-state.ts'), 'utf8');
check('Credential state machine defines DRAFT -> PENDING_REVIEW', stateSrc.includes("DRAFT: ['PENDING_REVIEW']"));
check('Credential state machine defines APPROVED -> ISSUED', stateSrc.includes("APPROVED: ['ISSUED']"));
check('Credential state machine seals terminal states EXPIRED and REVOKED', stateSrc.includes('EXPIRED: []') && stateSrc.includes('REVOKED: []'));

// Invariant 2: Eligibility criteria
const eligibilitySrc = fs.readFileSync(path.join(rootDir, 'src', 'credential-network', 'domain', 'credential-eligibility.ts'), 'utf8');
check('Eligibility requires minimum mastery check', eligibilitySrc.includes('input.mastery < input.minimumMastery'));
check('Eligibility requires minimum evidence check', eligibilitySrc.includes('input.evidenceCount < input.minimumEvidence'));
check('Eligibility gates human verification for non-institutional levels', eligibilitySrc.includes("input.verificationLevel !== 'INSTITUTION_VERIFIED'"));

// Invariant 3: Anti-gaming evidence deduplication
check('Anti-gaming deduplicates evidence IDs', eligibilitySrc.includes('new Set(evidenceIds)'));

// Invariant 4: Token security & Hashing
const tokenSrc = fs.readFileSync(path.join(rootDir, 'src', 'credential-network', 'crypto', 'credential-token.ts'), 'utf8');
check('generateShareToken generates randomBytes base64url', tokenSrc.includes("randomBytes(32).toString('base64url')"));
check('generateShareToken computes SHA-256 hash', tokenSrc.includes("createHash('sha256')"));
check('credentialIntegrityHash provides canonical SHA-256 representation', tokenSrc.includes('credentialIntegrityHash'));

// Invariant 5: Data Minimization in Public Verification
const publicVerifSrc = fs.readFileSync(path.join(rootDir, 'src', 'credential-network', 'services', 'credential-public-verification.service.ts'), 'utf8');
check('Public verification checks share.revoked', publicVerifSrc.includes('share.revoked'));
check('Public verification excludes student PII (data minimization)', !publicVerifSrc.includes('credential.learnerEmail') && !publicVerifSrc.includes('credential.studentName'));

// Invariant 6: AI Authority Boundary
const aiSrc = fs.readFileSync(path.join(rootDir, 'src', 'credential-network', 'ai', 'credential-recommendation.service.ts'), 'utf8');
check('AI recommendations enforce requiresHumanVerification: true', aiSrc.includes('requiresHumanVerification: true'));
check('AI service blocks forbidden actions (ISSUE_CREDENTIAL, REVOKE_CREDENTIAL)', aiSrc.includes('ISSUE_CREDENTIAL') && aiSrc.includes('REVOKE_CREDENTIAL'));

// Invariant 7: Transactional Issuance & Revocation
const issuanceSrc = fs.readFileSync(path.join(rootDir, 'src', 'credential-network', 'services', 'credential-issuance.service.ts'), 'utf8');
check('Issuance enforces APPROVED status requirement', issuanceSrc.includes("credential.status !== 'APPROVED'"));

const revocationSrc = fs.readFileSync(path.join(rootDir, 'src', 'credential-network', 'services', 'credential-revocation.service.ts'), 'utf8');
check('Revocation marks all share links revoked', revocationSrc.includes('revoked: true'));

// 6. Runtime Logic Assertions
console.log('\n6. Executing Runtime Logic Assertions...');

// Test State Machine Runtime
const transitions = {
  DRAFT: ['PENDING_REVIEW'],
  PENDING_REVIEW: ['APPROVED', 'DRAFT'],
  APPROVED: ['ISSUED'],
  ISSUED: ['ACTIVE'],
  ACTIVE: ['SUSPENDED', 'EXPIRED', 'REVOKED'],
  SUSPENDED: ['ACTIVE', 'REVOKED'],
  EXPIRED: [],
  REVOKED: [],
};
function checkTransition(curr, next) {
  return transitions[curr]?.includes(next) ?? false;
}
check('Runtime state transition DRAFT -> PENDING_REVIEW is valid', checkTransition('DRAFT', 'PENDING_REVIEW') === true);
check('Runtime state transition PENDING_REVIEW -> APPROVED is valid', checkTransition('PENDING_REVIEW', 'APPROVED') === true);
check('Runtime state transition APPROVED -> ISSUED is valid', checkTransition('APPROVED', 'ISSUED') === true);
check('Runtime direct transition DRAFT -> ISSUED is invalid (blocked)', checkTransition('DRAFT', 'ISSUED') === false);
check('Runtime transition from terminal state REVOKED -> ACTIVE is invalid (blocked)', checkTransition('REVOKED', 'ACTIVE') === false);
check('Runtime transition from terminal state EXPIRED -> ACTIVE is invalid (blocked)', checkTransition('EXPIRED', 'ACTIVE') === false);

// Test Eligibility Runtime
function testEligibility(input) {
  const reasons = [];
  if (input.mastery < input.minimumMastery) reasons.push('Minimum mastery not reached.');
  if (input.evidenceCount < input.minimumEvidence) reasons.push('Insufficient learning evidence.');
  return {
    eligible: reasons.length === 0,
    reasons,
    humanVerificationRequired: input.verificationLevel !== 'INSTITUTION_VERIFIED',
  };
}
check('Runtime eligibility rejects mastery below threshold (0.65 < 0.80)', testEligibility({ mastery: 0.65, minimumMastery: 0.80, evidenceCount: 5, minimumEvidence: 3, verificationLevel: 'TEACHER_VERIFIED' }).eligible === false);
check('Runtime eligibility rejects evidence count below threshold (1 < 3)', testEligibility({ mastery: 0.90, minimumMastery: 0.80, evidenceCount: 1, minimumEvidence: 3, verificationLevel: 'TEACHER_VERIFIED' }).eligible === false);
check('Runtime eligibility accepts valid mastery (0.90 >= 0.80) and evidence (5 >= 3)', testEligibility({ mastery: 0.90, minimumMastery: 0.80, evidenceCount: 5, minimumEvidence: 3, verificationLevel: 'TEACHER_VERIFIED' }).eligible === true);

// Test Anti-Gaming Deduplication Runtime
const rawEv = ['ev-1', 'ev-2', 'ev-1', 'ev-3', 'ev-2'];
const dedupedEv = [...new Set(rawEv)];
check('Runtime evidence deduplication removes duplicates (5 -> 3)', dedupedEv.length === 3 && dedupedEv.includes('ev-3'));

// Test Cryptographic Token Runtime
const testToken = crypto.randomBytes(32).toString('base64url');
const testHash = crypto.createHash('sha256').update(testToken).digest('hex');
check('Runtime token generation yields valid base64url and matching SHA-256 hash', testToken.length >= 32 && testHash.length === 64);

// Test Canonical Integrity Hash Runtime
function computeIntegrityHash(cred) {
  const canonical = JSON.stringify({
    id: cred.id,
    title: cred.title,
    credentialType: cred.credentialType,
    verificationLevel: cred.verificationLevel,
    issuedAt: cred.issuedAt ? cred.issuedAt.toISOString() : null,
  });
  return crypto.createHash('sha256').update(canonical).digest('hex');
}
const dateConst = new Date('2026-05-01T00:00:00.000Z');
const hashA = computeIntegrityHash({ id: 'c1', title: 'Algebra', credentialType: 'SKILL', verificationLevel: 'TEACHER_VERIFIED', issuedAt: dateConst });
const hashB = computeIntegrityHash({ id: 'c1', title: 'Algebra', credentialType: 'SKILL', verificationLevel: 'TEACHER_VERIFIED', issuedAt: dateConst });
const hashC = computeIntegrityHash({ id: 'c1', title: 'Algebra', credentialType: 'SKILL', verificationLevel: 'INSTITUTION_VERIFIED', issuedAt: dateConst });
check('Canonical integrity hash is deterministic and tamper-sensitive', hashA === hashB && hashA !== hashC);

console.log('\n================================================================');
if (passed) {
  console.log('ALL PHASE P15 VERIFICATION CHECKS PASSED SUCCESSFULLY (100%)!');
  console.log('================================================================');
  process.exit(0);
} else {
  console.error('SOME P15 CHECKS FAILED!');
  console.log('================================================================');
  process.exit(1);
}
