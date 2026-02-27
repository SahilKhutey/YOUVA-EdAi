import { Injectable } from '@nestjs/common';
import { LearningModule } from '../../learning/learning.module';

@Injectable()
export class InterventionService {

    constructor() { }

    async evaluateIntervention(
        userId: string,
        topicId: string,
        engagementScore: number,
        fatigueIndex: number,
        accuracy: number,
        consistency: number
    ): Promise<string> {

        // Action 1: Break Suggestion (High Fatigue)
        if (fatigueIndex > 2.0 && consistency < 0.5) {
            // Logic to emit socket event or HTTP flag to UI could happen here
            return 'BREAK_SUGGESTED';
        }

        // Action 2: Difficulty Drop (High Errors, Low Accuracy)
        if (accuracy < 0.3) {
            // Here we would interface with the ACLE Bkt/Rl services to drop difficulty
            // Since it's decoupled by REST, we document the trigger
            return 'DIFFICULTY_DROPPED';
        }

        // Action 3: Gamified Motivation Boost (Low Activity/Hesitation but not fatigued)
        if (consistency < 0.3 && fatigueIndex <= 1.5) {
            // Trigger a mini-challenge from gamification module
            return 'GAMIFIED_CHALLENGE';
        }

        return 'NONE_NEEDED';
    }
}
