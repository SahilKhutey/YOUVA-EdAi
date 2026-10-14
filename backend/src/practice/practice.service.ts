import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

const QUESTIONS_PER_QUIZ = 5;
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { GamificationService } from '../gamification/gamification.service';
import { BktService } from '../learning-engine/services/bkt.service';
import { RlDifficultyService } from '../learning-engine/services/rl-difficulty.service';
import { ConsentService } from '../consent/consent.service';

@Injectable()
export class PracticeService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private gamificationService: GamificationService,
    private bktService: BktService,
    private rlDifficultyService: RlDifficultyService,
    private consentService: ConsentService,
  ) { }

  /**
   * Serves a quiz. Default source is the teacher-reviewed item bank (QUESTION_SOURCE=BANK).
   * Runtime AI generation is opt-in (QUESTION_SOURCE=AI) and never falls back to fake questions.
   */
  async generateQuiz(userId: string, topicId: string, role?: string) {
    // Students need an active parent/guardian consent record; teachers/admins previewing do not.
    if (role !== 'TEACHER' && role !== 'ADMIN') await this.consentService.assertActiveConsent(userId);
    const topic = await this.prisma.topic.findUnique({ where: { id: topicId } });
    if (!topic) throw new NotFoundException('Topic not found');

    const targetDifficulty = await this.rlDifficultyService.getOptimalDifficulty(userId, topicId);
    const source = (process.env.QUESTION_SOURCE || 'BANK').toUpperCase();

    let served: { id: string; content: string; options: string | null }[];

    if (source === 'AI') {
      let questionsData: any[];
      try {
        let level = 'medium';
        if (targetDifficulty <= 0.3) level = 'easy';
        else if (targetDifficulty >= 0.7) level = 'hard';
        questionsData = await this.aiService.generateQuiz(
          topic.title,
          `${topic.description || ''}. Please generate questions at a ${level} difficulty level.`,
        );
      } catch (e) {
        throw new ServiceUnavailableException('Quiz generation is unavailable right now. Please try again later.');
      }
      served = [];
      for (const q of questionsData) {
        const created = await this.prisma.question.create({
          data: {
            topicId,
            content: q.content,
            type: 'MCQ',
            difficulty: Number(targetDifficulty),
            options: JSON.stringify(q.options),
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            source: 'AI',
          },
        });
        served.push({ id: created.id, content: created.content, options: created.options });
      }
    } else {
      const bank = await this.prisma.question.findMany({ where: { topicId, source: 'BANK' } });
      if (bank.length === 0) {
        throw new NotFoundException('No reviewed questions are available for this topic yet.');
      }
      const answered = await this.prisma.userAnswer.findMany({
        where: { session: { userId, topicId } },
        select: { questionId: true },
      });
      const seen = new Set(answered.map((a) => a.questionId));
      served = [...bank]
        .sort((a, b) => {
          const seenDiff = Number(seen.has(a.id)) - Number(seen.has(b.id)); // unseen first
          if (seenDiff !== 0) return seenDiff;
          const dist = Math.abs(a.difficulty - targetDifficulty) - Math.abs(b.difficulty - targetDifficulty);
          if (dist !== 0) return dist;
          return a.id.localeCompare(b.id);
        })
        .slice(0, QUESTIONS_PER_QUIZ)
        .map((q) => ({ id: q.id, content: q.content, options: q.options }));
    }

    const session = await this.prisma.practiceSession.create({
      data: { userId, topicId, servedQuestionIds: JSON.stringify(served.map((q) => q.id)) },
    });

    return {
      sessionId: session.id,
      questions: served.map((q) => ({
        id: q.id,
        content: q.content,
        options: q.options ? JSON.parse(q.options) : [],
      })),
    };
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
    const session = await this.prisma.practiceSession.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) throw new NotFoundException('Session not found');
    if (session.endTime) throw new ConflictException('This quiz was already submitted.');
    if (!Array.isArray(answers) || answers.length === 0) {
      throw new BadRequestException('At least one answer is required.');
    }
    if (!session.servedQuestionIds) {
      throw new BadRequestException('This session has no recorded questions.');
    }
    const served: string[] = JSON.parse(session.servedQuestionIds);
    const seen = new Set<string>();
    for (const ans of answers) {
      if (!served.includes(ans.questionId)) {
        throw new BadRequestException('Answer references a question that was not part of this quiz.');
      }
      if (seen.has(ans.questionId)) {
        throw new BadRequestException('Duplicate answer for the same question.');
      }
      seen.add(ans.questionId);
    }

    let correctCount = 0;
    const results = [];

    for (const ans of answers) {
      const question = await this.prisma.question.findUnique({ where: { id: ans.questionId } });
      if (!question) continue;

      const isCorrect = question.correctAnswer === ans.answer;
      if (isCorrect) correctCount++;

      await this.prisma.userAnswer.create({
        data: { sessionId, questionId: ans.questionId, answer: ans.answer, isCorrect },
      });

      results.push({
        questionId: question.id,
        isCorrect,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      });

      await this.bktService.updateMastery(userId, session.topicId, isCorrect);
      await this.rlDifficultyService.updateDifficultyState(userId, session.topicId, isCorrect, question.difficulty);
    }

    // Unanswered questions count as incorrect: score is out of everything that was served.
    const score = (correctCount / served.length) * 100;
    const xpEarned = Number(10 + Math.round((score / 100) * 10));
    await this.prisma.practiceSession.update({
      where: { id: sessionId },
      data: { score, endTime: new Date(), isCompleted: true, xpEarned },
    });

    await this.gamificationService.addXp(userId, xpEarned);
    await this.gamificationService.updateStreak(userId);

    return {
      score,
      correctCount,
      total: served.length,
      unanswered: served.length - answers.length,
      results,
      xpEarned,
    };
  }
}
