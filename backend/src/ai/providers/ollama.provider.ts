import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  ILlmProvider,
  LlmGenerationOptions,
  ProviderTier,
} from '../interfaces/llm-provider.interface';

@Injectable()
export class OllamaProvider implements ILlmProvider {
  readonly tier = ProviderTier.SECONDARY_OLLAMA;
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

  async generateText(
    prompt: string,
    options?: LlmGenerationOptions,
  ): Promise<string> {
    const response = await axios.post(
      `${this.baseUrl}/api/generate`,
      {
        model: this.modelName,
        prompt: prompt,
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? 1024,
        },
      },
      { timeout: 30000 },
    );

    if (response.data && response.data.response) {
      return response.data.response;
    }
    throw new Error('OllamaProvider returned empty response.');
  }
}
