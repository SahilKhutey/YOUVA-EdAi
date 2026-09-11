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

      // 2. Standard 4-Parameter Bayesian Knowledge Tracing (Corbett & Anderson, 1995)
      // Step A: Posterior Update P(L_t | Observation)
      let pObsGivenL: number;
      let pObsGivenNotL: number;

      if (isCorrect) {
        pObsGivenL = 1.0 - this.P_SLIP; // P(Obs=1 | L=1)
        pObsGivenNotL = this.P_GUESS;   // P(Obs=1 | L=0)
      } else {
        pObsGivenL = this.P_SLIP;       // P(Obs=0 | L=1)
        pObsGivenNotL = 1.0 - this.P_GUESS; // P(Obs=0 | L=0)
      }

      const numerator = pLnMinus1 * pObsGivenL;
      const denominator = numerator + (1.0 - pLnMinus1) * pObsGivenNotL;
      const posterior = denominator === 0 ? pLnMinus1 : numerator / denominator;

      // Step B: Learning Transition for Next Opportunity P(L_{t+1})
      let pLn = posterior + (1.0 - posterior) * this.P_LEARN;

      // Clamp values between 0.001 and 0.999
      pLn = Math.max(0.001, Math.min(0.999, pLn));

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
