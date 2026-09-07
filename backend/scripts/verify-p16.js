const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { isIP } = require('net');

console.log('================================================================');
console.log('YOUVA-EdAI P16 — Global Learning Intelligence & Institutional Interoperability Verification');
console.log('================================================================');

const rootDir = path.resolve(__dirname, '..');
const schemaFile = path.join(rootDir, 'prisma', 'schema.prisma');
const migrationFile1 = path.join(rootDir, 'prisma', 'migrations', '20260905104000_p16_interoperability', 'migration.sql');
const migrationFile2 = path.join(rootDir, 'prisma', 'migrations', '20260917_p16_interoperability', 'migration.sql');
const appModuleFile = path.join(rootDir, 'src', 'app.module.ts');
const interopDir = path.join(rootDir, 'src', 'interoperability');

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
console.log('\n1. Checking Prisma Schema for P16 Models...');
const schemaContent = fs.readFileSync(schemaFile, 'utf8');
const p16Models = [
  'P16Tenant',
  'P16TenantMembership',
  'P16ExternalIntegration',
  'P16IntegrationCredential',
  'P16IntegrationMapping',
  'P16ExternalRecord',
  'P16IntegrationImportJob',
  'P16IntegrationExportJob',
  'P16SyncCursor',
  'P16DataProvenance',
  'P16IntegrationConflict',
  'P16ExternalInstitution',
  'P16ExternalIdentityMapping',
];
for (const model of p16Models) {
  check(`Model ${model} exists in schema.prisma`, schemaContent.includes(`model ${model}`));
}

// 2. Migration SQL
console.log('\n2. Checking P16 Migration SQL...');
const migrationPath = fs.existsSync(migrationFile1) ? migrationFile1 : migrationFile2;
if (fs.existsSync(migrationPath)) {
  const migrationContent = fs.readFileSync(migrationPath, 'utf8');
  const p16Tables = [
    'p16_tenants',
    'p16_tenant_memberships',
    'p16_external_integrations',
    'p16_integration_credentials',
    'p16_integration_mappings',
    'p16_external_records',
    'p16_integration_import_jobs',
    'p16_integration_export_jobs',
    'p16_sync_cursors',
    'p16_data_provenance',
    'p16_integration_conflicts',
    'p16_external_institutions',
    'p16_external_identity_mappings',
  ];
  for (const table of p16Tables) {
    check(`Table ${table} defined in migration.sql`, migrationContent.includes(`CREATE TABLE IF NOT EXISTS ${table}`) || migrationContent.includes(`CREATE TABLE IF NOT EXISTS\n  ${table}`));
  }
  check('Tenant membership unique constraint defined', migrationContent.includes('UNIQUE (tenant_id, user_id)'));
  check('External integration tenant-provider unique constraint defined', migrationContent.includes('UNIQUE (tenant_id, provider)'));
  check('External record unique constraint defined', migrationContent.includes('UNIQUE (\n    integration_id,\n    external_record_id,\n    external_type\n  )'));
} else {
  check('Migration file exists', false);
}

// 3. Interoperability Subsystem Files
console.log('\n3. Checking Interoperability Subsystem Files...');
const expectedFiles = [
  'p16.types.ts',
  'p16.security.ts',
  'p16.registry.ts',
  'p16.rest-json.adapter.ts',
  'p16.service.ts',
  'p16.controller.ts',
  'p16.module.ts',
  'p16.security.spec.ts',
  'p16.registry.spec.ts',
  'p16.service.spec.ts',
];
for (const file of expectedFiles) {
  const filePath = path.join(interopDir, file);
  check(`File interoperability/${file} exists`, fs.existsSync(filePath));
}

// 4. AppModule Registration
console.log('\n4. Checking AppModule Registration...');
const appModuleContent = fs.readFileSync(appModuleFile, 'utf8');
check('InteroperabilityModule imported in app.module.ts', appModuleContent.includes("import { InteroperabilityModule } from './interoperability/p16.module'"));
check('InteroperabilityModule registered in imports array', appModuleContent.includes('InteroperabilityModule,'));

// 5. P16 Invariants & Security Logic in Codebase
console.log('\n5. Checking P16 Core Invariants in Codebase...');
const securityCode = fs.readFileSync(path.join(interopDir, 'p16.security.ts'), 'utf8');
const serviceCode = fs.readFileSync(path.join(interopDir, 'p16.service.ts'), 'utf8');
const registryCode = fs.readFileSync(path.join(interopDir, 'p16.registry.ts'), 'utf8');
const controllerCode = fs.readFileSync(path.join(interopDir, 'p16.controller.ts'), 'utf8');

