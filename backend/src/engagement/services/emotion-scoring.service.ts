import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InterventionService } from './intervention.service';

@Injectable()
export class EmotionScoringService {
    constructor(
        private prisma: PrismaService,
        private interventionService: InterventionService,
    ) { }

    async processTelemetry(
        userId: string,
        topicId: string,
        telemetry: {
            cpm: number;
            errorSpike: number;
            hesitationGapMs: number;
            sessionDurationMs: number;
        }
    ) {
        // 1. Normalize Activity (0.0 to 1.0)
        // Assume 300 CPM is max normal typing speed.
        const normalizedActivity = Math.min(telemetry.cpm / 300, 1.0);

        // 2. Normalize Accuracy (0.0 to 1.0)
        // 0 error spike means 1.0 accuracy. Every error spike reduces accuracy by 0.2.
        const normalizedAccuracy = Math.max(1.0 - (telemetry.errorSpike * 0.2), 0.0);

        // 3. Normalize Time Consistency (0.0 to 1.0)
        // Assume 60 seconds (60000ms) gap is full hesitation (0.0 consistency).
        const normalizedConsistency = Math.max(1.0 - (telemetry.hesitationGapMs / 60000), 0.0);

        // 4. Calculate Fatigue Index (1.0 to 3.0 scale)
        // Fatigue starts at 1.0 and increases linearly up to 3.0 at 60 minutes duration.
        const maxFatigueDurationMs = 60 * 60 * 1000;
        const rawFatigue = 1.0 + (2.0 * (Math.min(telemetry.sessionDurationMs, maxFatigueDurationMs) / maxFatigueDurationMs));

        // Core Formula Executer
        const engagementScore = ((normalizedActivity + normalizedAccuracy + normalizedConsistency) / rawFatigue) / 3.0; // Normalized 0.0 -> 1.0 range based on 3 inputs

        let interventionTriggered = null;

        // Trigger Interventions if Engagement is Critically Low (< 40%)
        if (engagementScore < 0.4) {
            interventionTriggered = await this.interventionService.evaluateIntervention(
                userId,
                topicId,
                engagementScore,
                rawFatigue,
                normalizedAccuracy,
                normalizedConsistency
            );
        }

        // Persist Log
        await this.prisma.engagementLog.create({
            data: {
                userId,
                topicId,
                activityRate: normalizedActivity,
                accuracyScore: normalizedAccuracy,
                timeConsistency: normalizedConsistency,
                fatigueIndex: rawFatigue,
                finalEngagementScore: engagementScore,
                interventionTriggered
            }
        });

        return { engagementScore, interventionTriggered };
    }
}
