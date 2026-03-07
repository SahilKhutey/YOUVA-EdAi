import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrchestratorService } from '../content-intelligence/services/orchestrator.service';
import { AiService } from '../ai/ai.service';
import { CognitiveTwinService } from '../cognitive-twin/cognitive-twin.service';

interface MonthlyActivity {
  [key: string]: { learning: number; practice: number };
}

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private orchestratorService: OrchestratorService,
    private aiService: AiService,
    private cognitiveTwinService: CognitiveTwinService,
  ) { }

  async getSummary(userId: string) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [learningSessions, practiceSessions] = await Promise.all([
      this.prisma.learningSession.findMany({
        where: { userId, startTime: { gte: sixMonthsAgo } },
        select: { startTime: true },
      }),
      this.prisma.practiceSession.findMany({
        where: { userId, startTime: { gte: sixMonthsAgo } },
        select: { startTime: true },
      }),
    ]);

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
      const month = new Date(s.startTime).toLocaleString('default', { month: 'short' });
      if (monthlyActivity[month]) monthlyActivity[month].learning++;
    });

    practiceSessions.forEach((s) => {
      const month = new Date(s.startTime).toLocaleString('default', { month: 'short' });
      if (monthlyActivity[month]) monthlyActivity[month].practice++;
    });

    const activityData = months.map((month) => ({
      name: month,
      learning: monthlyActivity[month].learning,
      practice: monthlyActivity[month].practice,
    }));

    const subjects = await this.prisma.subject.findMany({ include: { topics: true } });
    const masteryRecords = await this.prisma.userTopicMastery.findMany({ where: { userId } });

    const masteryData = subjects.map((subject) => {
      const topicIds = subject.topics.map((t) => t.id);
      const subjectMastery = masteryRecords.filter((r) => topicIds.includes(r.topicId));
      const totalScore = subjectMastery.reduce((sum, r) => sum + (r.masteryProbability * 100), 0);
      const avgScore = subject.topics.length > 0 ? totalScore / subject.topics.length : 0;
      return { subject: subject.name, score: Math.round(avgScore), fullMark: 100 };
    });

    return { activityData, masteryData };
  }

  async getDashboardStats(userId: string) {
    const allTopicsCount = await this.prisma.topic.count();
    const masteredTopicsCount = await this.prisma.userTopicMastery.count({
      where: { userId, masteryProbability: { gte: 0.8 } },
    });

    const completionPercentage = allTopicsCount > 0 ? Math.round((masteredTopicsCount / allTopicsCount) * 100) : 0;

    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);

    const [weeklyLearning, weeklyPractice] = await Promise.all([
      this.prisma.learningSession.findMany({
        where: { userId, startTime: { gte: startOfWeek } },
        select: { startTime: true, endTime: true },
      }),
      this.prisma.practiceSession.findMany({
        where: { userId, startTime: { gte: startOfWeek } },
        select: { startTime: true, endTime: true },
      }),
    ]);

    const calculateDuration = (sessions: { startTime: Date; endTime: Date | null }[]) => {
      return sessions.reduce((total, session) => {
        if (session.endTime) {
          return total + (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60);
        }
        return total;
      }, 0);
    };

    const totalMinutes = calculateDuration(weeklyLearning) + calculateDuration(weeklyPractice);
    const weeklyStudyHours = Math.round((totalMinutes / 60) * 10) / 10;

    const avgMastery = await this.prisma.userTopicMastery.aggregate({
      where: { userId },
      _avg: { masteryProbability: true },
    });
    const aiConfidenceScore = Math.round((avgMastery._avg?.masteryProbability || 0) * 100);

    return { completionPercentage, weeklyStudyHours, aiConfidenceScore };
  }

  async getWeakTopics(userId: string) {
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
    return [
      { id: 1, subject: 'Physics', topic: 'Thermodynamics', date: '2026-02-14T14:00:00Z', type: 'Mid-Term' },
      { id: 2, subject: 'Math', topic: 'Integration', date: '2026-02-18T10:00:00Z', type: 'Quiz' },
    ];
  }

  async getRecommendations(userId: string) {
    const weakTopics = await this.getWeakTopics(userId);
    let queryTopic = weakTopics.length > 0 ? `${weakTopics[0].topic} ${weakTopics[0].subject} tutorial` : 'General Study Tips';

    try {
      const resources = await this.orchestratorService.searchContent(queryTopic, userId, 'general');
      return resources.slice(0, 3).map((r, i) => ({
        id: `gen-${i}`,
        type: r.source === 'youtube' ? 'Watch' : 'Read',
        topic: r.title,
        reason: r.source === 'youtube' ? 'Video Lesson' : 'Web Article',
        url: r.url,
      }));
    } catch (e) {
      return [
        { id: 'gen1', type: 'Practice', topic: 'Calculus', reason: 'Keep up momentum' },
        { id: 'gen2', type: 'Challenge', topic: 'Vectors', reason: 'Try hard problems' },
      ];
    }
  }

  async generateAIPerformanceReport(userId: string) {
    const stats = await this.prisma.userStats.findUnique({ where: { userId } });
    const subjects = await this.prisma.subject.findMany({ include: { topics: true } });
    const masteryRecords = await this.prisma.userTopicMastery.findMany({
      where: { userId },
      include: { topic: true },
    });

    const subjectPerformance = subjects.map((sub) => {
      const topicIds = sub.topics.map((t) => t.id);
      const subMastery = masteryRecords.filter((r) => topicIds.includes(r.topicId));
      const totalScore = subMastery.reduce((sum, curr) => sum + (curr.masteryProbability * 100), 0);
      return { subject: sub.name, avgScore: sub.topics.length > 0 ? Math.round(totalScore / sub.topics.length) : 0 };
    });

    const sortedTopics = [...masteryRecords].sort((a, b) => b.masteryProbability - a.masteryProbability);
    const strongestTopics = sortedTopics.slice(0, 3).map((r) => `${r.topic.title} (${Math.round(r.masteryProbability * 100)}%)`);
    const weakestTopics = sortedTopics.slice(-3).reverse().map((r) => `${r.topic.title} (${Math.round(r.masteryProbability * 100)}%)`);

    const cognitiveProfile = await this.cognitiveTwinService.getProfile(userId);

    const prompt = `Report for Level ${stats?.currentLevel || 1}, XP ${stats?.totalXp || 0}, Streak ${stats?.currentStreak || 0}. 
    Subjects: ${JSON.stringify(subjectPerformance)}. Strongest: ${strongestTopics.join(', ')}. Weakest: ${weakestTopics.join(', ')}.
    Cognitive Twin Metrics: Learning Velocity: ${cognitiveProfile.learningVelocityIndex.toFixed(2)}, Retention Rate: ${(cognitiveProfile.memoryRetentionRate * 100).toFixed(0)}%, Focus Block: ${cognitiveProfile.attentionSpan} mins.
    Skill Genome: ${cognitiveProfile.skillGenome}.
    Create sections: ## Executive Summary, ## Strengths & Weaknesses Analysis, ## Cognitive Profile Insights, ## Actionable Study Plan.`;

    return this.aiService.generateText(prompt);
  }

  async getSubjectBreakdown(userId: string) {
    const sessions = await this.prisma.practiceSession.findMany({
      where: { userId, endTime: { not: null } },
      include: {
        topic: { include: { subject: true } },
        answers: true,
      },
      orderBy: { startTime: 'desc' },
    });

    const bktRows = await this.prisma.userTopicMastery.findMany({
      where: { userId },
      include: { topic: { include: { subject: true } } },
    });

    const masteryBySubject: Record<string, number[]> = {};
    for (const row of bktRows) {
      const sid = row.topic.subject.id;
      if (!masteryBySubject[sid]) masteryBySubject[sid] = [];
      masteryBySubject[sid].push(row.masteryProbability);
    }

    const subjectMap: Record<string, any> = {};
    for (const s of sessions) {
      const { id, name } = s.topic.subject;
      if (!subjectMap[id]) subjectMap[id] = { id, name, sessions: 0, correct: 0, total: 0, lastPracticed: null };
      subjectMap[id].sessions++;
      subjectMap[id].correct += s.answers.filter(a => a.isCorrect).length;
      subjectMap[id].total += s.answers.length;
      if (!subjectMap[id].lastPracticed || s.startTime > subjectMap[id].lastPracticed) subjectMap[id].lastPracticed = s.startTime;
    }

    return Object.values(subjectMap).map((sub) => ({
      ...sub,
      accuracy: sub.total > 0 ? Math.round((sub.correct / sub.total) * 100) : 0,
      avgMastery: masteryBySubject[sub.id]?.length ? Math.round((masteryBySubject[sub.id].reduce((a, b) => a + b, 0) / masteryBySubject[sub.id].length) * 100) : 0,
      lastPracticed: sub.lastPracticed?.toISOString() ?? null,
    }));
  }

  async getRecentSessions(userId: string) {
    const sessions = await this.prisma.practiceSession.findMany({
      where: { userId, endTime: { not: null } },
      orderBy: { startTime: 'desc' },
      take: 20,
      include: {
        topic: { include: { subject: true } },
        answers: true,
      },
    });

    return sessions.map((s) => {
      const correct = s.answers.filter(a => a.isCorrect).length;
      const total = s.answers.length;
      const durationSeconds = s.endTime ? (s.endTime.getTime() - s.startTime.getTime()) / 1000 : 0;
      return {
        id: s.id,
        topicTitle: s.topic.title,
        subjectName: s.topic.subject.name,
        score: s.score ?? 0,
        accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
        durationMinutes: Math.round(durationSeconds / 60),
        date: s.startTime,
      };
    });
  }

  async getActivityHeatmap(userId: string) {
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);

    const [learning, practice] = await Promise.all([
      this.prisma.learningSession.findMany({ where: { userId, startTime: { gte: oneYearAgo } }, select: { startTime: true } }),
      this.prisma.practiceSession.findMany({ where: { userId, startTime: { gte: oneYearAgo } }, select: { startTime: true } }),
    ]);

    const activityMap: Record<string, number> = {};
    [...learning, ...practice].forEach((s) => {
      const date = s.startTime.toISOString().split('T')[0];
      activityMap[date] = (activityMap[date] || 0) + 1;
    });

    return Object.entries(activityMap).map(([date, count]) => ({ date, count }));
  }
}
