import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeacherAnalyticsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Returns a cohort-wide overview:
     * - Per-subject average mastery across all STUDENT users
     * - Avg engagement score per subject
     * - Total active students (those with at least one PracticeSession)
     */
    async getCohortOverview() {
        const subjects = await this.prisma.subject.findMany({
            include: { topics: true },
        });

        const allMastery = await this.prisma.userTopicMastery.findMany({
            include: { topic: { include: { subject: true } } },
        });

        const allEngagement = await this.prisma.engagementLog.findMany({
            include: { topic: { include: { subject: true } } },
        });

        // Per-subject mastery average
        const subjectMastery = subjects.map((sub) => {
            const topicIds = sub.topics.map((t) => t.id);
            const records = allMastery.filter((r) => topicIds.includes(r.topicId));
            const avg =
                records.length > 0
                    ? records.reduce((s, r) => s + r.masteryProbability, 0) /
                    records.length
                    : 0;
            return { subject: sub.name, avgMastery: Math.round(avg * 100) };
        });

        // Per-subject engagement average
        const subjectEngagement = subjects.map((sub) => {
            const topicIds = sub.topics.map((t) => t.id);
            const logs = allEngagement.filter((l) => topicIds.includes(l.topicId));
            const avg =
                logs.length > 0
                    ? logs.reduce((s, l) => s + l.finalEngagementScore, 0) / logs.length
                    : 0;
            return { subject: sub.name, avgEngagement: Math.round(avg * 100) / 100 };
        });

        // Active student count
        const activeStudentCount = await this.prisma.user.count({
            where: {
                role: 'STUDENT',
                practiceSessions: { some: {} },
            },
        });

        const totalStudentCount = await this.prisma.user.count({
            where: { role: 'STUDENT' },
        });

        return {
            subjectMastery,
            subjectEngagement,
            activeStudentCount,
            totalStudentCount,
        };
    }

    /**
     * Returns a list of all STUDENT users with their gamification stats
     * attached, for the class roster table.
     */
    async getAllStudents() {
        const students = await this.prisma.user.findMany({
            where: { role: 'STUDENT' },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                stats: {
                    select: {
                        totalXp: true,
                        currentLevel: true,
                        currentStreak: true,
                    },
                },
                topicMastery: {
                    select: { masteryProbability: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return students.map((s) => {
            const avgMastery =
                s.topicMastery.length > 0
                    ? s.topicMastery.reduce((sum, m) => sum + m.masteryProbability, 0) /
                    s.topicMastery.length
                    : 0;
            return {
                id: s.id,
                name: s.name ?? 'Unnamed Student',
                email: s.email,
                joinedAt: s.createdAt,
                totalXp: s.stats?.totalXp ?? 0,
                currentLevel: s.stats?.currentLevel ?? 1,
                currentStreak: s.stats?.currentStreak ?? 0,
                avgMastery: Math.round(avgMastery * 100),
            };
        });
    }

    /**
     * Returns a detailed profile of a single student for the teacher's
     * deep-dive view.
     */
    async getStudentDetail(studentId: string) {
        const student = await this.prisma.user.findUnique({
            where: { id: studentId },
            select: {
                id: true,
                name: true,
                email: true,
                gradeLevel: true,
                cognitiveLevel: true,
                createdAt: true,
                stats: true,
                badges: { include: { badge: true } },
                topicMastery: {
                    include: { topic: { include: { subject: true } } },
                    orderBy: { masteryProbability: 'asc' },
                },
                practiceSessions: {
                    select: { score: true, startTime: true, topic: { select: { title: true } } },
                    orderBy: { startTime: 'desc' },
                    take: 15,
                },
                mistakeLogs: {
                    include: { topic: { select: { title: true } } },
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                },
            },
        });

        if (!student) return null;

        return student;
    }

    /**
     * Returns published GeneratedContent items for the given teacher,
     * enriched with the count of practice sessions that match the topic.
     */
    async getContentPerformance(teacherId: string) {
        const contents = await this.prisma.generatedContent.findMany({
            where: { teacherId, status: 'PUBLISHED' },
            include: { topic: true },
            orderBy: { updatedAt: 'desc' },
        });

        const enriched = await Promise.all(
            contents.map(async (c: any) => {
                let practiceCount = 0;
                let avgScore = 0;
                if (c.topicId) {
                    const sessions = await this.prisma.practiceSession.findMany({
                        where: { topicId: c.topicId, score: { not: null } },
                        select: { score: true },
                    });
                    practiceCount = sessions.length;
                    avgScore =
                        sessions.length > 0
                            ? Math.round(
                                sessions.reduce((s, r) => s + (r.score ?? 0), 0) /
                                sessions.length,
                            )
                            : 0;
                }

                return {
                    id: c.id,
                    type: c.type,
                    difficulty: c.difficulty,
                    learningObjective: c.learningObjective,
                    bloomsTaxonomyLevel: c.bloomsTaxonomyLevel,
                    topicTitle: c.topic?.title ?? '—',
                    publishedAt: c.updatedAt,
                    practiceCount,
                    avgScore,
                };
            }),
        );

        return enriched;
    }

    /**
     * Returns analytics on published worksheets for a specific teacher.
     */
    async getWorksheetPerformance(teacherId: string) {
        const worksheets = await this.prisma.worksheet.findMany({
            where: { teacherId, status: 'PUBLISHED' },
            include: { topic: true, submissions: true },
            orderBy: { updatedAt: 'desc' },
        });

        return worksheets.map(w => {
            const submissionCount = w.submissions.length;
            const avgScore = submissionCount > 0
                ? w.submissions.reduce((s, sub) => s + (sub.score ?? 0), 0) / submissionCount
                : 0;
            return {
                id: w.id,
                title: w.title,
                topicTitle: w.topic?.title ?? '—',
                difficulty: w.difficulty,
                publishedAt: w.updatedAt,
                submissionCount,
                avgScore: Math.round(avgScore)
            };
        });
    }

    /**
     * Serialises all student stats to a RFC-4180 CSV string.
     */
    async exportStudentsCsv(): Promise<string> {
        const rows = await this.getAllStudents();

        const headers = [
            'Name',
            'Email',
            'Joined',
            'Level',
            'Total XP',
            'Current Streak',
            'Avg Mastery %',
        ];

        const escape = (v: string | number | Date) => {
            const s = String(v);
            return s.includes(',') || s.includes('"') || s.includes('\n')
                ? `"${s.replace(/"/g, '""')}"`
                : s;
        };

        const lines = [
            headers.join(','),
            ...rows.map((r) =>
                [
                    escape(r.name),
                    escape(r.email),
                    escape(new Date(r.joinedAt).toLocaleDateString('en-GB')),
                    escape(r.currentLevel),
                    escape(r.totalXp),
                    escape(r.currentStreak),
                    escape(r.avgMastery),
                ].join(','),
            ),
        ];

        return lines.join('\r\n');
    }
}

