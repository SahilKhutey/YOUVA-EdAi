import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  ILlmProvider,
  LlmGenerationOptions,
  ProviderTier,
} from '../interfaces/llm-provider.interface';

@Injectable()
export class GeminiProvider implements ILlmProvider {
  readonly tier = ProviderTier.PRIMARY_GEMINI;
  private readonly logger = new Logger(GeminiProvider.name);
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
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

  async generateText(
    prompt: string,
    options?: LlmGenerationOptions,
  ): Promise<string> {
    if (!this.model) {
      throw new Error('GeminiProvider is not configured or available.');
    }

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }
}
