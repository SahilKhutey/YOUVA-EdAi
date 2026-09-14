import { Injectable } from '@nestjs/common';
import {
  AiProvider,
  ProviderGenerationRequest,
  ProviderGenerationResult,
} from '../interfaces/ai-provider.interface';

@Injectable()
export class MockAiProvider implements AiProvider {
  public readonly name = 'mock';

  public isAvailableMock = true;
  public forceTimeout = false;
  public forceError: Error | null = null;
  public cannedResponse: string | null = null;
  public responseDelayMs = 0;
  public callCount = 0;

  async isAvailable(): Promise<boolean> {
    return this.isAvailableMock;
  }

  async generate(request: ProviderGenerationRequest): Promise<ProviderGenerationResult> {
    this.callCount++;

    if (this.forceTimeout) {
      const waitTime = Math.min(request.timeoutMs || 800, 1200) + 100;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      throw new Error(`MockProviderTimeout: Request exceeded ${request.timeoutMs}ms`);
    }

    if (this.forceError) {
      throw this.forceError;
    }

    if (this.responseDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.responseDelayMs));
    }

    const outputText = this.cannedResponse || this.getDefaultResponse(request);
    const inputTokens = Math.ceil((request.systemPrompt.length + request.userPrompt.length) / 4);
    const outputTokens = Math.ceil(outputText.length / 4);

    return {
      text: outputText,
      provider: this.name,
      model: 'mock-model-v1',
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      latencyMs: this.responseDelayMs,
    };
  }

  private getDefaultResponse(request: ProviderGenerationRequest): string {
    const system = (request.systemPrompt || '').toLowerCase();
    const prompt = (request.systemPrompt + ' ' + request.userPrompt).toLowerCase();

    // 1. Content Generation Prompt
    if (system.includes('curriculum content designer') || prompt.includes('content_generator')) {
      return JSON.stringify({
        title: 'Diagnostic Test: Linear Equations in One Variable',
        questions: [
          {
            question: 'Solve for x: 2x + 5 = 15',
            options: ['x = 5', 'x = 10', 'x = 7.5', 'x = 4'],
            answer: 'x = 5',
            explanation: 'Subtract 5 from both sides: 2x = 10. Divide by 2: x = 5.',
          },
        ],
      });
    }

    // 2. Assessment Feedback
    if (system.includes('diagnostic learning evaluator') || prompt.includes('assessment_feedback')) {
      return JSON.stringify({
        scoreConfidence: 0.9,
        misconceptionIdentified: 'Sign inversion error during transposition.',
        remediationStep: 'Review two-step linear equations with signed numbers.',
        socraticQuestion: 'What is the sign when moving a negative term across the equals sign?',
      });
    }

    // 3. Teacher Summary
    if (system.includes('pedagogical assistant') || prompt.includes('teacher_summary')) {
      return JSON.stringify({
        studentSummary: 'Learner shows strong mastery in single-variable arithmetic but needs reinforcement in distributive equations.',
        strengthAreas: ['Linear Operations', 'Order of Operations'],
        gapAreas: ['Distributive Property', 'Fractions with Variables'],
        suggestedInterventions: ['1-on-1 scaffolding on expanding brackets'],
        confidenceScore: 0.88,
      });
    }

    // 4. Parent Summary
    if (system.includes('parent liaison') || prompt.includes('parent_summary')) {
      return JSON.stringify({
        plainLanguageSummary: 'Your learner made great progress this week, practicing linear equations and solving 5 problems accurately.',
        celebrateProgress: 'Maintained a 4-day active learning streak!',
        suggestedHomeSupport: 'Ask your child to explain how they balance an algebraic equation using a physical balance scale analogy.',
      });
    }

    // 5. Safety Classification
    if (system.includes('pastoral safety') || prompt.includes('safety_support')) {
      return JSON.stringify({
        riskCategory: 'GENERAL',
        severity: 'LOW',
        immediateEscalationRequired: false,
        reasoning: 'Routine pastoral inquiry evaluated by mock safety classifier.',
      });
    }

    // 6. Tutor / Socratic (Default for tutoring)
    if (
      system.includes('socratic tutor') ||
      system.includes('explaining concepts') ||
      prompt.includes('tutor') ||
      prompt.includes('hint')
    ) {
      return JSON.stringify({
        explanation: 'Think about isolating the variable by applying inverse operations step-by-step.',
        hint: 'What happens when you subtract the constant term from both sides?',
        misconception: 'Combining unlike algebraic terms.',
        nextStep: 'PRACTICE',
      });
    }

    // Generic fallback object
    return JSON.stringify({
      explanation: 'General pedagogical guidance for problem solving.',
      nextStep: 'PRACTICE',
    });
  }

  reset(): void {
    this.isAvailableMock = true;
    this.forceTimeout = false;
    this.forceError = null;
    this.cannedResponse = null;
    this.responseDelayMs = 0;
    this.callCount = 0;
  }
}
