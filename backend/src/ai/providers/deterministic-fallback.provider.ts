import { Injectable, Logger } from '@nestjs/common';
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
export class DeterministicFallbackProvider implements ILlmProvider, AiProvider {
  readonly tier = ProviderTier.DETERMINISTIC_CACHE;
  readonly name = 'deterministic';
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

  async generate(request: ProviderGenerationRequest): Promise<ProviderGenerationResult> {
    this.logger.log('Generating deterministic fallback response via AiProvider interface.');
    const start = Date.now();
    const prompt = (request.systemPrompt + '\n' + request.userPrompt).toLowerCase();

    let outputText = '';

    if (prompt.includes('tutor') || prompt.includes('socratic') || prompt.includes('hint')) {
      outputText = JSON.stringify({
        explanation: 'In linear equations, our goal is to isolate the variable. Try grouping variable terms on one side and constants on the other.',
        hint: 'What inverse operation reverses addition on the constant term?',
        misconception: 'Transposing terms without inverting algebraic signs.',
        nextStep: 'PRACTICE',
      });
    } else if (prompt.includes('feedback') || prompt.includes('evaluator') || prompt.includes('assessment')) {
      outputText = JSON.stringify({
        scoreConfidence: 0.85,
        misconceptionIdentified: 'Sign error when moving terms across the equals sign.',
        remediationStep: 'Practice 3 two-step linear equations focusing on inverse addition and subtraction.',
        socraticQuestion: 'If you add 5 to one side of the equation, what must you do to the other side to keep it balanced?',
      });
    } else if (prompt.includes('teacher') || prompt.includes('pedagogical')) {
      outputText = JSON.stringify({
        studentSummary: 'Learner exhibits steady progression in foundational algebra with occasional sign transposition slips.',
        strengthAreas: ['One-step equations', 'Arithmetic calculations'],
        gapAreas: ['Variables on both sides', 'Distributive property'],
        suggestedInterventions: ['Provide balance scale visual representations for algebraic transpositions.'],
        confidenceScore: 0.9,
      });
    } else if (prompt.includes('parent')) {
      outputText = JSON.stringify({
        plainLanguageSummary: 'Your child has been practicing linear equations and is demonstrating steady improvement in accuracy.',
        celebrateProgress: 'Successfully completed recent algebraic practice sessions!',
        suggestedHomeSupport: 'Ask your child to share one equation solving technique they used today.',
      });
    } else if (prompt.includes('content') || prompt.includes('curriculum')) {
      outputText = JSON.stringify({
        title: 'Grade 8 Linear Equations Check',
        questions: [
          {
            question: 'Solve for x: 3x - 4 = 11',
            options: ['x = 5', 'x = 3', 'x = 7', 'x = 15'],
            answer: 'x = 5',
            explanation: 'Add 4 to both sides: 3x = 15. Divide by 3: x = 5.',
          },
        ],
      });
    } else if (prompt.includes('safety')) {
      outputText = JSON.stringify({
        riskCategory: 'GENERAL',
        severity: 'LOW',
        immediateEscalationRequired: false,
        reasoning: 'Routine academic inquiry analyzed by deterministic fallback classifier.',
      });
    } else {
      outputText = JSON.stringify({
        explanation: 'Consider breaking the problem into foundational steps: identify the given information, apply the inverse operation, and check your result.',
        nextStep: 'PRACTICE',
      });
    }

    const latencyMs = Math.max(1, Date.now() - start);
    const inputTokens = Math.max(1, Math.ceil(prompt.length / 4));
    const outputTokens = Math.max(1, Math.ceil(outputText.length / 4));

    return {
      text: outputText,
      provider: this.name,
      model: 'deterministic-rule-engine-v1',
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
