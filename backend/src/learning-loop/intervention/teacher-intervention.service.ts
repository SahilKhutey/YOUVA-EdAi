import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LearningLoopAuditService } from '../audit/learning-loop-audit.service';
import { TeacherInterventionDto } from '../dto/teacher-intervention.dto';
import {
  InterventionAction,
  InterventionStatus,
  DecisionStatus,
  ActorType,
  GateState,
} from '../domain/enums';

@Injectable()
export class TeacherInterventionService {
  private readonly logger = new Logger(TeacherInterventionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: LearningLoopAuditService,
  ) {}

  /**
   * Enforces Teacher-Student Scoping:
   * A teacher may ONLY view or intervene on students assigned to their classroom or roster.
   */
  async verifyTeacherStudentScope(teacherId: string, studentId: string): Promise<void> {
    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher ${teacherId} not found.`);
    }

    // Admins bypass scoping restriction
    if (teacher.role === 'ADMIN') {
      return;
    }

    // Check Digital Classroom assignment
    const classroomSession = await this.prisma.digitalClassroomSession.findFirst({
      where: {
        teacherId,
        studentId,
      },
    });

    // Check Worksheet Submission link
    const worksheetSubmission = await this.prisma.worksheetSubmission.findFirst({
      where: {
        studentId,
        worksheet: { teacherId },
      },
    });

    if (!classroomSession && !worksheetSubmission) {
      this.logger.warn(
        `Unauthorized scope attempt: Teacher ${teacherId} attempted to access Student ${studentId}`,
      );
      throw new ForbiddenException(
        "Teacher is not authorized to intervene for this student: student is outside teacher's active classroom scope.",
      );
    }
  }

  /**
   * Retrieves the pending intervention queue for all students in the teacher's scope.
   */
  async getTeacherQueue(teacherId: string) {
    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher ${teacherId} not found.`);
    }

    // Find all student IDs scoped to this teacher
    let studentIds: string[] = [];
    if (teacher.role === 'ADMIN') {
      // Admins see all students needing review
      const allPending = await this.prisma.policyGateDecision.findMany({
        where: { gateState: { in: [GateState.TEACHER_REVIEW_REQUIRED, GateState.SAFETY_ESCALATION] } },
        select: { userId: true },
      });
      studentIds = Array.from(new Set(allPending.map((p) => p.userId)));
    } else {
      const classroomStudents = await this.prisma.digitalClassroomSession.findMany({
        where: { teacherId },
        select: { studentId: true },
      });
      const worksheetStudents = await this.prisma.worksheetSubmission.findMany({
        where: { worksheet: { teacherId } },
        select: { studentId: true },
      });

      studentIds = Array.from(
        new Set([
          ...classroomStudents.map((c) => c.studentId),
          ...worksheetStudents.map((w) => w.studentId),
        ]),
      );
    }

    if (studentIds.length === 0) {
      return [];
    }

    // Fetch pending policy gate decisions & open interventions
    const pendingGates = await this.prisma.policyGateDecision.findMany({
      where: {
        userId: { in: studentIds },
        gateState: { in: [GateState.TEACHER_REVIEW_REQUIRED, GateState.SAFETY_ESCALATION] },
      },
      include: {
        user: { select: { id: true, name: true, email: true, gradeLevel: true, cognitiveLevel: true } },
        decision: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const pendingInterventions = await this.prisma.teacherIntervention.findMany({
      where: {
        teacherId,
        status: InterventionStatus.PENDING,
      },
      include: {
        student: { select: { id: true, name: true, email: true } },
        decision: true,
      },
    });

    return {
      pendingGates,
      pendingInterventions,
    };
  }

  /**
   * Executes a Teacher Intervention: APPROVE, OVERRIDE, or INTERVENE.
   * STRICT POLICY: Teacher Override ALWAYS supersedes AI recommendation!
   */
  async executeIntervention(teacherId: string, dto: TeacherInterventionDto) {
    // 1. Verify Scope
    await this.verifyTeacherStudentScope(teacherId, dto.studentId);

    // 2. Fetch Decision if provided
    let originalDecision: any = null;
    if (dto.decisionId) {
      originalDecision = await this.prisma.personalizationDecision.findUnique({
        where: { id: dto.decisionId },
      });
    }

    // 3. Handle Override vs Approve
    let updatedDecisionStatus = DecisionStatus.PROPOSED;
    if (dto.action === InterventionAction.OVERRIDE) {
      updatedDecisionStatus = DecisionStatus.OVERRIDDEN;
      if (dto.decisionId) {
        await this.prisma.personalizationDecision.update({
          where: { id: dto.decisionId },
          data: {
            status: DecisionStatus.OVERRIDDEN,
            activityType: dto.overrideDetails?.forcedActivityType ?? originalDecision?.activityType,
            difficulty: dto.overrideDetails?.forcedDifficulty ?? originalDecision?.difficulty,
            modality: dto.overrideDetails?.forcedModality ?? originalDecision?.modality,
            pacing: dto.overrideDetails?.forcedPacing ?? originalDecision?.pacing,
            recommendationRationale: `[Teacher Override] ${dto.overrideDetails?.teacherNotes || 'Overridden by educator authority.'}`,
          },
        });
      }
    } else if (dto.action === InterventionAction.APPROVE) {
      updatedDecisionStatus = DecisionStatus.ACCEPTED;
      if (dto.decisionId) {
        await this.prisma.personalizationDecision.update({
          where: { id: dto.decisionId },
          data: { status: DecisionStatus.ACCEPTED },
        });
      }
    }

    // 4. Create Teacher Intervention Record
    const interventionRecord = await this.prisma.teacherIntervention.create({
      data: {
        teacherId,
        studentId: dto.studentId,
        decisionId: dto.decisionId ?? null,
        action: dto.action,
        overrideDetails: dto.overrideDetails ? JSON.stringify(dto.overrideDetails) : null,
        feedback: dto.feedback ?? null,
        status: InterventionStatus.RESOLVED,
      },
    });

    // 5. Append-Only Audit Trail
    await this.auditService.logAction({
      userId: dto.studentId,
      actorType: ActorType.TEACHER,
      actorId: teacherId,
      action: `TEACHER_${dto.action}`,
      stateBefore: originalDecision ? { decision: originalDecision } : null,
      stateAfter: {
        interventionId: interventionRecord.id,
        action: dto.action,
        decisionStatus: updatedDecisionStatus,
        overrideDetails: dto.overrideDetails,
        feedback: dto.feedback,
      },
      metadata: { teacherId, studentId: dto.studentId },
    });

    this.logger.log(
      `Teacher ${teacherId} executed ${dto.action} for student ${dto.studentId} (Intervention: ${interventionRecord.id})`,
    );

    return interventionRecord;
  }
}