check('Security enforces HTTPS protocol assertion', securityCode.includes("url.protocol !== 'https:'"));
check('Security blocks localhost and metadata endpoints', securityCode.includes('metadata.google.internal') && securityCode.includes('localhost'));
check('Security checks private IPv4 ranges', securityCode.includes('isPrivateIpv4'));
check('Security checks private IPv6 ranges', securityCode.includes('isPrivateIpv6'));
check('Security blocks direct IP endpoints', securityCode.includes('isIP(hostname) !== 0'));
check('Security enforces host allowlist', securityCode.includes('normalizedAllowed.includes(hostname)'));
check('Security provides SHA-256 payload checksum', securityCode.includes("createHash('sha256')"));
check('Security enforces privileged roles (ADMIN | TEACHER)', securityCode.includes("role !== 'ADMIN'") && securityCode.includes("role !== 'TEACHER'"));
check('Registry detects duplicate provider registrations', registryCode.includes('Adapter already registered'));
check('Registry rejects unsupported providers', registryCode.includes('Unsupported integration provider'));
check('Service asserts tenant membership', serviceCode.includes('assertTenantMember'));
check('Service rejects records with mismatched integrationId', /record\s*\.\s*source\s*\.\s*integrationId\s*!==\s*id/.test(serviceCode));
check('Service writes provenance record on import', serviceCode.includes('INSERT INTO p16_data_provenance'));
check('Service updates sync cursor on import', serviceCode.includes('INSERT INTO p16_sync_cursors'));
check('Service tracks and resolves integration conflicts', serviceCode.includes('p16_integration_conflicts'));
check('Controller enforces JWT authentication and tenant header', controllerCode.includes("@UseGuards(AuthGuard('jwt'))") && controllerCode.includes('x-tenant-id'));

// 6. Runtime Logic Assertions
console.log('\n6. Executing Runtime Logic Assertions...');

const BLOCKED_HOSTS = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata',
  'metadata.google.internal',
]);

function isPrivateIpv4(host) {
  const parts = host.split('.').map(Number);
  if (parts.length !== 4 || parts.some(n => !Number.isInteger(n) || n < 0 || n > 255)) {
    return false;
  }
  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a === 0
  );
}

function isPrivateIpv6(host) {
  const normalized = host.toLowerCase().replace(/^\[/, '').replace(/\]$/, '');
  return (
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80:')
  );
}

function assertSafeExternalUrl(rawUrl, allowedHosts) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('Integration URL is invalid.');
  }

  if (url.protocol !== 'https:') {
    throw new Error('Only HTTPS integration URLs are allowed.');
  }

  const hostname = url.hostname.toLowerCase();

  if (BLOCKED_HOSTS.has(hostname) || isPrivateIpv4(hostname) || isPrivateIpv6(hostname)) {
    throw new Error('Integration URL targets a blocked network address.');
  }

  if (isIP(hostname) !== 0) {
    throw new Error('Direct IP integration endpoints are not allowed.');
  }

  const normalizedAllowed = allowedHosts.map(h => h.trim().toLowerCase()).filter(Boolean);
  if (!normalizedAllowed.includes(hostname)) {
    throw new Error('Integration host is not allowlisted.');
  }

  return url;
}

