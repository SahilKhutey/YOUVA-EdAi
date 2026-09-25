import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Role } from '../../../auth/role.enum';
import { AiCapability, AI_CAPABILITY_POLICIES } from '../ai.types';

@Injectable()
export class AiGuardrailService {
  private readonly logger = new Logger(AiGuardrailService.name);

  // Injection patterns to detect and block
  private readonly INJECTION_PATTERNS = [
    /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
    /disregard\s+(all\s+)?(previous|prior)\s+instructions/i,
    /system\s+override/i,
    /you\s+are\s+now\s+in\s+dan\s+mode/i,
    /jailbreak/i,
    /reveal\s+(the\s+)?system\s+prompt/i,
  ];

  /**
   * Enforces role-based capability authorization.
   */
  validateCapabilityAccess(capability: AiCapability, role: Role): void {
    const policy = AI_CAPABILITY_POLICIES[capability];
    if (!policy) {
      throw new BadRequestException(`Unknown AI capability '${capability}'`);
    }

    if (!policy.roles.includes(role)) {
      throw new ForbiddenException(
        `Role '${role}' is not authorized to invoke AI capability '${capability}'`,
      );
    }
  }

  /**
   * Sanitizes user input against prompt injection and bounds prompt length.
   */
  sanitizeInputPrompt(input: string): string {
    if (!input) return '';

    // Check for prompt injection patterns
    for (const pattern of this.INJECTION_PATTERNS) {
      if (pattern.test(input)) {
        this.logger.warn(`Prompt injection pattern detected: ${pattern}`);
        throw new BadRequestException(
          'Input contains disallowed instructions or prompt injection patterns.',
        );
      }
    }

    // Limit length to 2000 characters
    const trimmed = input.trim();
    if (trimmed.length > 2000) {
      return trimmed.slice(0, 2000);
    }

    return trimmed;
  }

  /**
   * Ensures generated hint does not leak the exact answer to the student.
   */
  validateHintOutput(hintText: string, expectedAnswer?: string): string {
    if (!expectedAnswer || expectedAnswer.trim().length === 0) {
      return hintText;
    }

    const answer = expectedAnswer.trim().toLowerCase();
    const hintLower = hintText.toLowerCase();

    // If hint directly includes the answer, mask or rephrase
    if (answer.length >= 1 && hintLower.includes(answer)) {
      this.logger.warn('Direct answer leakage detected in AI hint. Masking answer.');
      return `Hint: Review the core formula and solve step-by-step. Remember to balance both sides of the equation.`;
    }

    return hintText;
  }
}
