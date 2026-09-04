import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class RevisionService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) { }

  async getRevisionSuggestions(userId: string) {
    const records = await this.prisma.userTopicMastery.findMany({
      where: { userId },
      include: { topic: true },
    });

    const suggestions = records.map((record) => {
      const daysSinceReview = record.lastReviewed
        ? Math.floor(
          (new Date().getTime() - new Date(record.lastReviewed).getTime()) /
          (1000 * 60 * 60 * 24),
        )
        : 30;

      let score = 100 - (record.masteryProbability * 100) + daysSinceReview * 5;
      if ((record.masteryProbability * 100) < 50) score += 50;

      return {
        ...record,
        priorityScore: score,
      };
    });

    return suggestions
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 5)
      .map((r) => ({
        topicId: r.topicId,
        masteryScore: Math.round(r.masteryProbability * 100),
        lastReviewed: r.lastReviewed,
        reason: (r.masteryProbability * 100) < 60 ? 'Low Mastery' : 'Time to Review',
      }));
  }

  async startRevisionSession(userId: string) {
    const suggestions = await this.getRevisionSuggestions(userId);
    if (suggestions.length === 0) return null;

    const topicIds = suggestions.map((s) => s.topicId);
    const primaryTopicId = topicIds[0];

    const session = await this.prisma.practiceSession.create({
      data: {
        userId,
        topicId: primaryTopicId,
      },
    });

    const topics = await this.prisma.topic.findMany({
      where: { id: { in: topicIds } },
    });

    const topicsContext = topics.map((t) => `"${t.title}"`).join(', ');
    const prompt = `Generate 6 multiple-choice questions for a revision session covering these topics: ${topicsContext}. 
    Format as strictly valid JSON array. Each object: "content" (string), "options" (array), "correctAnswer" (string), "explanation" (string).`;

    let questionsData = [];
    try {
      const aiResponse = await this.aiService.generateText(prompt);
      const cleanedResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      questionsData = JSON.parse(cleanedResponse);
    } catch (e) {
      console.error('AI Gen failed', e);
      questionsData = [{ content: 'Review Question 1', options: ['A', 'B', 'C', 'D'], correctAnswer: 'A', explanation: 'Mock.' }];
    }

    const questions = [];
    for (const q of questionsData) {
      const question = await this.prisma.question.create({
        data: {
          topicId: primaryTopicId,
          content: q.content,
          type: 'MCQ',
          difficulty: 0.5,
          options: JSON.stringify(q.options),
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        },
      });
      questions.push({
        id: question.id,
        content: question.content,
        options: JSON.parse(question.options || '[]'),
      });
    }

    return { sessionId: session.id, questions };
  }

  async getScheduledRevisions(userId: string) {
    const records = await this.prisma.userTopicMastery.findMany({
      where: { userId },
      include: { topic: { include: { subject: true } } },
    });

    const suggestions = records.map((record) => {
      // Use lastReviewed or now as fallback since updatedAt is missing
      const baseDate = record.lastReviewed ? new Date(record.lastReviewed) : new Date();
      const intervalDays = Math.max(1, Math.round(record.masteryProbability * 14));
      const scheduledDate = new Date(baseDate);
      scheduledDate.setDate(scheduledDate.getDate() + intervalDays);

      return {
        topicId: record.topicId,
        topicTitle: record.topic.title,
        subjectName: record.topic.subject.name,
        scheduledDate: scheduledDate.toISOString(),
        masteryLevel: Math.round(record.masteryProbability * 100),
      };
    });

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return suggestions.filter(s => new Date(s.scheduledDate) >= now);
  }
}
