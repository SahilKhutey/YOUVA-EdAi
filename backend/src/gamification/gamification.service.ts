import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(private prisma: PrismaService) {}

  // Calculate required XP for a given level
  // Formula: XP = (Level - 1)^2 * 100
  private calculateRequiredXp(level: number): number {
    return Math.pow(level - 1, 2) * 100;
  }

  // Calculate level based on total XP
  // Formula: Level = floor(sqrt(XP / 100)) + 1
  private calculateLevel(xp: number): number {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  }

  async getUserStats(userId: string) {
    let stats = await this.prisma.userStats.findUnique({
      where: { userId },
    });

    if (!stats) {
      // Initialize stats if they don't exist
      stats = await this.prisma.userStats.create({
        data: {
          userId,
          totalXp: 0,
          currentLevel: 1,
          currentStreak: 0,
          bestStreak: 0,
        },
      });
    }

    const nextLevelXp = this.calculateRequiredXp(stats.currentLevel + 1);
    const progressToNextLevel =
      stats.totalXp - this.calculateRequiredXp(stats.currentLevel);
    const xpNeededForNextLevel =
      nextLevelXp - this.calculateRequiredXp(stats.currentLevel);

    return {
      ...stats,
      nextLevelXp,
      progressPercentage:
        Math.min(
          100,
          Math.round((progressToNextLevel / xpNeededForNextLevel) * 100),
        ) || 0,
    };
  }

  async addXp(userId: string, xpToAdd: number) {
    const stats = await this.prisma.userStats.findUnique({
      where: { userId },
    });

    if (!stats) return;

    const newXp = stats.totalXp + xpToAdd;
    const newLevel = this.calculateLevel(newXp);

    await this.prisma.userStats.update({
      where: { userId },
      data: {
        totalXp: newXp,
        currentLevel: newLevel,
      },
    });

    if (newLevel > stats.currentLevel) {
      this.logger.log(`User ${userId} leveled up to ${newLevel}!`);
      // Future: Trigger a websocket event or notification here
    }

    await this.checkBadges(userId);
  }

  async updateStreak(userId: string) {
    const stats = await this.prisma.userStats.findUnique({
      where: { userId },
    });

    if (!stats) return;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let lastActivity = null;
    if (stats.lastActivityDate) {
      lastActivity = new Date(stats.lastActivityDate);
      lastActivity = new Date(
        lastActivity.getFullYear(),
        lastActivity.getMonth(),
        lastActivity.getDate(),
      );
    }

    let newStreak = stats.currentStreak;
    let newBestStreak = stats.bestStreak;

    if (!lastActivity) {
      // First time activity
      newStreak = 1;
    } else {
      const diffTime = Math.abs(today.getTime() - lastActivity.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day
        newStreak += 1;
      } else if (diffDays > 1) {
        // Streak broken
        newStreak = 1;
      }
      // If diffDays === 0, they already got activity today, don't increment streak
    }

    if (newStreak > newBestStreak) {
      newBestStreak = newStreak;
    }

    await this.prisma.userStats.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        bestStreak: newBestStreak,
        lastActivityDate: now,
      },
    });

    await this.checkBadges(userId);
  }

  async getUserBadges(userId: string) {
    const userBadges = await this.prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
    });
    return userBadges.map((ub) => ub.badge);
  }

  private async checkBadges(userId: string) {
    const stats = await this.prisma.userStats.findUnique({ where: { userId } });
    if (!stats) return;

    const allBadges = await this.prisma.badge.findMany();
    const earnedBadges = await this.prisma.userBadge.findMany({
      where: { userId },
    });
    const earnedBadgeIds = new Set(earnedBadges.map((ub) => ub.badgeId));

    for (const badge of allBadges) {
      if (!earnedBadgeIds.has(badge.id)) {
        let earned = false;

        switch (badge.requirementType) {
          case 'XP':
            earned = stats.totalXp >= badge.requirementValue;
            break;
          case 'STREAK':
            earned = stats.currentStreak >= badge.requirementValue;
            break;
          // Add other requirement types here (e.g., TOPICS_MASTERED)
        }

        if (earned) {
          await this.prisma.userBadge.create({
            data: {
              userId,
              badgeId: badge.id,
            },
          });
          this.logger.log(`User ${userId} earned badge: ${badge.name}`);
        }
      }
    }
  }

  // --- Utility seed method for badges ---
  async seedBadges() {
    const count = await this.prisma.badge.count();
    if (count > 0) return;

    await this.prisma.badge.createMany({
      data: [
        {
          name: 'Novice Learner',
          description: 'Earn 100 XP',
          icon: 'star',
          requirementType: 'XP',
          requirementValue: 100,
        },
        {
          name: 'Dedicated Learner',
          description: 'Earn 500 XP',
          icon: 'award',
          requirementType: 'XP',
          requirementValue: 500,
        },
        {
          name: '3-Day Streak',
          description: 'Study 3 days in a row',
          icon: 'flame',
          requirementType: 'STREAK',
          requirementValue: 3,
        },
        {
          name: '7-Day Streak',
          description: 'Study 7 days in a row',
          icon: 'flame-hot',
          requirementType: 'STREAK',
          requirementValue: 7,
        },
      ],
    });
    this.logger.log('Seeded default badges.');
  }
}
