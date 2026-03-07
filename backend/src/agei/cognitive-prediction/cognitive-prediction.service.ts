import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Predicts cognitive states like forgetting curves, optimal review intervals,
 * and burnout risk based on historical data.
 */
@Injectable()
export class CognitivePredictionService {
    constructor(private prisma: PrismaService) { }

    /**
     * Calculates the probability of recall for a specific topic based on the Ebbinghaus Forgetting Curve:
     * R = e^(-t/S)
     * where:
     * R = retrievability (probability of recall)
     * S = stability of memory (influenced by CognitiveProfile's memoryRetentionRate)
     * t = time since last review (in days)
     */
    async getForgettingProbability(userId: string, topicId: string): Promise<number> {
        const masteryRecord = await this.prisma.userTopicMastery.findUnique({
            where: { userId_topicId: { userId, topicId } },
            include: { user: { include: { cognitiveProfile: true } } },
        });

        if (!masteryRecord || !masteryRecord.lastReviewed) {
            return 1.0; // High probability of forgetting if never reviewed or new
        }

        const t_ms = Date.now() - masteryRecord.lastReviewed.getTime();
        const t_days = t_ms / (1000 * 60 * 60 * 24);

        // Baseline stability derived from BKT mastery and their innate retention rate
        const s_base = masteryRecord.user.cognitiveProfile?.memoryRetentionRate || 0.8;

        // The higher the mastery, the slower the decay (greater stability). 
        // S scales with mastery (e.g. 0.1 mastery decays fast, 0.9 decays slow)
        const S = s_base * (1 + masteryRecord.masteryProbability * 5);

        const R = Math.exp(-t_days / S);

        // We return the probability of FORGETTING, which is 1 - R
        return 1 - R;
    }

    /**
     * If forgetting probability > threshold, returns true.
     * Useful for the master controller to inject "Spaced Repetition" tasks into the curriculum.
     */
    async needsReview(userId: string, topicId: string, threshold: number = 0.4): Promise<boolean> {
        const forgetProb = await this.getForgettingProbability(userId, topicId);
        return forgetProb > threshold;
    }
}
