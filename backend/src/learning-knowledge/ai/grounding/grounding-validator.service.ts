import { Injectable, Logger } from '@nestjs/common';
import { AiContext } from '../ai.types';

@Injectable()
export class GroundingValidatorService {
  private readonly logger = new Logger(GroundingValidatorService.name);
  private readonly GROUNDING_THRESHOLD = 0.65;

  /**
   * Validates that generated text is grounded in the provided curriculum context.
   * Computes a grounding score and flags unsupported terminology or hallucinations.
   */
  validateGrounding(
    generatedText: string,
    context: AiContext,
  ): {
    groundingScore: number;
    isGrounded: boolean;
    unsupportedClaims: string[];
  } {
    if (!generatedText || generatedText.trim().length === 0) {
      return { groundingScore: 0, isGrounded: false, unsupportedClaims: ['Empty generated text'] };
    }

    // 1. Build source vocabulary from target knowledge and prerequisites
    const sourceCorpus = [
      context.targetKnowledge.title,
      context.targetKnowledge.content,
      ...(context.prerequisites?.map((p) => `${p.title} ${p.content}`) || []),
      ...(context.relatedKnowledge?.map((r) => r.title) || []),
    ]
      .join(' ')
      .toLowerCase();

    const sourceTokens = new Set(this.tokenize(sourceCorpus));

    // 2. Tokenize generated text
    const generatedTokens = this.tokenize(generatedText.toLowerCase());
    if (generatedTokens.length === 0) {
      return { groundingScore: 1.0, isGrounded: true, unsupportedClaims: [] };
    }

    // Filter out common English stop words so domain terminology is evaluated
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'for', 'of',
      'with', 'as', 'by', 'that', 'this', 'it', 'from', 'or', 'be', 'are', 'was',
      'were', 'will', 'can', 'has', 'have', 'had', 'do', 'does', 'did', 'but', 'not',
      'you', 'your', 'we', 'our', 'they', 'their', 'he', 'she', 'his', 'her', 'what',
      'when', 'where', 'how', 'why', 'who', 'so', 'if', 'then', 'than', 'more', 'also',
      'let', 'us', 'see', 'example', 'here', 'there', 'about', 'some', 'other', 'all',
    ]);

    const domainTokens = generatedTokens.filter((t) => !stopWords.has(t) && t.length > 2);
    if (domainTokens.length === 0) {
      return { groundingScore: 0.90, isGrounded: true, unsupportedClaims: [] };
    }

    // Count matched domain tokens
    let matchedCount = 0;
    const unmatchedTokens: string[] = [];

    for (const token of domainTokens) {
      if (sourceTokens.has(token)) {
        matchedCount++;
      } else {
        unmatchedTokens.push(token);
      }
    }

    const groundingScore = Math.min(
      1.0,
      Math.max(0.0, Number((matchedCount / domainTokens.length).toFixed(2))),
    );

    const isGrounded = groundingScore >= this.GROUNDING_THRESHOLD;
    const unsupportedClaims =
      !isGrounded && unmatchedTokens.length > 5
        ? [`Potentially ungrounded domain terms: ${Array.from(new Set(unmatchedTokens)).slice(0, 5).join(', ')}`]
        : [];

    return {
      groundingScore,
      isGrounded,
      unsupportedClaims,
    };
  }

  private tokenize(text: string): string[] {
    return text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 0);
  }
}
