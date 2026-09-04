import { Injectable } from '@nestjs/common';
import { CognitiveTwinService } from '../../cognitive-twin/cognitive-twin.service';

export type TeachingStrategy =
    | 'DIRECT_INSTRUCTION'
    | 'SCAFFOLDED_LEARNING'
    | 'INQUIRY_BASED'
    | 'PROJECT_BASED'
    | 'SOCRATIC_QUESTIONING';

@Injectable()
export class PedagogicalCoreService {
    constructor(private cognitiveTwin: CognitiveTwinService) { }

    /**
     * Dynamically selects the best teaching strategy based on the student's Cognitive Twin.
     */
    async determineStrategy(userId: string, topicDifficulty: number): Promise<TeachingStrategy> {
        const profile = await this.cognitiveTwin.getProfile(userId);

        // High velocity + High Attention span = Project-based or Inquiry-based
        if (profile.learningVelocityIndex > 1.2 && profile.attentionSpan > 25) {
            return topicDifficulty > 0.7 ? 'INQUIRY_BASED' : 'PROJECT_BASED';
        }

        // Low attention span = Direct Instruction (keep it brief)
        if (profile.attentionSpan < 10) {
            return 'DIRECT_INSTRUCTION';
        }

        // High retention but average speed = Socratic
        if (profile.memoryRetentionRate > 0.85) {
            return 'SOCRATIC_QUESTIONING';
        }

        // Default fallback for average learners or high difficulty
        return 'SCAFFOLDED_LEARNING';
    }

    /**
     * Generates a prompt modifier based on the chosen strategy and cognitive profile.
     * This is prepended to LLM calls to force the AI into the correct pedagogical "mode".
     */
    async getPedagogicalPromptModifier(userId: string, strategy: TeachingStrategy): Promise<string> {
        const profile = await this.cognitiveTwin.getProfile(userId);
        let modifier = `[PEDAGOGICAL CONSTRAINT: You MUST adopt a ${strategy} teaching style. `;

        switch (strategy) {
            case 'SCAFFOLDED_LEARNING':
                modifier += `Break the concept down into very small, incremental steps. Do not jump to the final conclusion. Check for understanding after every step. `;
                break;
            case 'INQUIRY_BASED':
                modifier += `Do not give the direct answer. Provide clues, analogies, and guide the student to discover the underlying principle themselves. `;
                break;
            case 'PROJECT_BASED':
                modifier += `Frame this concept around a real-world, hands-on project. Focus on application over pure theory. `;
                break;
            case 'SOCRATIC_QUESTIONING':
                modifier += `Respond primarily with probing questions that expose the student's assumptions or logic gaps. `;
                break;
            case 'DIRECT_INSTRUCTION':
                modifier += `Provide a clear, concise, and definitive explanation. Minimize cognitive load. Get straight to the point. `;
                break;
        }

        modifier += `Student Cognitive Profile Context: Learning Velocity Multiplier: ${profile.learningVelocityIndex.toFixed(2)}, Max Attention Span: ${profile.attentionSpan} mins.]\n\n`;

        return modifier;
    }
}
