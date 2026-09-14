import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
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
export class OllamaProvider implements ILlmProvider, AiProvider {
  readonly tier = ProviderTier.SECONDARY_OLLAMA;
  readonly name = 'ollama';
  private readonly logger = new Logger(OllamaProvider.name);
  private readonly baseUrl: string;
  private readonly modelName: string;

  constructor(private configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('OLLAMA_BASE_URL') ||
      'http://localhost:11434';
    this.modelName =
      this.configService.get<string>('OLLAMA_MODEL') || 'llama3:8b';
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await axios.get(`${this.baseUrl}/api/tags`, { timeout: 1500 });
      return res.status === 200;
    } catch {
      return false;
    }
  }

  async generate(request: ProviderGenerationRequest): Promise<ProviderGenerationResult> {
    const start = Date.now();
    const prompt = request.systemPrompt
      ? `${request.systemPrompt}\n\nUser:\n${request.userPrompt}`
      : request.userPrompt;

    const response = await axios.post(
      `${this.baseUrl}/api/generate`,
      {
        model: this.modelName,
        prompt,
        stream: false,
        options: {
          temperature: request.temperature ?? 0.7,
          num_predict: request.maxTokens ?? 1024,
        },
      },
      { timeout: request.timeoutMs || 10000 },
    );

    if (response.data && response.data.response) {
      const text = response.data.response;
      const latencyMs = Date.now() - start;
      const inputTokens = Math.max(1, Math.ceil(prompt.length / 4));
      const outputTokens = Math.max(1, Math.ceil(text.length / 4));

      return {
        text,
        provider: this.name,
        model: this.modelName,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        latencyMs,
      };
    }

    throw new Error('OllamaProvider returned empty response.');
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
