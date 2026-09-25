import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MasteryEvaluationResult, MasteryStatus } from '../mastery/mastery.types';

export interface TeacherKnowledgeAnalytics {
  knowledgeObjectId: string;
  totalStudentsEngaged: number;
  averageMastery: number;
  statusDistribution: {
    NOT_STARTED: number;
    LEARNING: number;
    STRUGGLING: number;
    DEVELOPING: number;
    MASTERED: number;
    NEEDS_REVIEW: number;
  };
  strugglingStudentsCount: number;
}

@Injectable()
export class LearnerKnowledgeStateService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves current learner state on a concrete knowledge object.
   */
  async getState(
    tenantId: string,
    learnerId: string,
    knowledgeObjectId: string,
  ) {
    return this.prisma.learnerKnowledgeState.findUnique({
      where: {
        tenantId_learnerId_knowledgeObjectId: {
          tenantId,
          learnerId,
          knowledgeObjectId,
        },
      },
      include: {
        knowledgeObject: {
          select: {
            id: true,
            title: true,
            type: true,
            currentVersion: true,
          },
        },
      },
    });
  }

  /**
   * Retrieves all knowledge states for a learner.
   */
  async getAllStatesForLearner(tenantId: string, learnerId: string) {
    return this.prisma.learnerKnowledgeState.findMany({
      where: {
        tenantId,
        learnerId,
      },
      include: {
        knowledgeObject: {
          select: {
            id: true,
            title: true,
            type: true,
            currentVersion: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  /**
   * Updates or initializes learner knowledge state from an evaluated learning outcome.
   */
  async updateState(
    tenantId: string,
    learnerId: string,
    knowledgeObjectId: string,
    evaluation: MasteryEvaluationResult,
    updates: {
      attemptsIncrement?: number;
      correctAttemptsIncrement?: number;
      streakCount?: number;
      observedAt?: Date;
    },
  ) {
    const existing = await this.prisma.learnerKnowledgeState.findUnique({
      where: {
        tenantId_learnerId_knowledgeObjectId: {
          tenantId,
          learnerId,
          knowledgeObjectId,
        },
      },
    });

    const now = updates.observedAt || new Date();
    const attempts = (existing?.attempts || 0) + (updates.attemptsIncrement || 0);
    const correctAttempts = (existing?.correctAttempts || 0) + (updates.correctAttemptsIncrement || 0);
    const streakCount = updates.streakCount !== undefined ? updates.streakCount : existing?.streakCount || 0;

    return this.prisma.learnerKnowledgeState.upsert({
      where: {
        tenantId_learnerId_knowledgeObjectId: {
          tenantId,
          learnerId,
          knowledgeObjectId,
        },
      },
      create: {
        tenantId,
        learnerId,
        knowledgeObjectId,
        masteryLevel: evaluation.masteryLevel,
        confidence: evaluation.confidence,
        status: evaluation.status,
        struggleScore: evaluation.struggleScore,
        attempts,
        correctAttempts,
        streakCount,
        lastActivityAt: now,
        lastEvidenceAt: now,
        nextReviewAt: evaluation.nextReviewAt,
      },
      update: {
        masteryLevel: evaluation.masteryLevel,
        confidence: evaluation.confidence,
        status: evaluation.status,
        struggleScore: evaluation.struggleScore,
        attempts,
        correctAttempts,
        streakCount,
        lastActivityAt: now,
        lastEvidenceAt: now,
        nextReviewAt: evaluation.nextReviewAt,
      },
    });
  }

  /**
   * Aggregates class/cohort learning intelligence for a teacher on a knowledge object.
   */
  async getTeacherAnalytics(
    tenantId: string,
    knowledgeObjectId: string,
  ): Promise<TeacherKnowledgeAnalytics> {
    const states = await this.prisma.learnerKnowledgeState.findMany({
      where: {
        tenantId,
        knowledgeObjectId,
      },
    });

    const distribution = {
      NOT_STARTED: 0,
      LEARNING: 0,
      STRUGGLING: 0,
      DEVELOPING: 0,
      MASTERED: 0,
      NEEDS_REVIEW: 0,
    };

    let totalMastery = 0;

    for (const s of states) {
      totalMastery += s.masteryLevel;
      if (distribution[s.status as MasteryStatus] !== undefined) {
        distribution[s.status as MasteryStatus]++;
      }
    }

    const totalStudents = states.length;
    const averageMastery =
      totalStudents > 0 ? Math.round((totalMastery / totalStudents) * 100) / 100 : 0;

    return {
      knowledgeObjectId,
      totalStudentsEngaged: totalStudents,
      averageMastery,
      statusDistribution: distribution,
      strugglingStudentsCount: distribution.STRUGGLING,
    };
  }
}
