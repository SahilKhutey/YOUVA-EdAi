import { Injectable, Logger } from '@nestjs/common';
import { GeminiProvider } from './providers/gemini.provider';
import { OllamaProvider } from './providers/ollama.provider';
import { DeterministicFallbackProvider } from './providers/deterministic-fallback.provider';
import {
  ILlmProvider,
  LlmGenerationOptions,
  LlmGenerationResult,
  ProviderTier,
  StructuredGenerationResult,
  ProviderHealthStatus,
  ModerationCheckResult,
} from './interfaces/llm-provider.interface';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private providers: ILlmProvider[];

  constructor(
    private geminiProvider: GeminiProvider,
    private ollamaProvider: OllamaProvider,
    private fallbackProvider: DeterministicFallbackProvider,
  ) {
    // Priority order: Primary Gemini -> Secondary Ollama -> Deterministic Fallback
    this.providers = [
      this.geminiProvider,
      this.ollamaProvider,
      this.fallbackProvider,
    ];
  }

  /**
   * Dispatches text generation through the provider hierarchy.
   * Guarantees delivery even in a total external AI provider outage.
   */
  async generateTextWithFallback(
    prompt: string,
    options?: LlmGenerationOptions,
  ): Promise<LlmGenerationResult> {
    const timestamp = new Date().toISOString();

    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      try {
        const available = await provider.isAvailable();
        if (!available) {
          this.logger.warn(
            `Provider ${provider.tier} is unavailable. Evaluating next provider.`,
          );
          continue;
        }

        const text = await provider.generateText(prompt, options);
        if (text && text.trim().length > 0) {
          return {
            text,
            provider: provider.tier,
            fallbackUsed: i > 0,
            timestamp,
          };
        }
      } catch (error) {
        this.logger.error(
          `Provider ${provider.tier} failed during generation: ${error.message}. Failing over.`,
        );
      }
    }

    // Deterministic fallback guarantee
    const fallbackText = await this.fallbackProvider.generateText(prompt, options);
    return {
      text: fallbackText,
      provider: ProviderTier.DETERMINISTIC_CACHE,
      fallbackUsed: true,
      timestamp,
    };
  }

  /**
   * Backwards-compatible text generation wrapper.
   */
  async generateText(prompt: string): Promise<string> {
    const result = await this.generateTextWithFallback(prompt);
    return result.text;
  }

  /**
   * Generates structured multiple-choice quiz questions with deterministic fallback.
   */
  async generateQuiz(
    topic: string,
    description: string,
    retries = 3,
  ): Promise<any[]> {
    const prompt = `Generate 5 multiple-choice questions for the topic "${topic}" (${description}). 
    Format the output as a strictly valid JSON array of objects. 
    Each object must have: "content" (string), "options" (array of 4 strings), "correctAnswer" (string, must be one of the options), "explanation" (string).
    Do not include any markdown formatting or code blocks. Just the raw JSON array.`;

    for (let i = 0; i < retries; i++) {
      try {
        const textResponse = await this.generateText(prompt);
        const cleanedResponse = textResponse
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        const json = JSON.parse(cleanedResponse);
        if (Array.isArray(json) && json.length > 0) {
          return json;
        }
      } catch (e) {
        this.logger.warn(`Attempt ${i + 1} failed to parse JSON quiz.`, e);
      }
    }

    // Fall back to pre-computed curriculum questions
    const fallbackResponse = await this.fallbackProvider.generateText(prompt);
    try {
      return JSON.parse(fallbackResponse);
    } catch {
      return [];
    }
  }

  /**
   * Socratic interactive pedagogical dialogue tutor.
   */
  async chatWithTutor(context: string, userMessage: string): Promise<string> {
    const systemPrompt = `You are an expert Socratic Tutor. Your goal is to guide the student to the answer by asking probing questions, rather than giving the answer directly.
      - Never give the direct answer to a problem unless the student is completely stuck after multiple attempts.
      - Be encouraging and concise.
      - If the student asks a conceptual question, explain it simply using analogies.
      - Context: ${context}
      `;

    const fullPrompt = `${systemPrompt}\nStudent: ${userMessage}\nTutor:`;
    return this.generateText(fullPrompt);
  }

  /**
   * Evaluates prompt against basic safety and pedagogical boundary standards.
   */
  moderatePrompt(prompt: string): ModerationCheckResult {
    const lower = prompt.toLowerCase();
    const selfHarmMarkers = ['kill myself', 'suicide', 'end my life', 'cut myself', 'want to die'];
    for (const marker of selfHarmMarkers) {
      if (lower.includes(marker)) {
        return {
          passed: false,
          flaggedCategory: 'SELF_HARM',
          reason: 'Prompt contains severe distress markers requiring pastoral intervention.',
        };
      }
    }

    const jailbreakMarkers = ['ignore all previous instructions', 'bypass system prompt', 'dan mode'];
    for (const jb of jailbreakMarkers) {
      if (lower.includes(jb)) {
        return {
          passed: false,
          flaggedCategory: 'PROMPT_INJECTION',
          reason: 'Prompt contains unauthorized system instruction override attempt.',
        };
      }
    }

    return { passed: true };
  }

  /**
   * Generates strongly-typed structured output adhering to schema guidelines with fallback.
   */
  async generateStructured<T>(
    prompt: string,
    schemaInstruction: string,
    fallbackFactory?: () => T,
    options?: LlmGenerationOptions,
  ): Promise<StructuredGenerationResult<T>> {
    // 1. Run safety moderation check
    const mod = this.moderatePrompt(prompt);
    if (!mod.passed) {
      throw new Error(`SafetyModerationViolation: ${mod.reason}`);
    }

    const fullPrompt = `${prompt}\n\nSchema Requirements:\n${schemaInstruction}\nReturn raw JSON only without markdown formatting.`;
    const result = await this.generateTextWithFallback(fullPrompt, options);

    try {
      const cleaned = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned) as T;
      return {
        data: parsed,
        provider: result.provider,
        fallbackUsed: result.fallbackUsed,
        timestamp: result.timestamp,
        rawText: result.text,
      };
    } catch (parseError) {
      this.logger.warn(`Failed to parse structured JSON from provider ${result.provider}: ${parseError.message}`);
      if (fallbackFactory) {
        return {
          data: fallbackFactory(),
          provider: ProviderTier.DETERMINISTIC_CACHE,
          fallbackUsed: true,
          timestamp: new Date().toISOString(),
          rawText: result.text,
        };
      }
      throw new Error(`StructuredGenerationParseError: Could not parse output into expected schema.`);
    }
  }

  /**
   * Detailed health diagnostics with latency measurement for all provider tiers.
   */
  async getDetailedProviderHealth(): Promise<ProviderHealthStatus[]> {
    const statuses: ProviderHealthStatus[] = [];
    for (const provider of this.providers) {
      const start = Date.now();
      let available = false;
      try {
        available = await provider.isAvailable();
      } catch {
        available = false;
      }
      const latencyMs = Date.now() - start;

      let status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE' = 'OFFLINE';
      if (available) {
        status = latencyMs > 2000 ? 'DEGRADED' : 'HEALTHY';
      }

      statuses.push({
        tier: provider.tier,
        available,
        status,
        latencyMs,
      });
    }
    return statuses;
  }

  /**
   * Health status for all registered LLM provider tiers.
   */
  async getProviderStatus(): Promise<
    { tier: ProviderTier; available: boolean }[]
  > {
    const statusList = [];
    for (const p of this.providers) {
      statusList.push({
        tier: p.tier,
        available: await p.isAvailable(),
      });
    }
    return statusList;
  }
}
