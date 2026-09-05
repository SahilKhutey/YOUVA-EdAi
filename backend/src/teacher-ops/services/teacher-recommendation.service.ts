import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ScopeAuthorizationService } from '../../auth/services/scope-authorization.service';
import { LearningLoopAuditService } from '../../learning-loop/audit/learning-loop-audit.service';
import { OverrideRecommendationDto } from '../dto/override-recommendation.dto';
import { DecisionStatus, ActorType } from '../../learning-loop/domain/enums';

@Injectable()
export class TeacherRecommendationService {
  private readonly logger = new Logger(TeacherRecommendationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly scopeAuth: ScopeAuthorizationService,
    private readonly auditService: LearningLoopAuditService,
  ) {}

  /**
   * Retrieves pending AI recommendations for all students in teacher scope.
   */
  async getRecommendations(teacherId: string) {
    const studentIds = await this.scopeAuth.getScopedStudentIds(teacherId);

    if (studentIds.length === 0) {
      return [];
    }

    return this.prisma.personalizationDecision.findMany({
      where: {
        userId: { in: studentIds },
      },
      include: {
        user: { select: { id: true, name: true, email: true, gradeLevel: true } },
        topic: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Teacher approves an AI recommendation.
   */
  async approveRecommendation(teacherId: string, decisionId: string) {
    const decision = await this.prisma.personalizationDecision.findUnique({
      where: { id: decisionId },
    });

    if (!decision) {
      throw new NotFoundException(`Decision ${decisionId} not found.`);
    }

    // Verify Scope
    await this.scopeAuth.assertTeacherStudentScope(teacherId, decision.userId);

    if (decision.status !== DecisionStatus.PROPOSED) {
      throw new BadRequestException(
        `Cannot approve decision: decision is already in status '${decision.status}'.`,
      );
    }

    const updated = await this.prisma.personalizationDecision.update({
      where: { id: decisionId },
      data: { status: DecisionStatus.ACCEPTED },
    });

    await this.auditService.logAction({
      userId: decision.userId,
      actorType: ActorType.TEACHER,
      actorId: teacherId,
      action: 'TEACHER_RECOMMENDATION_APPROVED',
      stateBefore: { status: decision.status },
      stateAfter: { status: DecisionStatus.ACCEPTED, decisionId },
    });

    return updated;
  }

  /**
   * Teacher overrides an AI recommendation.
   * Hard Rule: Teacher decision is authoritative over AI recommendation.
   */
  async overrideRecommendation(
    teacherId: string,
    decisionId: string,
    dto: OverrideRecommendationDto,
  ) {
    const decision = await this.prisma.personalizationDecision.findUnique({
      where: { id: decisionId },
    });

    if (!decision) {
      throw new NotFoundException(`Decision ${decisionId} not found.`);
    }

    // Verify Scope
    await this.scopeAuth.assertTeacherStudentScope(teacherId, decision.userId);

    if (decision.status === DecisionStatus.OVERRIDDEN) {
      throw new BadRequestException('Decision has already been finalized and overridden.');
    }

    const updated = await this.prisma.personalizationDecision.update({
      where: { id: decisionId },
      data: {
        status: DecisionStatus.OVERRIDDEN,
        activityType: dto.forcedActivityType,
        difficulty: dto.forcedDifficulty,
        modality: dto.forcedModality ?? decision.modality,
        pacing: dto.forcedPacing ?? decision.pacing,
        recommendationRationale: `[Teacher Override: ${dto.reason}] ${dto.teacherNotes || ''}`.trim(),
      },
    });

    // Create a resolved intervention record
    await this.prisma.teacherIntervention.create({
      data: {
        teacherId,
        studentId: decision.userId,
        decisionId,
        action: 'OVERRIDE',
        feedback: dto.reason,
        overrideDetails: JSON.stringify(dto),
        status: 'RESOLVED',
      },
    });

    // Log immutable audit entry
    await this.auditService.logAction({
      userId: decision.userId,
      actorType: ActorType.TEACHER,
      actorId: teacherId,
      action: 'TEACHER_RECOMMENDATION_OVERRIDDEN',
      stateBefore: {
        activityType: decision.activityType,
        difficulty: decision.difficulty,
        rationale: decision.recommendationRationale,
      },
      stateAfter: {
        activityType: dto.forcedActivityType,
        difficulty: dto.forcedDifficulty,
        reason: dto.reason,
        status: DecisionStatus.OVERRIDDEN,
      },
    });

    this.logger.log(
      `Teacher ${teacherId} overrode AI decision ${decisionId} for student ${decision.userId}`,
    );

    return updated;
  }
}
