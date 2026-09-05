import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class LearningService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private gamificationService: GamificationService,
  ) {}

  async startSession(userId: string, topicId: string) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
    });
    if (!topic) throw new NotFoundException('Topic not found');

    const session = await this.prisma.learningSession.create({
      data: {
        userId,
        topicId,
        logs: JSON.stringify([]), // Initialize empty logs
      },
    });

    const initialPrompt = `You are an expert tutor teaching the topic "${topic.title}". The student is starting a new learning session. Introduce the topic briefy and ask the student what they would like to know first. Keep it encouraging and concise.`;
    const aiResponse = await this.aiService.generateText(initialPrompt);

    await this.logInteraction(session.id, 'AI', aiResponse);

    return { sessionId: session.id, message: aiResponse };
  }

  async chat(sessionId: string, userId: string, message: string) {
    const session = await this.prisma.learningSession.findUnique({
      where: { id: sessionId },
      include: { topic: true },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundException('Session not found or unauthorized');
    }

    // Log user message
    await this.logInteraction(sessionId, 'USER', message);

    // Context building (naïve approach: last few messages + topic context)
    let context = `Topic: ${session.topic.title}. Description: ${session.topic.description}.\n`;
    const logs = session.logs ? JSON.parse(session.logs as string) : [];
    const recentLogs = logs.slice(-5); // Last 5 exchanges
    recentLogs.forEach((log: any) => {
      context += `${log.role}: ${log.content}\n`;
    });

    // Generate AI response using Socratic Tutor mode
    const aiResponse = await this.aiService.chatWithTutor(context, message);

    // Log AI response
    await this.logInteraction(sessionId, 'AI', aiResponse);

    return { message: aiResponse };
  }

  async getHistory(userId: string) {
    const sessions = await this.prisma.learningSession.findMany({
      where: { userId },
      include: {
        topic: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: { startTime: 'desc' },
      take: 20,
    });

    return sessions.map((session) => ({
      id: session.id,
      topic: session.topic.title,
      subject: session.topic.subject.name,
      date: session.startTime,
      duration: session.endTime
        ? Math.round(
            (new Date(session.endTime).getTime() -
              new Date(session.startTime).getTime()) /
              60000,
          ) + ' min'
        : 'Ongoing',
      progress: 100, // Placeholder, logic can be added later
    }));
  }

  private async logInteraction(
    sessionId: string,
    role: 'USER' | 'AI',
    content: string,
  ) {
    const session = await this.prisma.learningSession.findUnique({
      where: { id: sessionId },
    });
    let logs = session?.logs ? JSON.parse(session.logs as string) : [];
    logs.push({ role, content, timestamp: new Date() });

    await this.prisma.learningSession.update({
      where: { id: sessionId },
      data: { logs: JSON.stringify(logs) },
    });
  }

  async endSession(sessionId: string, userId: string) {
    const session = await this.prisma.learningSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundException('Session not found');
    }

    if (session.endTime) {
      return { message: 'Session already ended' };
    }

    const endTime = new Date();
    await this.prisma.learningSession.update({
      where: { id: sessionId },
      data: { endTime },
    });

    // Calculate duration in minutes
    const startTime = new Date(session.startTime);
    const durationMinutes = Math.round(
      (endTime.getTime() - startTime.getTime()) / 60000,
    );

    // Gamification: Base 5 XP + 2 XP per minute spent (max 60 XP total for a session to prevent afk farming)
    const xpEarned = Math.min(60, 5 + durationMinutes * 2);

    await this.gamificationService.addXp(userId, xpEarned);
    await this.gamificationService.updateStreak(userId);

    return { message: 'Session ended successfully', durationMinutes, xpEarned };
  }

  // --- Phase P2: Student Operational Learning Loop Methods ---

  async getToday(userId: string) {
    const [user, goals, assignments, masteries] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, include: { stats: true } }),
      this.prisma.studyGoal.findMany({ where: { userId, status: 'IN_PROGRESS' }, take: 3 }),
      this.prisma.contentAssignment.findMany({
        where: { studentId: userId, status: { in: ['ASSIGNED', 'IN_PROGRESS'] } },
        include: { content: true },
        take: 5,
      }),
      this.prisma.userTopicMastery.findMany({
        where: { userId },
        include: { topic: { include: { subject: true } } },
        orderBy: { masteryProbability: 'asc' },
        take: 1,
      }),
    ]);

    const targetTopic = masteries[0]?.topic;

    return {
      student: {
        id: user?.id,
        name: user?.name,
        streak: user?.stats?.streakDays || 0,
        xp: user?.stats?.totalXp || 0,
      },
      goals: goals.map((g) => ({ id: g.id, title: g.title, targetScore: g.targetScore })),
      assignments: assignments.map((a) => ({
        id: a.id,
        title: a.content.learningObjective,
        type: a.content.type,
        dueDate: a.dueDate,
        status: a.status,
      })),
      recommendedFocus: targetTopic
        ? {
            topicId: targetTopic.id,
            topicTitle: targetTopic.title,
            subjectName: targetTopic.subject.name,
            currentMastery: masteries[0].masteryProbability,
          }
        : null,
    };
  }

  async getSessions(userId: string) {
    return this.prisma.learningSession.findMany({
      where: { userId },
      include: { topic: { include: { subject: true } } },
      orderBy: { startTime: 'desc' },
      take: 25,
    });
  }

  async getSession(userId: string, sessionId: string) {
    const session = await this.prisma.learningSession.findUnique({
      where: { id: sessionId },
      include: { topic: true },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundException('Session not found or unauthorized');
    }

    return session;
  }

  async getRecommendations(userId: string) {
    return this.prisma.personalizationDecision.findMany({
      where: { userId },
      include: { topic: { include: { subject: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  async getMastery(userId: string) {
    return this.prisma.userTopicMastery.findMany({
      where: { userId },
      include: { topic: { include: { subject: true } } },
      orderBy: { masteryProbability: 'desc' },
    });
  }
}
