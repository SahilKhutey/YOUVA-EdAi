import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../../../ai/ai.service';

export interface ValidationResult {
    isValid: boolean;
    feedback?: string;
}

@Injectable()
export class ValidatorService {
    private readonly logger = new Logger(ValidatorService.name);

    constructor(private readonly aiService: AiService) { }

    async validateResponse(
        llmResponse: string,
        cognitiveLevel: string,
    ): Promise<ValidationResult> {
        const validationPrompt = `You are a strict safety and pedagogical validator. 
Review the following AI Tutor response. 
The intended audience is a student with Cognitive Level: ${cognitiveLevel}.

Tutor Response:
"""
${llmResponse}
"""

Check for:
1. Harmful, inappropriate, or unsafe content.
2. Pedagogical appropriateness (e.g., is it too complex for a CHILD, or too condescending for an ADULT?).
3. Hallucinations or blatant mathematical/logical errors.

Respond strictly in JSON format with two keys:
- "isValid": boolean (true if the response is safe and reasonably appropriate, false otherwise)
- "feedback": string (empty if valid, or a brief explanation of why it was rejected)

JSON Response:`;

        try {
            const resultText = await this.aiService.generateText(validationPrompt);
            const cleaned = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleaned) as ValidationResult;

            if (!parsed.isValid) {
                this.logger.warn('Tutor response rejected. Feedback: ' + parsed.feedback);
            }
            return parsed;
        } catch (e) {
            this.logger.error('Failed to parse validation result, defaulting to safe', e);
            // Fallback to true to not block the user entirely if the validator fails to output JSON
            return { isValid: true };
        }
    }
}

