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
}
