export enum ProviderTier {
  PRIMARY_GEMINI = 'PRIMARY_GEMINI',
  SECONDARY_OLLAMA = 'SECONDARY_OLLAMA',
  DETERMINISTIC_CACHE = 'DETERMINISTIC_CACHE',
}

export interface LlmGenerationOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  timeoutMs?: number;
}

export interface LlmGenerationResult {
  text: string;
  provider: ProviderTier;
  fallbackUsed: boolean;
  timestamp: string;
}

export interface StructuredGenerationResult<T> {
  data: T;
  provider: ProviderTier;
  fallbackUsed: boolean;
  timestamp: string;
  rawText?: string;
}

export interface ProviderHealthStatus {
  tier: ProviderTier;
  available: boolean;
  status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
  latencyMs?: number;
}

export interface ModerationCheckResult {
  passed: boolean;
  flaggedCategory?: string;
  sanitizedPrompt?: string;
  reason?: string;
}

export interface ILlmProvider {
  readonly tier: ProviderTier;
  isAvailable(): Promise<boolean>;
  generateText(prompt: string, options?: LlmGenerationOptions): Promise<string>;
}

