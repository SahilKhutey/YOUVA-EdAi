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
    // 1. Fetch all mastery records
    const records = await this.prisma.userTopicMastery.findMany({
      where: { userId },
      include: { topic: true },
    });

    const now = new Date();
    const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));

    // 2. Score and Sort
    // Priority Score = (100 - Mastery) + (DaysSinceReview * 2)
    const suggestions = records.map((record) => {
      const daysSinceReview = record.lastReviewed
        ? Math.floor(
          (new Date().getTime() - new Date(record.lastReviewed).getTime()) /
          (1000 * 60 * 60 * 24),
        )
        : 30; // Treat never reviewed as very old

      let score = 100 - (record.masteryProbability * 100) + daysSinceReview * 5;

      // Boost completely unmastered topics
      if ((record.masteryProbability * 100) < 50) score += 50;

      return {
        ...record,
        priorityScore: score,
      };
    });

    // 3. Return top 5
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
    // 1. Get top weak topics
    const suggestions = await this.getRevisionSuggestions(userId);
    if (suggestions.length === 0) {
      // Fallback: Pick random topics if no mastery records exist
      // For now, return empty or throw
      // implementation for fallback omitted for brevity
    }

    const topicIds = suggestions.map((s) => s.topicId);

    // 2. Create a "Mixed" Session (using PracticeSession model for now, maybe with a special flag/note)
    // We'll link it to the first topic for schema compliance, or we might need a nullable topicId in DB.
    // Assuming topicId is required in current schema, we pick the first one as "primary".
    const primaryTopicId = topicIds[0];

    const session = await this.prisma.practiceSession.create({
      data: {
        userId,
        topicId: primaryTopicId,
        // In a real app, we'd add a 'type': 'REVISION' field to PracticeSession
      },
    });

    // 3. Generate Mixed Questions
    // Fetch details for context
    const topics = await this.prisma.topic.findMany({
      where: { id: { in: topicIds } },
    });

    const topicsContext = topics.map((t) => `"${t.title}"`).join(', ');

    const prompt = `Generate 6 multiple-choice questions for a revision session covering these topics: ${topicsContext}. 
    Distribute the questions among the topics.
    Format the output as a strictly valid JSON array of objects. 
    Each object must have: "content" (string), "options" (array of 4 strings), "correctAnswer" (string), "explanation" (string).
    Do not include any markdown formatting.`;

    let questionsData = [];
    try {
      const aiResponse = await this.aiService.generateText(prompt);
      const cleanedResponse = aiResponse
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      questionsData = JSON.parse(cleanedResponse);
    } catch (e) {
      console.error('AI Gen failed', e);
      // Fallback
      questionsData = [
        {
          content: 'Review Question 1 (Mock)',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 'A',
          explanation: 'Mock explanation.',
        },
      ];
    }

    // 4. Save Questions
    // Note: Question schema requires topicId. We will assign each question to the primary topic for now,
    // or arguably to its actual topic if we could parse that.
    // Simplicity: Assign to primaryTopicId.
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
}
