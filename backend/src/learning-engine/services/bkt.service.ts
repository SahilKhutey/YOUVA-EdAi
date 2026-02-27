import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BktService {
  private readonly logger = new Logger(BktService.name);

  // Default parameters for the simplified BKT model
  private readonly P_LEARN = 0.2; // Probability of transitioning to knowing state after a step
  private readonly P_SLIP = 0.1; // Probability of making a mistake even if mastered
  private readonly P_GUESS = 0.25; // Probability of guessing correctly (e.g. 4 option MCQ)

  constructor(private prisma: PrismaService) {}

  /**
   * Updates the mastery probability for a specific user and topic using a simplified
   * Bayesian Knowledge Tracing (BKT) approach.
   *
   * @param userId The User ID
   * @param topicId The Topic ID
   * @param isCorrect Whether the answer was correct
   * @returns The newly calculated mastery probability [0.0 - 1.0]
   */
  async updateMastery(
    userId: string,
    topicId: string,
    isCorrect: boolean,
  ): Promise<number> {
    try {
      // 1. Fetch current mastery state
      let masteryRecord = await this.prisma.userTopicMastery.findUnique({
        where: { userId_topicId: { userId, topicId } },
      });

      if (!masteryRecord) {
        // If no prior record, initialize with default low probability and default difficulty
        masteryRecord = await this.prisma.userTopicMastery.create({
          data: {
            userId,
            topicId,
            masteryProbability: 0.1,
            difficultyState: 0.5,
          },
        });
      }

      const pLnMinus1 = masteryRecord.masteryProbability;

      // 2. Bayesian Update Math (Simplified for MVP)
      // Standard BKT involves calculating P(Ln|Action) then P(Ln+1).
      // Here we use a heuristic based on Reinforcement principles combined with P(learn):
      // If correct: shift closer to 1.0
      // If incorrect: heavily penalize back towards 0.0

      let pLn: number;

      if (isCorrect) {
        // P(Ln) = P(Ln-1) + (1 - P(Ln-1)) * P(learn)
        pLn = pLnMinus1 + (1 - pLnMinus1) * this.P_LEARN;
      } else {
        // Penalty factor (slip/incorrect)
        // P(Ln) = P(Ln-1) - P(Ln-1) * (some penalty factor, e.g. 0.5 * P_LEARN)
        // We drop mastery faster than we gain it to ensure students really know it.
        pLn = pLnMinus1 - pLnMinus1 * (this.P_LEARN * 1.5);
      }

      // Clamp values between 0.01 and 0.99
      // (Never 100% sure they know, never 0% sure they don't know)
      pLn = Math.max(0.01, Math.min(0.99, pLn));

      // 3. Persist new mastery
      await this.prisma.userTopicMastery.update({
        where: { id: masteryRecord.id },
        data: {
          masteryProbability: pLn,
          lastReviewed: new Date(),
        },
      });

      this.logger.debug(
        `Updated BKT Mastery for User ${userId}, Topic ${topicId}: ${pLnMinus1.toFixed(3)} -> ${pLn.toFixed(3)} (Correct: ${isCorrect})`,
      );

      return pLn;
    } catch (error) {
      this.logger.error(
        `Failed to update mastery for user ${userId}, topic ${topicId}`,
        error,
      );
      throw error;
    }
  }
}
