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
import { ResolveInterventionDto } from '../dto/resolve-intervention.dto';
import { InterventionStatus, ActorType } from '../../learning-loop/domain/enums';

@Injectable()
export class TeacherInterventionOpsService {
  private readonly logger = new Logger(TeacherInterventionOpsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly scopeAuth: ScopeAuthorizationService,
    private readonly auditService: LearningLoopAuditService,
  ) {}

  /**
   * Retrieves the intervention queue for all students in teacher scope.
   * Categorizes into URGENT and REVIEW tiers.
   */
  async getInterventionQueue(teacherId: string) {
    const studentIds = await this.scopeAuth.getScopedStudentIds(teacherId);

    if (studentIds.length === 0) {
      return { urgent: [], review: [] };
    }

    // 1. Fetch pending interventions
    const interventions = await this.prisma.teacherIntervention.findMany({
      where: {
        studentId: { in: studentIds },
        status: InterventionStatus.PENDING,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            gradeLevel: true,
            escalationEvents: {
              where: { status: { in: ['OPEN', 'IN_REVIEW'] } },
              select: { id: true, severity: true, reason: true },
            },
            cognitiveStateLogs: {
              orderBy: { timestamp: 'desc' },
              take: 1,
              select: { cognitiveLoad: true, inferredState: true },
            },
          },
        },
        decision: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Classify into URGENT vs REVIEW
    const urgent: any[] = [];
    const review: any[] = [];

    interventions.forEach((item) => {
      const hasUrgentEscalation = (item.student.escalationEvents || []).length > 0;
      const isExtremeLoad = (item.student.cognitiveStateLogs[0]?.cognitiveLoad || 0) > 0.85;

      const queueItem = {
        id: item.id,
        studentId: item.studentId,
        studentName: item.student.name || item.student.email,
        studentEmail: item.student.email,
        gradeLevel: item.student.gradeLevel,
        action: item.action,
        feedback: item.feedback,
        status: item.status,
        createdAt: item.createdAt,
        activeEscalations: item.student.escalationEvents,
        latestCognitiveState: item.student.cognitiveStateLogs[0] || null,
        priority: hasUrgentEscalation || isExtremeLoad ? 'URGENT' : 'REVIEW',
      };

      if (hasUrgentEscalation || isExtremeLoad) {
        urgent.push(queueItem);
      } else {
        review.push(queueItem);
      }
    });

    return { urgent, review };
  }

  /**
   * Resolves a pending teacher intervention.
   * STRICT: Authorized human educator only.
   */
  async resolveIntervention(
    teacherId: string,
    interventionId: string,
    dto: ResolveInterventionDto,
    actorType: ActorType = ActorType.TEACHER,
  ) {
    if (actorType === ActorType.AI) {
      throw new ForbiddenException(
        'Policy Violation: AI is strictly forbidden from closing or resolving teacher interventions.',
      );
    }

    const intervention = await this.prisma.teacherIntervention.findUnique({
      where: { id: interventionId },
    });

    if (!intervention) {
      throw new NotFoundException(`Intervention ${interventionId} not found.`);
    }

    // Verify Scope
    await this.scopeAuth.assertTeacherStudentScope(teacherId, intervention.studentId);

    if (intervention.status === InterventionStatus.RESOLVED) {
      throw new BadRequestException('Intervention has already been resolved.');
    }

    if (!dto.resolutionNotes || dto.resolutionNotes.trim().length === 0) {
      throw new BadRequestException('Resolution notes are required when resolving an intervention.');
    }

    const updated = await this.prisma.teacherIntervention.update({
      where: { id: interventionId },
      data: {
        status: InterventionStatus.RESOLVED,
        feedback: `${intervention.feedback ? intervention.feedback + ' | ' : ''}[Resolved by Teacher] ${dto.resolutionNotes}`.trim(),
      },
    });

    // Record audit entry
    await this.auditService.logAction({
      userId: intervention.studentId,
      actorType,
      actorId: teacherId,
      action: 'TEACHER_INTERVENTION_RESOLVED',
      stateBefore: { status: intervention.status },
      stateAfter: { status: InterventionStatus.RESOLVED, resolutionNotes: dto.resolutionNotes },
      metadata: { interventionId },
    });

    this.logger.log(`Teacher ${teacherId} resolved intervention ${interventionId} for student ${intervention.studentId}`);

    return updated;
  }
}
