import { Injectable, Logger } from '@nestjs/common';
import {
  ILlmProvider,
  LlmGenerationOptions,
  ProviderTier,
} from '../interfaces/llm-provider.interface';

@Injectable()
export class DeterministicFallbackProvider implements ILlmProvider {
  readonly tier = ProviderTier.DETERMINISTIC_CACHE;
  private readonly logger = new Logger(DeterministicFallbackProvider.name);

  // Pre-computed curriculum responses matching Python Phase 8
  private static readonly CURRICULUM_RESPONSES: Record<string, string> = {
    'MATH-G8-LINEQ-01':
      'To solve a linear equation in one variable, isolate the unknown variable using inverse operations on both sides.',
    'MATH-G10-QUAD-01':
      'For ax^2 + bx + c = 0, calculate the discriminant D = b^2 - 4ac to determine the number and nature of roots.',
  };

  async isAvailable(): Promise<boolean> {
    return true; // Always 100% available
  }

  async generateText(
    prompt: string,
    options?: LlmGenerationOptions,
  ): Promise<string> {
    this.logger.log('Serving deterministic pedagogical fallback response.');

    // If prompt is a quiz request, return deterministic JSON quiz array
    if (prompt.includes('multiple-choice questions') || prompt.includes('strictly valid JSON array')) {
      return JSON.stringify([
        {
          content: 'What is the first step to solve 3x + 5 = 20?',
          options: [
            'Subtract 5 from both sides',
            'Divide both sides by 3',
            'Add 5 to both sides',
            'Multiply both sides by 20',
          ],
          correctAnswer: 'Subtract 5 from both sides',
          explanation:
            'Using inverse operations, subtract the constant term 5 from both sides to isolate the 3x term.',
        },
        {
          content: 'If 2x = 14, what is the value of x?',
          options: ['7', '12', '28', '16'],
          correctAnswer: '7',
          explanation: 'Divide both sides by 2: x = 14 / 2 = 7.',
        },
      ]);
    }

    // Check for specific curriculum topic keys in prompt
    for (const [key, response] of Object.entries(
      DeterministicFallbackProvider.CURRICULUM_RESPONSES,
    )) {
      if (prompt.includes(key)) {
        return response;
      }
    }

    // Socratic tutor fallback prompt handling
    if (prompt.includes('Tutor:') || prompt.includes('Socratic')) {
      return 'Let us look at what we are trying to solve step-by-step. What is the first inverse operation you can perform to isolate the variable?';
    }

    // Default pedagogical response
    return 'Consider breaking the problem into foundational steps: identify the given information, apply the inverse operation, and check your result.';
  }
}
