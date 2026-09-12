import {
  Controller,
  Get,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Role } from '../../auth/role.enum';
import { LearningTransactionService } from '../services/learning-transaction.service';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('learners')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LearnersController {
  constructor(
    private readonly learningTxService: LearningTransactionService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Authoritative learner mastery profile (N2.5, N2.11).
   */
  @Get(':id/mastery')
  async getLearnerMastery(@Req() req: any, @Param('id') learnerId: string) {
    const currentUserId = req.user.id || req.user.userId;
    const isSelf = currentUserId === learnerId;
    const isStaff = req.user.role === Role.TEACHER || req.user.role === Role.ADMIN;

    if (!isSelf && !isStaff) {
      throw new ForbiddenException('Access denied: Cannot query another learner mastery');
    }

    const masteries = await this.prisma.userTopicMastery.findMany({
      where: { userId: learnerId },
      include: { topic: { include: { subject: true } } },
      orderBy: { masteryProbability: 'desc' },
    });

    return {
      learnerId,
      masteryCount: masteries.length,
      topics: masteries.map((m) => ({
        topicId: m.topicId,
        topicTitle: m.topic.title,
        subjectName: m.topic.subject.name,
        masteryProbability: m.masteryProbability,
        difficultyState: m.difficultyState,
        lastReviewed: m.lastReviewed,
      })),
    };
  }

  /**
   * Explainable learner history with full audit correlation chain (N2.9, N2.10, N2.11).
   */
  @Get(':id/learning-history')
  async getLearnerHistory(@Req() req: any, @Param('id') learnerId: string) {
    const currentUserId = req.user.id || req.user.userId;
    const isSelf = currentUserId === learnerId;
    const isStaff = req.user.role === Role.TEACHER || req.user.role === Role.ADMIN;

    if (!isSelf && !isStaff) {
      throw new ForbiddenException('Access denied: Cannot inspect another learner history');
    }

    return this.learningTxService.getLearnerHistory(learnerId);
  }
}
