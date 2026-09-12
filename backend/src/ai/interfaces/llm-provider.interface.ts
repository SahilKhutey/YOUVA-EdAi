export enum ProviderTier {
  PRIMARY_GEMINI = 'PRIMARY_GEMINI',
  SECONDARY_OLLAMA = 'SECONDARY_OLLAMA',
  DETERMINISTIC_CACHE = 'DETERMINISTIC_CACHE',
}

export interface LlmGenerationOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface LlmGenerationResult {
  text: string;
  provider: ProviderTier;
  fallbackUsed: boolean;
  timestamp: string;
}

export interface ILlmProvider {
  readonly tier: ProviderTier;
  isAvailable(): Promise<boolean>;
  generateText(prompt: string, options?: LlmGenerationOptions): Promise<string>;
}
