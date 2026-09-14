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

  private async executeTx<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    if (typeof (this.prisma as any).$transaction === 'function') {
      return (this.prisma as any).$transaction(fn);
    }
    return fn(this.prisma);
  }

  private async logAudit(entry: any, tx?: any) {
    if (tx && tx !== this.prisma) {
      return this.auditService.logAction(entry, tx);
    }
    return this.auditService.logAction(entry);
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

    const updated = await this.executeTx(async (tx) => {
      const res = await tx.teacherIntervention.update({
        where: { id: interventionId },
        data: {
          status: InterventionStatus.RESOLVED,
          feedback: `${intervention.feedback ? intervention.feedback + ' | ' : ''}[Resolved by Teacher] ${dto.resolutionNotes}`.trim(),
        },
      });

      await this.logAudit(
        {
          userId: intervention.studentId,
          actorType,
          actorId: teacherId,
          action: 'TEACHER_INTERVENTION_RESOLVED',
          stateBefore: { status: intervention.status },
          stateAfter: { status: InterventionStatus.RESOLVED, resolutionNotes: dto.resolutionNotes },
          metadata: { interventionId },
        },
        tx,
      );

      return res;
    });

    this.logger.log(`Teacher ${teacherId} resolved intervention ${interventionId} for student ${intervention.studentId}`);

    return updated;
  }

  /**
   * Retrieves a single intervention by ID, verifying teacher scope.
   */
  async getIntervention(teacherId: string, interventionId: string) {
    const intervention = await this.prisma.teacherIntervention.findUnique({
      where: { id: interventionId },
      include: {
        student: { select: { id: true, name: true, email: true, gradeLevel: true } },
        decision: true,
      },
    });

    if (!intervention) {
      throw new NotFoundException(`Intervention ${interventionId} not found.`);
    }

    await this.scopeAuth.assertTeacherStudentScope(teacherId, intervention.studentId);
    return intervention;
  }

  /**
   * Creates an intervention request.
   */
  async createIntervention(
    teacherId: string,
    dto: {
      learnerId: string;
      type: string;
      reason: string;
      recommendation?: string;
    },
    actorType: ActorType = ActorType.TEACHER,
  ) {
    if (actorType === ActorType.AI || actorType === ActorType.STUDENT) {
      throw new ForbiddenException('Only authorized educators can create teacher interventions.');
    }

    await this.scopeAuth.assertTeacherStudentScope(teacherId, dto.learnerId);

    const intervention = await this.executeTx(async (tx) => {
      const created = await tx.teacherIntervention.create({
        data: {
          teacherId,
          studentId: dto.learnerId,
          action: dto.type || 'INTERVENE',
          feedback: dto.reason,
          status: InterventionStatus.PENDING,
        },
      });

      await this.logAudit(
        {
          userId: dto.learnerId,
          actorType,
          actorId: teacherId,
          action: 'TEACHER_INTERVENTION_CREATED',
          stateBefore: null,
          stateAfter: created,
          metadata: {
            type: dto.type,
            reason: dto.reason,
            recommendation: dto.recommendation,
          },
        },
        tx,
      );

      return created;
    });

    return intervention;
  }

  /**
   * Authorizes a proposed intervention.
   * Atomic transaction: status update to AUTHORIZED + audit event (N3.5, N3.13).
   */
  async authorizeIntervention(
    teacherId: string,
    interventionId: string,
    actorType: ActorType = ActorType.TEACHER,
  ) {
    if (actorType === ActorType.AI || actorType === ActorType.STUDENT) {
      throw new ForbiddenException('Only human educators can authorize consequential interventions.');
    }

    const intervention = await this.prisma.teacherIntervention.findUnique({
      where: { id: interventionId },
    });

    if (!intervention) {
      throw new NotFoundException(`Intervention ${interventionId} not found.`);
    }

    await this.scopeAuth.assertTeacherStudentScope(teacherId, intervention.studentId);

    if (intervention.status === 'AUTHORIZED' || intervention.status === InterventionStatus.RESOLVED) {
      throw new BadRequestException(`Intervention is already in status ${intervention.status}.`);
    }

    return this.executeTx(async (tx) => {
      const updated = await tx.teacherIntervention.update({
        where: { id: interventionId },
        data: {
          status: 'AUTHORIZED',
        },
      });

      await this.logAudit(
        {
          userId: intervention.studentId,
          actorType,
          actorId: teacherId,
          action: 'TEACHER_INTERVENTION_AUTHORIZED',
          stateBefore: { status: intervention.status },
          stateAfter: { status: 'AUTHORIZED' },
          metadata: { interventionId },
        },
        tx,
      );

      return updated;
    });
  }

  /**
   * Rejects a proposed intervention with documented rationale.
   */
  async rejectIntervention(
    teacherId: string,
    interventionId: string,
    reason?: string,
    actorType: ActorType = ActorType.TEACHER,
  ) {
    if (actorType === ActorType.AI || actorType === ActorType.STUDENT) {
      throw new ForbiddenException('Only human educators can reject interventions.');
    }

    const intervention = await this.prisma.teacherIntervention.findUnique({
      where: { id: interventionId },
    });

    if (!intervention) {
      throw new NotFoundException(`Intervention ${interventionId} not found.`);
    }

    await this.scopeAuth.assertTeacherStudentScope(teacherId, intervention.studentId);

    return this.executeTx(async (tx) => {
      const updated = await tx.teacherIntervention.update({
        where: { id: interventionId },
        data: {
          status: 'REJECTED',
          feedback: reason ? `[Rejected] ${reason}` : '[Rejected by Teacher]',
        },
      });

      await this.logAudit(
        {
          userId: intervention.studentId,
          actorType,
          actorId: teacherId,
          action: 'TEACHER_INTERVENTION_REJECTED',
          stateBefore: { status: intervention.status },
          stateAfter: { status: 'REJECTED', reason },
          metadata: { interventionId },
        },
        tx,
      );

      return updated;
    });
  }
}
