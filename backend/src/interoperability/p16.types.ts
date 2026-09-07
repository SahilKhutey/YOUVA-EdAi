export type IntegrationStatus =
  | 'ACTIVE'
  | 'DISABLED'
  | 'ERROR';

export type JobStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCESS'
  | 'FAILED'
  | 'RETRY'
  | 'DEAD_LETTER';

export interface AuthenticatedRequestUser {
  userId: string;
  email?: string;
  role: string;
}

export interface CanonicalExternalRecord {
  source: {
    provider: string;
    integrationId: string;
    recordId: string;
    version?: string;
  };

  entity: {
    type: string;
    id?: string;
  };

  payload: unknown;

  provenance: {
    importedAt: string;
    mappingVersion: number;
  };
}

export interface PullResult {
  records: CanonicalExternalRecord[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface IntegrationRecord {
  id: string;
  tenant_id: string;
  provider: string;
  name: string;
  status: IntegrationStatus;
  config_json: string | null;
  capabilities_json: string | null;
}

export interface ExternalIntegrationAdapter {
  readonly provider: string;

  testConnection(
    integration: IntegrationRecord,
  ): Promise<{
    success: boolean;
    message?: string;
  }>;

  pull(
    integration: IntegrationRecord,
    cursor?: string,
  ): Promise<PullResult>;

  push(
    integration: IntegrationRecord,
    records: CanonicalExternalRecord[],
  ): Promise<{
    accepted: number;
    rejected: number;
  }>;
}

export interface IntegrationConfig {
  baseUrl: string;
  pullPath?: string;
  pushPath?: string;
  timeoutMs?: number;
  mappingVersion?: number;
}

export interface CreateIntegrationInput {
  provider: string;
  name: string;
  config: IntegrationConfig;
  capabilities?: string[];
}

export const P16EventTypes = {
  INTEGRATION_CREATED: 'integration.created',
  INTEGRATION_CONNECTED: 'integration.connected',
  INTEGRATION_FAILED: 'integration.failed',
  IMPORT_STARTED: 'integration.import.started',
  IMPORT_COMPLETED: 'integration.import.completed',
  IMPORT_FAILED: 'integration.import.failed',
  EXTERNAL_RECORD_IMPORTED: 'integration.external_record.imported',
  EXTERNAL_RECORD_UPDATED: 'integration.external_record.updated',
  CONFLICT_CREATED: 'integration.conflict.created',
  CONFLICT_RESOLVED: 'integration.conflict.resolved',
  EXPORT_STARTED: 'integration.export.started',
  EXPORT_COMPLETED: 'integration.export.completed',
  IDENTITY_MAPPED: 'integration.identity.mapped',
  CREDENTIAL_IMPORTED: 'credential.external.imported',
  CREDENTIAL_EXPORTED: 'credential.external.exported',
} as const;
