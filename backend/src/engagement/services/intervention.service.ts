import { Injectable } from '@nestjs/common';
import { NotificationService } from '../../notification/notification.service';

@Injectable()
export class InterventionService {

    constructor(private notificationService: NotificationService) { }

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
            await this.notificationService.create(
                userId,
                'INTERVENTION',
                '☕ Time for a Break!',
                'You\'ve been studying hard. A 5-minute break will help your brain consolidate what you\'ve learnt.',
                { trigger: 'BREAK_SUGGESTED', fatigueIndex },
            );
            return 'BREAK_SUGGESTED';
        }

        // Action 2: Difficulty Drop (High Errors, Low Accuracy)
        if (accuracy < 0.3) {
            await this.notificationService.create(
                userId,
                'INTERVENTION',
                '📉 Difficulty Adjusted',
                'We\'ve noticed you\'re finding this challenging. Questions have been made easier to help you build confidence.',
                { trigger: 'DIFFICULTY_DROPPED', accuracy },
            );
            return 'DIFFICULTY_DROPPED';
        }

        // Action 3: Gamified Motivation Boost (Low Activity/Hesitation but not fatigued)
        if (consistency < 0.3 && fatigueIndex <= 1.5) {
            await this.notificationService.create(
                userId,
                'INTERVENTION',
                '⚡ Challenge Unlocked!',
                'You\'re losing focus — try a quick challenge to get back in the zone and earn bonus XP!',
                { trigger: 'GAMIFIED_CHALLENGE' },
            );
            return 'GAMIFIED_CHALLENGE';
        }

        return 'NONE_NEEDED';
    }
}
