import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrchestratorService } from '../content-intelligence/services/orchestrator.service';
import { AiService } from '../ai/ai.service';

interface MonthlyActivity {
  [key: string]: { learning: number; practice: number };
}

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private orchestratorService: OrchestratorService,
    private aiService: AiService,
  ) { }

  async getSummary(userId: string) {
    // 1. Monthly Activity (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const learningSessions = await this.prisma.learningSession.findMany({
      where: {
        userId,
        startTime: { gte: sixMonthsAgo },
      },
      select: { startTime: true },
    });

    const practiceSessions = await this.prisma.practiceSession.findMany({
      where: {
        userId,
        startTime: { gte: sixMonthsAgo },
      },
      select: { startTime: true },
    });

    // Group by month
    const monthlyActivity: MonthlyActivity = {};
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = d.toLocaleString('default', { month: 'short' });
      months.push(monthKey);
      monthlyActivity[monthKey] = { learning: 0, practice: 0 };
    }

    learningSessions.forEach((s) => {
      const month = new Date(s.startTime).toLocaleString('default', {
        month: 'short',
      });
      if (monthlyActivity[month]) monthlyActivity[month].learning++;
    });

    practiceSessions.forEach((s) => {
      const month = new Date(s.startTime).toLocaleString('default', {
        month: 'short',
      });
      if (monthlyActivity[month]) monthlyActivity[month].practice++;
    });

    const activityData = months.map((month) => ({
      name: month,
      learning: monthlyActivity[month].learning,
      practice: monthlyActivity[month].practice,
    }));

    // 2. Mastery Distribution
    const subjects = await this.prisma.subject.findMany({
      include: { topics: true },
    });

    const masteryRecords = await this.prisma.userTopicMastery.findMany({
      where: { userId },
    });

    const masteryData = subjects.map((subject) => {
      const topicIds = subject.topics.map((t) => t.id);
      const subjectMastery = masteryRecords.filter((r) =>
        topicIds.includes(r.topicId),
      );
      const totalScore = subjectMastery.reduce(
        (sum, r) => sum + (r.masteryProbability * 100),
        0,
      );
      // Average over total topics to reflect true mastery of the subject
      const avgScore =
        subject.topics.length > 0 ? totalScore / subject.topics.length : 0;

      return {
        subject: subject.name,
        score: Math.round(avgScore),
        fullMark: 100,
      };
    });

    return {
      activityData,
      masteryData,
    };
  }

  async getDashboardStats(userId: string) {
    // 1. Completion Percentage (based on mastery of all topics)
    const allTopicsCount = await this.prisma.topic.count();
    const masteredTopicsCount = await this.prisma.userTopicMastery.count({
      where: { userId, masteryProbability: { gte: 0.8 } },
    });

    const completionPercentage =
      allTopicsCount > 0
        ? Math.round((masteredTopicsCount / allTopicsCount) * 100)
        : 0;

    // 2. Weekly Study Hours (Current week)
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);

    const weeklyLearning = await this.prisma.learningSession.findMany({
      where: { userId, startTime: { gte: startOfWeek } },
      select: { startTime: true, endTime: true },
    });

    const weeklyPractice = await this.prisma.practiceSession.findMany({
      where: { userId, startTime: { gte: startOfWeek } },
      select: { startTime: true, endTime: true },
    });

    const calculateDuration = (
      sessions: { startTime: Date; endTime: Date | null }[],
    ) => {
      return sessions.reduce((total, session) => {
        if (session.endTime) {
          const diff = session.endTime.getTime() - session.startTime.getTime();
          return total + diff / (1000 * 60); // minutes
        }
        return total;
      }, 0);
    };

    const totalMinutes =
      calculateDuration(weeklyLearning) + calculateDuration(weeklyPractice);

    const weeklyStudyHours = Math.round((totalMinutes / 60) * 10) / 10;

    // 3. AI Confidence Score (Mocked or sophisticated alg)
    // Simple mock: Average mastery score across all attempted topics
    const avgMastery = await this.prisma.userTopicMastery.aggregate({
      where: { userId },
      _avg: { masteryProbability: true },
    });
    const aiConfidenceScore = Math.round((avgMastery._avg?.masteryProbability || 0) * 100);

    return {
      completionPercentage,
      weeklyStudyHours,
      aiConfidenceScore,
    };
  }

  async getWeakTopics(userId: string) {
    // Topics with mastery < 0.6 (60%)
    const weakMastery = await this.prisma.userTopicMastery.findMany({
      where: { userId, masteryProbability: { lt: 0.6 } },
      include: { topic: { include: { subject: true } } },
      take: 5,
      orderBy: { masteryProbability: 'asc' },
    });

    return weakMastery.map((r) => ({
      topic: r.topic.title,
      subject: r.topic.subject.name,
      score: Math.round(r.masteryProbability * 100),
    }));
  }

  async getUpcomingTests(userId: string) {
    // Mocking for now as we might not have a Test schedule table
    return [
      {
        id: 1,
        subject: 'Physics',
        topic: 'Thermodynamics',
        date: '2026-02-14T14:00:00Z',
        type: 'Mid-Term',
      },
      {
        id: 2,
        subject: 'Math',
        topic: 'Integration',
        date: '2026-02-18T10:00:00Z',
        type: 'Quiz',
      },
    ];
  }

  async getRecommendations(userId: string) {
    const weakTopics = await this.getWeakTopics(userId);

    let queryTopic = 'General Study Tips';
    // If the user has a weak topic, focus the search on the absolute weakest one
    if (weakTopics.length > 0) {
      queryTopic =
        weakTopics[0].topic + ' ' + weakTopics[0].subject + ' tutorial';
    }

    try {
      // Fetch dynamic content recommendations based on the weakest topic
      // We pass the topic name as the query, and 'general' as topicId context
      const resources = await this.orchestratorService.searchContent(
        queryTopic,
        userId,
        'general',
      );

      // Map resources to expected shape, keeping it simple for the UI
      return resources.slice(0, 3).map((r, i) => ({
        id: `gen-${i}`,
        type: r.source === 'youtube' ? 'Watch' : 'Read',
        topic: r.title,
        reason: r.source === 'youtube' ? 'Video Lesson' : 'Web Article', // Using reasoning field as short source text
        url: r.url,
      }));
    } catch (e) {
      console.error('Failed to fetch dynamic recommendations', e);
      // Fallback if API fails (e.g., missing API key)
      return [
        {
          id: 'gen1',
          type: 'Practice',
          topic: 'Calculus',
          reason: 'Keep up the momentum!',
        },
        {
          id: 'gen2',
          type: 'Challenge',
          topic: 'Vectors',
          reason: 'Try a hard problem.',
        },
      ];
    }
  }

  async generateAIPerformanceReport(userId: string) {
    // 1. Gather User's gamification stats
    const stats = await this.prisma.userStats.findUnique({ where: { userId } });

    // 2. Gather User's Mastery Distribution
    const subjects = await this.prisma.subject.findMany({
      include: { topics: true },
    });
    const masteryRecords = await this.prisma.userTopicMastery.findMany({
      where: { userId },
      include: { topic: { include: { subject: true } } },
    });

    const subjectPerformance = subjects.map((sub) => {
      const topicIds = sub.topics.map((t) => t.id);
      const subMastery = masteryRecords.filter((r) =>
        topicIds.includes(r.topicId),
      );
      const totalScore = subMastery.reduce(
        (sum, curr) => sum + (curr.masteryProbability * 100),
        0,
      );
      return {
        subject: sub.name,
        avgScore:
          sub.topics.length > 0
            ? Math.round(totalScore / sub.topics.length)
            : 0,
      };
    });

    // 3. Gather Weakest and Strongest Topics specifically
    const sortedTopics = [...masteryRecords].sort(
      (a, b) => b.masteryProbability - a.masteryProbability,
    );
    const strongestTopics = sortedTopics
      .slice(0, 3)
      .map((r) => `${r.topic.title} (${Math.round(r.masteryProbability * 100)}%)`);
    const weakestTopics = sortedTopics
      .slice(-3)
      .reverse()
      .map((r) => `${r.topic.title} (${Math.round(r.masteryProbability * 100)}%)`);

    // 4. Construct AI System Prompt
    const prompt = `You are an expert, encouraging Academic Advisor for a student.
    
Based on the following data, write a comprehensive, highly personalized 3-part progress report for the student.
Make it engaging, insightful, and formatted strictly in GitHub Flavored Markdown. Do NOT use any greeting or sign-offs, just return the report content.

## Student Data:
- Current Level: ${stats?.currentLevel || 1}
- Total XP: ${stats?.totalXp || 0}
- Current Study Streak: ${stats?.currentStreak || 0} days (Best: ${stats?.bestStreak || 0} days)
- Subject Performance: ${JSON.stringify(subjectPerformance)}
- Strongest Topics: ${strongestTopics.join(', ') || 'Not enough data'}
- Weakest Topics: ${weakestTopics.join(', ') || 'Not enough data'}

## Report Requirements:
Create a markdown document with exactly these three sections (use H1 ## for them):
1. ## Executive Summary
A short, encouraging 2-paragraph summary of their current progress, acknowledging their streak and level.
2. ## Strengths & Weaknesses Analysis
Analyze where they are excelling and where they are falling behind based on the provided topic data.
3. ## Actionable Study Plan
Give them a concrete 3-step action plan to improve their weakest topics over the next 7 days.
    `;

    return this.aiService.generateText(prompt);
  }
}
