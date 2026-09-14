export type ModelCapability =
  | 'FAST_TUTOR'
  | 'REASONING'
  | 'CONTENT_GENERATION'
  | 'VISION'
  | 'AUDIO'
  | 'EMBEDDING';

export interface ModelPolicy {
  capability: ModelCapability;
  maxCostPerRequest?: number;
  maxLatencyMs?: number;
  allowedProviders: string[];
  fallbackAllowed: boolean;
  preferredModel?: string;
}

export interface ProviderGenerationRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  jsonMode?: boolean;
}

export interface ProviderGenerationResult {
  text: string;
  provider: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  latencyMs: number;
}

export interface AiProvider {
  readonly name: string;
  isAvailable(): Promise<boolean>;
  generate(request: ProviderGenerationRequest): Promise<ProviderGenerationResult>;
}
