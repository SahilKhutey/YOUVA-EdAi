CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS p16_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS p16_tenant_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL
    REFERENCES p16_tenants(id)
    ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS
  p16_tenant_memberships_user_idx
ON p16_tenant_memberships(user_id);

CREATE TABLE IF NOT EXISTS
  p16_external_integrations (
  id UUID PRIMARY KEY
    DEFAULT gen_random_uuid(),

  tenant_id UUID NOT NULL
    REFERENCES p16_tenants(id)
    ON DELETE CASCADE,

  provider TEXT NOT NULL,
  name TEXT NOT NULL,

  status TEXT NOT NULL
    DEFAULT 'ACTIVE',

  config_json TEXT,
  capabilities_json TEXT,

  last_sync_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  UNIQUE (tenant_id, provider)
);

CREATE INDEX IF NOT EXISTS
  p16_integrations_tenant_status_idx
ON p16_external_integrations(
  tenant_id,
  status
);

CREATE TABLE IF NOT EXISTS
  p16_integration_credentials (
  id UUID PRIMARY KEY
    DEFAULT gen_random_uuid(),

  integration_id UUID NOT NULL
    REFERENCES p16_external_integrations(id)
    ON DELETE CASCADE,

  credential_type TEXT NOT NULL,
  secret_ref TEXT NOT NULL,

  expires_at TIMESTAMPTZ,

  status TEXT NOT NULL
    DEFAULT 'ACTIVE',

  created_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS
  p16_credentials_integration_status_idx
ON p16_integration_credentials(
  integration_id,
  status
);

CREATE TABLE IF NOT EXISTS
  p16_integration_mappings (
  id UUID PRIMARY KEY
    DEFAULT gen_random_uuid(),

  integration_id UUID NOT NULL
    REFERENCES p16_external_integrations(id)
    ON DELETE CASCADE,

  entity_type TEXT NOT NULL,
  external_type TEXT NOT NULL,

  mapping_version INTEGER
    NOT NULL DEFAULT 1,

  mapping_json TEXT NOT NULL,

  active BOOLEAN
    NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  UNIQUE (
    integration_id,
    entity_type,
    external_type,
    mapping_version
  )
);

CREATE INDEX IF NOT EXISTS
  p16_mappings_integration_entity_idx
ON p16_integration_mappings(
  integration_id,
  entity_type
);

CREATE TABLE IF NOT EXISTS
  p16_external_records (
  id UUID PRIMARY KEY
    DEFAULT gen_random_uuid(),

  integration_id UUID NOT NULL
    REFERENCES p16_external_integrations(id)
    ON DELETE CASCADE,

  tenant_id UUID NOT NULL
    REFERENCES p16_tenants(id)
    ON DELETE CASCADE,

  external_record_id TEXT NOT NULL,
  external_type TEXT NOT NULL,

  source_version TEXT,
  canonical_type TEXT,

  payload_json TEXT NOT NULL,
  checksum TEXT NOT NULL,

  status TEXT NOT NULL
    DEFAULT 'IMPORTED',

  first_seen_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  last_seen_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  UNIQUE (
    integration_id,
    external_record_id,
    external_type
  )
);

CREATE INDEX IF NOT EXISTS
  p16_external_records_tenant_canonical_idx
ON p16_external_records(
  tenant_id,
  canonical_type
);

CREATE INDEX IF NOT EXISTS
  p16_external_records_integration_seen_idx
ON p16_external_records(
  integration_id,
  last_seen_at
);

CREATE TABLE IF NOT EXISTS
  p16_integration_import_jobs (
  id UUID PRIMARY KEY
    DEFAULT gen_random_uuid(),

  integration_id UUID NOT NULL
    REFERENCES p16_external_integrations(id)
    ON DELETE CASCADE,

  tenant_id UUID NOT NULL
    REFERENCES p16_tenants(id)
    ON DELETE CASCADE,

  status TEXT NOT NULL
    DEFAULT 'PENDING',

  cursor TEXT,

  records_read INTEGER
    NOT NULL DEFAULT 0,

  records_created INTEGER
    NOT NULL DEFAULT 0,

  records_updated INTEGER
    NOT NULL DEFAULT 0,

  records_rejected INTEGER
    NOT NULL DEFAULT 0,

  error_json TEXT,

  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS
  p16_import_jobs_tenant_status_idx
ON p16_integration_import_jobs(
  tenant_id,
  status
);

CREATE TABLE IF NOT EXISTS
  p16_integration_export_jobs (
  id UUID PRIMARY KEY
    DEFAULT gen_random_uuid(),

  integration_id UUID NOT NULL
    REFERENCES p16_external_integrations(id)
    ON DELETE CASCADE,

  tenant_id UUID NOT NULL
    REFERENCES p16_tenants(id)
    ON DELETE CASCADE,

  entity_type TEXT NOT NULL,

  status TEXT NOT NULL
    DEFAULT 'PENDING',

  cursor TEXT,

  records_exported INTEGER
    NOT NULL DEFAULT 0,

  records_rejected INTEGER
    NOT NULL DEFAULT 0,

  error_json TEXT,

  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS
  p16_sync_cursors (
  id UUID PRIMARY KEY
    DEFAULT gen_random_uuid(),

  integration_id UUID NOT NULL
    REFERENCES p16_external_integrations(id)
    ON DELETE CASCADE,

  resource TEXT NOT NULL,

  cursor TEXT,

  version INTEGER
    NOT NULL DEFAULT 1,

  last_synced_at TIMESTAMPTZ,

  updated_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  UNIQUE (
    integration_id,
    resource
  )
);

CREATE TABLE IF NOT EXISTS
  p16_data_provenance (
  id UUID PRIMARY KEY
    DEFAULT gen_random_uuid(),

  tenant_id UUID NOT NULL
    REFERENCES p16_tenants(id)
    ON DELETE CASCADE,

  canonical_type TEXT NOT NULL,
  canonical_id TEXT NOT NULL,

  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,

  transformation TEXT,
  mapping_version INTEGER,

  imported_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  metadata_json TEXT
);

CREATE INDEX IF NOT EXISTS
  p16_provenance_lookup_idx
ON p16_data_provenance(
  tenant_id,
  canonical_type,
  canonical_id
);

CREATE TABLE IF NOT EXISTS
  p16_integration_conflicts (
  id UUID PRIMARY KEY
    DEFAULT gen_random_uuid(),

  integration_id UUID NOT NULL
    REFERENCES p16_external_integrations(id)
    ON DELETE CASCADE,

  tenant_id UUID NOT NULL
    REFERENCES p16_tenants(id)
    ON DELETE CASCADE,

  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,

  external_value_json TEXT NOT NULL,
  internal_value_json TEXT NOT NULL,

  conflict_type TEXT NOT NULL,

  status TEXT NOT NULL
    DEFAULT 'OPEN',

  resolution_json TEXT,

  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS
  p16_conflicts_tenant_status_idx
ON p16_integration_conflicts(
  tenant_id,
  status
);

CREATE INDEX IF NOT EXISTS
  p16_conflicts_integration_entity_idx
ON p16_integration_conflicts(
  integration_id,
  entity_id
);

CREATE TABLE IF NOT EXISTS
  p16_external_institutions (
  id UUID PRIMARY KEY
    DEFAULT gen_random_uuid(),

  external_key TEXT UNIQUE NOT NULL,

  name TEXT NOT NULL,
  type TEXT NOT NULL,

  region TEXT,

  verification_status TEXT NOT NULL
    DEFAULT 'UNVERIFIED',

  metadata_json TEXT,

  created_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS
  p16_external_identity_mappings (
  id UUID PRIMARY KEY
    DEFAULT gen_random_uuid(),

  integration_id UUID NOT NULL
    REFERENCES p16_external_integrations(id)
    ON DELETE CASCADE,

  external_user_id TEXT NOT NULL,
  user_id TEXT NOT NULL,

  status TEXT NOT NULL
    DEFAULT 'ACTIVE',

  confidence DOUBLE PRECISION
    NOT NULL DEFAULT 1,

  created_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  UNIQUE (
    integration_id,
    external_user_id
  )
);

CREATE INDEX IF NOT EXISTS
  p16_identity_user_idx
ON p16_external_identity_mappings(
  user_id
);