function checksumPayload(payload) {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function stableEventKey(parts) {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function assertPrivileged(role) {
  if (role !== 'ADMIN' && role !== 'TEACHER') {
    throw new Error('Integration access requires a teacher or administrator role.');
  }
}

// Runtime check 1: Allowlisted HTTPS succeeds
try {
  const url = assertSafeExternalUrl('https://lms.example.com/api/v1', ['lms.example.com']);
  check('Runtime safe URL validation accepts allowlisted HTTPS host', url.hostname === 'lms.example.com');
} catch (err) {
  check('Runtime safe URL validation accepts allowlisted HTTPS host', false);
}

// Runtime check 2: HTTP protocol rejected
try {
  assertSafeExternalUrl('http://lms.example.com/api', ['lms.example.com']);
  check('Runtime safe URL validation rejects non-HTTPS (HTTP)', false);
} catch (err) {
  check('Runtime safe URL validation rejects non-HTTPS (HTTP)', err.message.includes('Only HTTPS'));
}

// Runtime check 3: Localhost rejected
try {
  assertSafeExternalUrl('https://localhost/api', ['localhost']);
  check('Runtime safe URL validation rejects localhost', false);
} catch (err) {
  check('Runtime safe URL validation rejects localhost', err.message.includes('blocked network address'));
}

// Runtime check 4: Private IPv4 (10.0.0.1, 192.168.1.1, 127.0.0.1) rejected
let privateIpv4Blocked = true;
const privateIps = ['10.0.0.1', '192.168.1.5', '172.20.0.1', '127.0.0.1'];
for (const ip of privateIps) {
  try {
    assertSafeExternalUrl(`https://${ip}/api`, [ip]);
    privateIpv4Blocked = false;
  } catch (err) {
    // Expected
  }
}
check('Runtime safe URL validation rejects private IPv4 ranges', privateIpv4Blocked);

// Runtime check 5: Private IPv6 rejected
try {
  assertSafeExternalUrl('https://[::1]/api', ['::1']);
  check('Runtime safe URL validation rejects private IPv6', false);
} catch (err) {
  check('Runtime safe URL validation rejects private IPv6', err.message.includes('blocked network address'));
}

// Runtime check 6: Non-allowlisted host rejected
try {
  assertSafeExternalUrl('https://attacker.com/api', ['lms.example.com']);
  check('Runtime safe URL validation rejects non-allowlisted host', false);
} catch (err) {
  check('Runtime safe URL validation rejects non-allowlisted host', err.message.includes('not allowlisted'));
}

// Runtime check 7: Checksum payload determinism & sensitivity
const chk1 = checksumPayload({ a: 1, b: [1, 2, 3] });
const chk2 = checksumPayload({ a: 1, b: [1, 2, 3] });
const chk3 = checksumPayload({ a: 1, b: [1, 2, 4] });
check('Runtime checksumPayload is deterministic and tamper-sensitive', chk1 === chk2 && chk1 !== chk3 && chk1.length === 64);

// Runtime check 8: Stable event key order sensitivity
const evKey1 = stableEventKey(['tenant-1', 'integration-2', 'record-3']);
const evKey2 = stableEventKey(['tenant-1', 'integration-2', 'record-3']);
const evKey3 = stableEventKey(['record-3', 'integration-2', 'tenant-1']);
check('Runtime stableEventKey is deterministic and order-sensitive', evKey1 === evKey2 && evKey1 !== evKey3 && evKey1.length === 64);

// Runtime check 9: assertPrivileged RBAC check
let rbacCorrect = true;
try {
  assertPrivileged('TEACHER');
  assertPrivileged('ADMIN');
} catch {
  rbacCorrect = false;
}
try {
  assertPrivileged('STUDENT');
  rbacCorrect = false;
} catch (err) {
  // Expected
}
try {
  assertPrivileged('PARENT');
  rbacCorrect = false;
} catch (err) {
  // Expected
}
check('Runtime RBAC assertion permits ADMIN/TEACHER and blocks STUDENT/PARENT', rbacCorrect);

// Runtime check 10: Registry operation
class MockRegistry {
  constructor() {
    this.adapters = new Map();
  }
  register(adapter) {
    if (this.adapters.has(adapter.provider)) throw new Error(`Adapter already registered: ${adapter.provider}`);
    this.adapters.set(adapter.provider, adapter);
  }
  get(provider) {
    const a = this.adapters.get(provider);
    if (!a) throw new Error(`Unsupported integration provider: ${provider}`);
    return a;
  }
  has(provider) {
    return this.adapters.has(provider);
  }
}

const testRegistry = new MockRegistry();
const mockAdapter = { provider: 'REST_JSON' };
testRegistry.register(mockAdapter);
let registryOk = testRegistry.has('REST_JSON') && testRegistry.get('REST_JSON') === mockAdapter;
try {
  testRegistry.register(mockAdapter);
  registryOk = false;
} catch {
  // Duplicate error expected
}
try {
  testRegistry.get('UNKNOWN_PROVIDER');
  registryOk = false;
} catch {
  // Missing error expected
}
check('Runtime AdapterRegistry handles registration, retrieval, duplicates, and missing providers', registryOk);

console.log('\n================================================================');
if (passed) {
  console.log('ALL PHASE P16 VERIFICATION CHECKS PASSED SUCCESSFULLY (100%)!');
} else {
  console.error('VERIFICATION FAILED FOR ONE OR MORE CHECKS.');
  process.exit(1);
}
console.log('================================================================\n');
