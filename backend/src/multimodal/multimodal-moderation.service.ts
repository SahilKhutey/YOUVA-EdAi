import { Injectable, Logger } from '@nestjs/common';
import { MediaLifecycleState } from './multimodal-types';

export interface ModerationCheckResult {
  passed: boolean;
  flags: string[];
  suggestedAction: 'ALLOW' | 'FLAG_FOR_REVIEW' | 'QUARANTINE';
  reason?: string;
}

@Injectable()
export class MultimodalModerationService {
  private readonly logger = new Logger(MultimodalModerationService.name);

  // Prohibited safety terms for Grade 6-10 educational context
  private readonly SAFETY_PROHIBITIONS = [
    /self\s*[-_]?\s*harm/i,
    /suicide/i,
    /weapons?\s+(making|manufacturing)/i,
    /explosives?/i,
    /hate\s+speech/i,
    /explicit\s+(violence|sexual)/i,
    /harassment/i,
  ];

  // Sensitive identity profiling terms to block in prompts
  private readonly SENSITIVE_PROFILING_TERMS = [
    /caste/i,
    /religion\s+of\s+learner/i,
    /race\s+profiling/i,
    /socioeconomic\s+status\s+of\s+student/i,
  ];

  /**
   * Pre-generation moderation check on prompt templates and instructional requests (N11.38).
   */
  moderatePrompt(prompt: string, context?: { ageGrade?: string }): ModerationCheckResult {
    const flags: string[] = [];

    for (const pattern of this.SAFETY_PROHIBITIONS) {
      if (pattern.test(prompt)) {
        flags.push(`PROHIBITED_CONTENT: ${pattern.toString()}`);
      }
    }

    for (const pattern of this.SENSITIVE_PROFILING_TERMS) {
      if (pattern.test(prompt)) {
        flags.push(`SENSITIVE_PROFILING: ${pattern.toString()}`);
      }
    }

    if (flags.length > 0) {
      this.logger.warn(`Pre-generation moderation flagged prompt: ${flags.join(', ')}`);
      return {
        passed: false,
        flags,
        suggestedAction: 'QUARANTINE',
        reason: 'Violates educational child safety or sensitive profiling policy.',
      };
    }

    return {
      passed: true,
      flags: [],
      suggestedAction: 'ALLOW',
    };
  }

  /**
   * Post-generation or upload moderation on intermediate text representations (OCR, transcripts) (N11.38).
   */
  moderateIntermediateText(
    extractedText: string,
    sourceModality: 'VISION_OCR' | 'AUDIO_TRANSCRIPT',
  ): ModerationCheckResult {
    const flags: string[] = [];

    for (const pattern of this.SAFETY_PROHIBITIONS) {
      if (pattern.test(extractedText)) {
        flags.push(`UNSAFE_REPRESENTATION: ${pattern.toString()}`);
      }
    }

    if (flags.length > 0) {
      this.logger.warn(`Post-extraction moderation flagged ${sourceModality}: ${flags.join(', ')}`);
      return {
        passed: false,
        flags,
        suggestedAction: 'QUARANTINE',
        reason: `Flagged content detected in ${sourceModality}.`,
      };
    }

    return {
      passed: true,
      flags: [],
      suggestedAction: 'ALLOW',
    };
  }

  /**
   * Evaluates child-safety grade suitability (Grades 6-10) (N11.39).
   */
  assertChildSafetyCompliance(content: string): boolean {
    const check = this.moderatePrompt(content);
    return check.passed;
  }

  /**
   * Scrubs personally identifiable information (PII) like phone numbers, emails, and names (N11.16, N11.48).
   */
  scrubPii(text: string): string {
    if (!text) return '';
    let scrubbed = text;
    // Email redaction
    scrubbed = scrubbed.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
    // Phone number redaction
    scrubbed = scrubbed.replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[REDACTED_PHONE]');
    // Explicit name labels (e.g. Student Name: John Doe)
    scrubbed = scrubbed.replace(/(student\s+name:\s*)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi, '$1[REDACTED_NAME]');
    return scrubbed;
  }
}
