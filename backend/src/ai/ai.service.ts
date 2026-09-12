import { Injectable, Logger } from '@nestjs/common';
import { GeminiProvider } from './providers/gemini.provider';
import { OllamaProvider } from './providers/ollama.provider';
import { DeterministicFallbackProvider } from './providers/deterministic-fallback.provider';
import {
  ILlmProvider,
  LlmGenerationOptions,
  LlmGenerationResult,
  ProviderTier,
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
