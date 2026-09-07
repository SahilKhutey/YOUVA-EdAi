export enum IntegrationProvider {
  CANVAS_LMS = 'CANVAS_LMS',
  GOOGLE_CLASSROOM = 'GOOGLE_CLASSROOM',
  CLEVER = 'CLEVER',
  ONEROSTER = 'ONEROSTER',
  CUSTOM_WEBHOOK = 'CUSTOM_WEBHOOK',
}

export interface NormalizedStudent {
  externalId: string;
  email: string;
  firstName: string;
  lastName: string;
  gradeLevel?: string;
}

export interface NormalizedCourse {
  externalId: string;
  name: string;
  code?: string;
}

export interface SyncRosterResult {
  integrationId: string;
  provider: string;
  syncedCount: number;
  students: NormalizedStudent[];
  timestamp: string;
}

export interface OutboundWebhookResult {
  tenantId: string;
  eventType: string;
  signature: string;
  delivered: boolean;
  timestamp: string;
}
