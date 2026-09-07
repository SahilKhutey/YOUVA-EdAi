import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type AITask =
  | 'HINT'
  | 'EXPLANATION'
  | 'PRACTICE_GENERATION'
  | 'ASSESSMENT'
  | 'MULTIMODAL'
  | 'TEACHER_ANALYSIS';

export interface ModelRoute {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

@Injectable()
export class ModelRoutingService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Dynamically select the optimal model route based on safety policy, task, age tier, and complexity.
   */
  route(
    task: AITask,
    input: {
      ageTier: string;
      modality?: string;
      complexity?: 'LOW' | 'MEDIUM' | 'HIGH';
    },
  ): ModelRoute {
    const provider = this.configService.get<string>('AI_PROVIDER', 'google-generative-ai');

    const safeFastModel = this.configService.get<string>(
      'AI_SAFE_FAST_MODEL',
      'gemini-1.5-flash-safe',
    );
    const multimodalModel = this.configService.get<string>(
      'AI_MULTIMODAL_MODEL',
      'gemini-1.5-flash',
    );
    const reasoningModel = this.configService.get<string>(
      'AI_REASONING_MODEL',
      'gemini-1.5-pro',
    );
    const fastModel = this.configService.get<string>(
      'AI_FAST_MODEL',
      'gemini-1.5-flash',
    );

    const isKids = input.ageTier?.toUpperCase() === 'KIDS' || input.ageTier?.toUpperCase() === 'CHILD';

    // Invariant: For young children, always enforce conservative, high-safety fast models
    if (isKids) {
      return {
        provider,
        model: safeFastModel,
        temperature: 0.2,
        maxTokens: 500,
      };
    }

    if (task === 'MULTIMODAL' || input.modality === 'IMAGE' || input.modality === 'AUDIO') {
      return {
        provider,
        model: multimodalModel,
        temperature: 0.2,
        maxTokens: 1200,
      };
    }

    if (task === 'TEACHER_ANALYSIS' || input.complexity === 'HIGH') {
      return {
        provider,
        model: reasoningModel,
        temperature: 0.1,
        maxTokens: 1800,
      };
    }

    return {
      provider,
      model: fastModel,
      temperature: 0.2,
      maxTokens: 900,
    };
  }
}
