import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  ILlmProvider,
  LlmGenerationOptions,
  ProviderTier,
} from '../interfaces/llm-provider.interface';
import {
  AiProvider,
  ProviderGenerationRequest,
  ProviderGenerationResult,
} from '../interfaces/ai-provider.interface';

@Injectable()
export class GeminiProvider implements ILlmProvider, AiProvider {
  readonly tier = ProviderTier.PRIMARY_GEMINI;
  readonly name = 'gemini';
  private readonly logger = new Logger(GeminiProvider.name);
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor(private configService: ConfigService) {
    const apiKey =
      this.configService.get<string>('GEMINI_API_KEY') ||
      this.configService.get<string>('AI_PROVIDER_API_KEY');
    if (apiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        this.logger.log('GeminiProvider initialized successfully.');
      } catch (err) {
        this.logger.warn('Failed to initialize GoogleGenerativeAI', err);
      }
    } else {
      this.logger.warn('GEMINI_API_KEY is not set. GeminiProvider will report unavailable.');
    }
  }

  async isAvailable(): Promise<boolean> {
    return this.model !== null;
  }

  async generate(request: ProviderGenerationRequest): Promise<ProviderGenerationResult> {
    if (!this.model) {
      throw new Error('GeminiProvider is not configured or available.');
    }

    const start = Date.now();
    const prompt = request.systemPrompt
      ? `${request.systemPrompt}\n\nUser:\n${request.userPrompt}`
      : request.userPrompt;

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`GeminiTimeout: Request exceeded ${request.timeoutMs || 5000}ms`)),
        request.timeoutMs || 5000,
      ),
    );

    const callPromise = (async () => {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    })();

    const text = await Promise.race([callPromise, timeoutPromise]);
    const latencyMs = Date.now() - start;

    const inputTokens = Math.max(1, Math.ceil(prompt.length / 4));
    const outputTokens = Math.max(1, Math.ceil(text.length / 4));

    return {
      text,
      provider: this.name,
      model: 'gemini-1.5-flash',
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      latencyMs,
    };
  }

  async generateText(
    prompt: string,
    options?: LlmGenerationOptions,
  ): Promise<string> {
    const res = await this.generate({
      systemPrompt: options?.systemPrompt || '',
      userPrompt: prompt,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
      timeoutMs: options?.timeoutMs,
    });
    return res.text;
  }
}
