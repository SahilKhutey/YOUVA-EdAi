import { Injectable, ForbiddenException } from '@nestjs/common';
import { AiSafetyResult } from '../interfaces/ai-gateway.interface';

@Injectable()
export class AiSafetyModeratorService {
  private readonly selfHarmPatterns = [
    /kill\s+myself/i,
    /suicide/i,
    /end\s+my\s+life/i,
    /cut\s+myself/i,
    /want\s+to\s+die/i,
    /hang\s+myself/i,
    /slit\s+my\s+wrists/i,
  ];

  private readonly jailbreakPatterns = [
    /ignore\s+(all\s+)?(previous|prior|system)\s+instructions/i,
    /bypass\s+system\s+prompt/i,
    /dan\s+mode/i,
    /developer\s+mode\s+output/i,
    /unrestricted\s+ai/i,
    /do\s+anything\s+now/i,
    /jailbreak/i,
  ];

  private readonly exfiltrationPatterns = [
    /show\s+me\s+another\s+student/i,
    /other\s+student('?s)?\s+records/i,
    /exfiltrate/i,
    /other\s+tenant/i,
    /reveal\s+(system\s+prompt|instructions|secret)/i,
    /dump\s+(all\s+)?users/i,
    /extract\s+database/i,
  ];

  private readonly injectionPatterns = [
    /<script\b[^>]*>/i,
    /javascript:/i,
    /onerror\s*=/i,
    /onload\s*=/i,
    /union\s+select/i,
    /drop\s+table/i,
    /--;/i,
  ];

  /**
   * Evaluates text for safety violations and adversarial vectors.
   */
  moderateInput(text: string): AiSafetyResult {
    if (!text || typeof text !== 'string') {
      return { passed: true, flags: [] };
    }

    const flags: string[] = [];
    let moderationReason: string | undefined;

    // 1. Check for acute self-harm / distress
    for (const pattern of this.selfHarmPatterns) {
      if (pattern.test(text)) {
        flags.push('SELF_HARM');
        moderationReason = 'Prompt contains indicators of acute distress or self-harm requiring pastoral care.';
        break;
      }
    }

    // 2. Check for jailbreak / prompt injection
    for (const pattern of this.jailbreakPatterns) {
      if (pattern.test(text)) {
        flags.push('PROMPT_INJECTION');
        moderationReason = moderationReason || 'Unauthorized attempt to override system instructions.';
        break;
      }
    }

    // 3. Check for tenant / data exfiltration
    for (const pattern of this.exfiltrationPatterns) {
      if (pattern.test(text)) {
        flags.push('TENANT_EXFILTRATION_ATTEMPT');
        moderationReason = moderationReason || 'Unauthorized request attempting cross-tenant or cross-user exfiltration.';
        break;
      }
    }

    // 4. Check for code / script / SQL injection
    for (const pattern of this.injectionPatterns) {
      if (pattern.test(text)) {
        flags.push('INJECTION_ATTACK');
        moderationReason = moderationReason || 'Malicious script, markup, or SQL injection pattern detected.';
        break;
      }
    }

    return {
      passed: flags.length === 0,
      flags,
      moderationReason,
    };
  }

  /**
   * Validates model generated output to prevent answer leakage or script injection.
   */
  moderateOutput(output: string, context?: { expectedAnswer?: string; isAssessed?: boolean }): AiSafetyResult {
    const flags: string[] = [];

    // Strip dangerous HTML/scripts
    for (const pattern of this.injectionPatterns) {
      if (pattern.test(output)) {
        flags.push('MALICIOUS_OUTPUT_STRIPPED');
        break;
      }
    }

    // Prevent direct answer leakage on assessed student work when hints are requested
    if (context?.isAssessed && context?.expectedAnswer) {
      const lowerOutput = output.toLowerCase();
      const lowerAnswer = context.expectedAnswer.toLowerCase().trim();
      if (lowerAnswer.length > 2 && lowerOutput.includes(`the answer is ${lowerAnswer}`)) {
        flags.push('ANSWER_DISCLOSURE_PREVENTED');
      }
    }

    return {
      passed: flags.length === 0,
      flags,
    };
  }

  /**
   * Enforces the hard governance invariant that AI roles cannot close safety incidents.
   */
  assertAiCannotResolveSafety(actorRole?: string, actorType?: string): void {
    if (actorRole === 'AI' || actorRole === 'BOT' || actorType === 'AI' || actorType === 'SYSTEM') {
      throw new ForbiddenException('SafetyGovernanceViolation: AI systems are strictly prohibited from closing safety incidents');
    }
  }
}
