import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) { }

  async getStats(userId: string) {
    // 1. Overall Mastery
    const masteryRecords = await this.prisma.userTopicMastery.findMany({
      where: { userId },
    });

    const totalMastery = masteryRecords.reduce(
      (sum, record) => sum + (record.masteryProbability * 100),
      0,
    );
    const overallMastery =
      masteryRecords.length > 0 ? totalMastery / masteryRecords.length : 0;

    // 2. Recent Activity (Last 5 sessions combined)
    const recentLearning = await this.prisma.learningSession.findMany({
      where: { userId },
      take: 5,
      orderBy: { startTime: 'desc' },
      include: { topic: true },
    });

    const recentPractice = await this.prisma.practiceSession.findMany({
      where: { userId },
      take: 5,
      orderBy: { startTime: 'desc' },
      include: { topic: true },
    });

    // Merge and sort
    const recentActivity = [
      ...recentLearning.map((s) => ({
        id: s.id,
        type: 'LEARNING',
        topic: s.topic.title,
        date: s.startTime,
        score: null,
      })),
      ...recentPractice.map((s) => ({
        id: s.id,
        type: 'PRACTICE',
        topic: s.topic.title,
        date: s.startTime,
        score: s.score,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    // 3. Subject Progress
    // Get all subjects
    const subjects = await this.prisma.subject.findMany({
      include: { topics: true },
    });

    const subjectProgress = subjects.map((subject) => {
      const topicIds = subject.topics.map((t) => t.id);
      const subjectMasteryRecords = masteryRecords.filter((r) =>
        topicIds.includes(r.topicId),
      );
      const totalSubjectMastery = subjectMasteryRecords.reduce(
        (sum, r) => sum + (r.masteryProbability * 100),
        0,
      );
      const avgMastery =
        subject.topics.length > 0
          ? totalSubjectMastery / subject.topics.length
          : 0; // Avg over ALL topics, not just attempted ones?
      // Better: Avg over attempted topics? Or total topics?
      // User perspective: "How much of this subject have I mastered?" -> total topics.
      // But unattempted topics act as 0.
      // Let's use total topics count for denominator to show real progress.
      // So if 10 topics, and I mastered 1 topic 100%, my subject mastery is 10%.

      return {
        id: subject.id,
        name: subject.name,
        mastery: avgMastery,
        totalTopics: subject.topics.length,
        masteredTopics: subjectMasteryRecords.filter((r) => r.masteryProbability > 0.8)
          .length,
      };
    });

    return {
      userId,
      overallMastery,
      totalSessions: recentLearning.length + recentPractice.length, // Only correct for fetched ones? No, need count.
      // Fixing total count
      totalLearningSessions: await this.prisma.learningSession.count({
        where: { userId },
      }),
      totalPracticeSessions: await this.prisma.practiceSession.count({
        where: { userId },
      }),
      recentActivity,
      subjectProgress,
    };
  }
}
