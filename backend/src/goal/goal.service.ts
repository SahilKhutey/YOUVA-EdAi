import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfWeek, endOfWeek } from 'date-fns';

@Injectable()
export class GoalService {
    constructor(private prisma: PrismaService) { }

    // Get or create active goal for user
    async getActiveGoal(userId: string) {
        return this.prisma.studyGoal.findFirst({
            where: { userId, isActive: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    // Set new weekly goal (deactivates old one)
    async setGoal(userId: string, weeklyXpTarget: number, weeklyStudyMinutes: number) {
        // Deactivate any existing active goals
        await this.prisma.studyGoal.updateMany({
            where: { userId, isActive: true },
            data: { isActive: false },
        });

        return this.prisma.studyGoal.create({
            data: { userId, weeklyXpTarget, weeklyStudyMinutes, isActive: true },
        });
    }

    // Compute current week's progress toward goal
    async getProgress(userId: string) {
        const goal = await this.getActiveGoal(userId);
        if (!goal) return null;

        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
        const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

        // XP earned this week
        const stats = await this.prisma.userStats.findUnique({ where: { userId } });
        const totalXp = stats?.totalXp ?? 0;

        // Study minutes this week (sum of completed practice sessions)
        const sessions = await this.prisma.practiceSession.findMany({
            where: {
                userId,
                startTime: { gte: weekStart, lte: weekEnd },
                isCompleted: true,
            },
            select: { durationSeconds: true },
        });
        const weeklyStudyMinutes = Math.floor(
            sessions.reduce((sum, s) => sum + (s.durationSeconds ?? 0), 0) / 60,
        );

        // XP earned this week from practice sessions
        const xpSessions = await this.prisma.practiceSession.findMany({
            where: {
                userId,
                startTime: { gte: weekStart, lte: weekEnd },
                isCompleted: true,
            },
            select: { xpEarned: true },
        });
        const weeklyXp = xpSessions.reduce((sum, s) => sum + (s.xpEarned ?? 0), 0);

        return {
            goal,
            progress: {
                weeklyXp,
                weeklyXpTarget: goal.weeklyXpTarget,
                xpPct: Math.min(100, Math.round((weeklyXp / goal.weeklyXpTarget) * 100)),
                weeklyStudyMinutes,
                weeklyStudyMinutesTarget: goal.weeklyStudyMinutes,
                studyPct: Math.min(
                    100,
                    Math.round((weeklyStudyMinutes / goal.weeklyStudyMinutes) * 100),
                ),
                weekStart: weekStart.toISOString(),
                weekEnd: weekEnd.toISOString(),
            },
        };
    }
}
