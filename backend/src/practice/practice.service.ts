import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { GamificationService } from '../gamification/gamification.service';
import { BktService } from '../learning-engine/services/bkt.service';
import { RlDifficultyService } from '../learning-engine/services/rl-difficulty.service';

@Injectable()
export class PracticeService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private gamificationService: GamificationService,
    private bktService: BktService,
    private rlDifficultyService: RlDifficultyService,
  ) { }

  async generateQuiz(userId: string, topicId: string) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
    });
    if (!topic) throw new NotFoundException('Topic not found');

    // Create session
    const session = await this.prisma.practiceSession.create({
      data: {
        userId,
        topicId,
      },
    });

    // Determine target difficulty using RL
    const targetDifficulty =
      await this.rlDifficultyService.getOptimalDifficulty(userId, topicId);
    let difficultyString = 'medium';
    if (targetDifficulty <= 0.3) difficultyString = 'easy';
    else if (targetDifficulty >= 0.7) difficultyString = 'hard';

    // 1. Check if verified questions already exist for this topic
    const existingQuestions = await this.prisma.question.findMany({
      where: { topicId },
    });

    if (existingQuestions.length > 0) {
      // Sort candidates by proximity to target difficulty (Zone of Proximal Development)
      const sorted = existingQuestions.sort(
        (a, b) =>
          Math.abs(a.difficulty - targetDifficulty) -
          Math.abs(b.difficulty - targetDifficulty),
      );
      const selected = sorted.slice(0, Math.min(5, sorted.length));
      return {
        sessionId: session.id,
        questions: selected.map((q) => ({
          id: q.id,
          content: q.content,
          options: q.options ? JSON.parse(q.options) : [],
        })),
      };
    }

    // 2. Fallback to AI generation only if no verified questions exist
    let questionsData = [];
    try {
      questionsData = await this.aiService.generateQuiz(
        topic.title,
        `${topic.description || ''}. Please generate questions at a ${difficultyString} difficulty level.`,
      );
    } catch (e) {
      console.error(
        'Failed to generate quiz via AI, falling back to mock data:',
        e,
      );
      // Fallback to mock questions for testing/dev without API key
      questionsData = [
        {
          content: 'Solve for x: 2x - 3 = 7',
          options: ['x = 2', 'x = 5', 'x = 4', 'x = 10'],
          correctAnswer: 'x = 5',
          explanation: 'Add 3 to both sides: 2x = 10. Divide by 2: x = 5.',
        },
        {
          content: 'Solve for y: y + 3 = 10',
          options: ['y = 7', 'y = 13', 'y = 3', 'y = 30'],
          correctAnswer: 'y = 7',
          explanation: 'Subtract 3 from both sides: y = 10 - 3 = 7.',
        },
      ];
    }

    // Save generated fallback questions to DB
    const questions = [];
    for (const q of questionsData) {
      const question = await this.prisma.question.create({
        data: {
          topicId,
          content: q.content,
          type: 'MCQ',
          difficulty: Number(targetDifficulty), // Prisma Float is JS Number
          options: JSON.stringify(q.options),
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        },
      });
      questions.push({
        id: question.id,
        content: question.content,
        options: question.options ? JSON.parse(question.options) : [], // Handle null options
      });
    }

    return { sessionId: session.id, questions };
  }

  async getTests(userId: string) {
    // Return available topics as "Tests"
    // Check if user has completed them recently
    const topics = await this.prisma.topic.findMany({
      include: {
        subject: true,
        practiceSessions: {
          where: { userId },
          orderBy: { startTime: 'desc' },
          take: 1,
        },
        questions: {
          select: { id: true }, // Count questions
        },
      },
    });

    return topics.map((topic) => {
      const lastSession = topic.practiceSessions[0];
      const isCompleted = !!lastSession && !!lastSession.endTime;
      return {
        id: topic.id, // Use topicId as test ID for simplicity in navigation
        topicId: topic.id,
        title: `${topic.title} Practice`,
        subject: topic.subject.name,
        duration: '15 min', // Estimate
        questions: topic.questions.length || 5, // Fallback if no pre-generated questions
        difficulty: 'Medium', // Default
        status: isCompleted ? 'Completed' : 'Available',
        score: lastSession?.score,
      };
    });
  }

  async submitQuiz(
    sessionId: string,
    userId: string,
    answers: { questionId: string; answer: string }[],
  ) {
    const session = await this.prisma.practiceSession.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.userId !== userId)
      throw new NotFoundException('Session not found');

    let correctCount = 0;
    const results = [];

    for (const ans of answers) {
      const question = await this.prisma.question.findUnique({
        where: { id: ans.questionId },
      });
      if (!question) continue;

      const isCorrect = question.correctAnswer === ans.answer;
      if (isCorrect) correctCount++;

      await this.prisma.userAnswer.create({
        data: {
          sessionId,
          questionId: ans.questionId,
          answer: ans.answer,
          isCorrect,
        },
      });

      results.push({
        questionId: question.id,
        isCorrect,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      });

      // Real-time ACLE Updates per question
      await this.bktService.updateMastery(userId, session.topicId, isCorrect);
      await this.rlDifficultyService.updateDifficultyState(
        userId,
        session.topicId,
        isCorrect,
        question.difficulty,
      );
    }

    const score = (correctCount / answers.length) * 100;
    await this.prisma.practiceSession.update({
      where: { id: sessionId },
      data: { score, endTime: new Date() },
    });

    // Gamification: Award 10 XP base + up to 10 XP based on score, and update streak
    const xpEarned = Number(10 + Math.round((score / 100) * 10));
    await this.gamificationService.addXp(userId, xpEarned);
    await this.gamificationService.updateStreak(userId);

    return { score, correctCount, total: answers.length, results, xpEarned };
  }
}
