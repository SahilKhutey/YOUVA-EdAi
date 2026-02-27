import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RlDifficultyService {
  private readonly logger = new Logger(RlDifficultyService.name);

  // RL Parameters
  private readonly LEARNING_RATE = 0.1; // Alpha: how heavily we weigh new results
  private readonly REWARD_CORRECT = 1.0;
  private readonly REWARD_INCORRECT = -1.0;

  constructor(private prisma: PrismaService) {}

  /**
   * Adjusts the difficulty state for a specific user and topic using RL principles.
   *
   * @param userId The User ID
   * @param topicId The Topic ID
   * @param isCorrect Whether the answer was correct
   * @param currentQuestionDifficulty The difficulty of the question just answered
   * @returns The newly calculated Target Difficulty [0.0 - 1.0]
   */
  async updateDifficultyState(
    userId: string,
    topicId: string,
    isCorrect: boolean,
    currentQuestionDifficulty: number,
  ): Promise<number> {
    try {
      let masteryRecord = await this.prisma.userTopicMastery.findUnique({
        where: { userId_topicId: { userId, topicId } },
      });

      if (!masteryRecord) {
        masteryRecord = await this.prisma.userTopicMastery.create({
          data: {
            userId,
            topicId,
            masteryProbability: 0.1,
            difficultyState: 0.5,
          },
        });
      }

      const currentState = masteryRecord.difficultyState;

      // Calculate Reward
      // If they got a hard question right, big positive reward.
      // If they got an easy question wrong, big negative reward.
      let reward = 0;
      if (isCorrect) {
        // Getting a 0.9 difficulty right is better than getting a 0.1 right
        reward = this.REWARD_CORRECT * (1 + currentQuestionDifficulty);
      } else {
        // Getting a 0.1 difficulty wrong is worse than getting a 0.9 wrong (it was an easy question)
        reward = this.REWARD_INCORRECT * (1 + (1 - currentQuestionDifficulty));
      }

      // Update State: State = State + Alpha * (Reward)
      // We divide reward by a constant to scale the jump so difficulty doesn't swing too wildly
      let nextState = currentState + this.LEARNING_RATE * (reward / 2);

      // Clamp difficulty between 0.1 (easiest) and 1.0 (hardest)
      nextState = Math.max(0.1, Math.min(1.0, nextState));

      // Persist new state
      await this.prisma.userTopicMastery.update({
        where: { id: masteryRecord.id },
        data: {
          difficultyState: nextState,
        },
      });

      this.logger.debug(
        `Updated RL Difficulty State for User ${userId}, Topic ${topicId}: ${currentState.toFixed(3)} -> ${nextState.toFixed(3)} (Correct: ${isCorrect}, Q-Diff: ${currentQuestionDifficulty})`,
      );

      return nextState;
    } catch (error) {
      this.logger.error(
        `Failed to update difficulty for user ${userId}, topic ${topicId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Predicts and retrieves the optimal difficulty layer for the next question.
   */
  async getOptimalDifficulty(userId: string, topicId: string): Promise<number> {
    const record = await this.prisma.userTopicMastery.findUnique({
      where: { userId_topicId: { userId, topicId } },
    });

    // Default to medium (0.5) if no prior data
    return record ? record.difficultyState : 0.5;
  }
}
