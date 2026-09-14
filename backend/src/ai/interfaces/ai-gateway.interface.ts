import { ModelPolicy } from './ai-provider.interface';

export type AiPurpose =
  | 'TUTOR'
  | 'ASSESSMENT'
  | 'FEEDBACK'
  | 'CONTENT'
  | 'TEACHER_ASSIST'
  | 'PARENT_SUMMARY'
  | 'SAFETY_SUPPORT';

export interface AiGenerationRequest {
  tenantId: string;
  actorId: string;
  actorRole?: string;
  purpose: AiPurpose;
  modelPolicy: ModelPolicy;
  input: unknown;
  correlationId: string;
  requiresHumanAuthorization: boolean;
  promptKey?: string;
  promptVersion?: string;
}

export interface AiUsageMetrics {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
}

export interface AiSafetyResult {
  passed: boolean;
  flags: string[];
  moderationReason?: string;
}

export interface AiGenerationResult<T = unknown> {
  requestId: string;
  provider: string;
  model: string;
  output: T;
  rawText?: string;
  usage?: AiUsageMetrics;
  safety: AiSafetyResult;
  persisted: boolean;
  auditEventId: string;
  fallbackUsed: boolean;
  latencyMs: number;
}

export interface AiGateway {
  generate<T = unknown>(request: AiGenerationRequest): Promise<AiGenerationResult<T>>;
}
