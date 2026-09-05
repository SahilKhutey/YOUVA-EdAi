import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ScopeAuthorizationService {
  private readonly logger = new Logger(ScopeAuthorizationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Asserts that a teacher is authorized to access a given student.
   * Throws ForbiddenException if outside scope.
   */
  async assertTeacherStudentScope(teacherId: string, studentId: string): Promise<boolean> {
    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${teacherId} not found.`);
    }

    // Admins have organization-wide access
    if (teacher.role === 'ADMIN') {
      return true;
    }

    // 1. Check direct 1-on-1 teacher-student assignment
    const directAssignment = await this.prisma.teacherStudentAssignment.findFirst({
      where: {
        teacherId,
        studentId,
        isActive: true,
      },
    });
    if (directAssignment) return true;

    // 2. Check class enrollment
    const classEnrollment = await this.prisma.teacherClassEnrollment.findFirst({
      where: {
        studentId,
        class: { teacherId },
      },
    });
    if (classEnrollment) return true;

    // 3. Check digital classroom session
    const classroomSession = await this.prisma.digitalClassroomSession.findFirst({
      where: {
        teacherId,
        studentId,
      },
    });
    if (classroomSession) return true;

    // 4. Check worksheet submission
    const worksheetSubmission = await this.prisma.worksheetSubmission.findFirst({
      where: {
        studentId,
        worksheet: { teacherId },
      },
    });
    if (worksheetSubmission) return true;

    this.logger.warn(
      `Resource Scope Violation: Teacher ${teacherId} denied access to Student ${studentId}`,
    );

    throw new ForbiddenException(
      "Access Denied: Student is outside your authorized instructional scope.",
    );
  }

  /**
   * Asserts that a teacher owns/manages a specific class.
   */
  async assertTeacherClassScope(teacherId: string, classId: string): Promise<boolean> {
    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${teacherId} not found.`);
    }

    if (teacher.role === 'ADMIN') {
      return true;
    }

    const teacherClass = await this.prisma.teacherClass.findUnique({
      where: { id: classId },
    });

    if (!teacherClass) {
      throw new NotFoundException(`Class with ID ${classId} not found.`);
    }

    if (teacherClass.teacherId !== teacherId) {
      throw new ForbiddenException('Access Denied: You do not manage this instructional class cohort.');
    }

    return true;
  }

  /**
   * Retrieves the full list of authorized student IDs for a teacher.
   */
  async getScopedStudentIds(teacherId: string): Promise<string[]> {
    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${teacherId} not found.`);
    }

    if (teacher.role === 'ADMIN') {
      const allStudents = await this.prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: { id: true },
      });
      return allStudents.map((s) => s.id);
    }

    const [directAssignments, classEnrollments, classroomSessions, worksheetSubmissions] =
      await Promise.all([
        this.prisma.teacherStudentAssignment.findMany({
          where: { teacherId, isActive: true },
          select: { studentId: true },
        }),
        this.prisma.teacherClassEnrollment.findMany({
          where: { class: { teacherId } },
          select: { studentId: true },
        }),
        this.prisma.digitalClassroomSession.findMany({
          where: { teacherId },
          select: { studentId: true },
        }),
        this.prisma.worksheetSubmission.findMany({
          where: { worksheet: { teacherId } },
          select: { studentId: true },
        }),
      ]);

    const ids = new Set<string>([
      ...directAssignments.map((a) => a.studentId),
      ...classEnrollments.map((c) => c.studentId),
      ...classroomSessions.map((s) => s.studentId),
      ...worksheetSubmissions.map((w) => w.studentId),
    ]);

    return Array.from(ids);
  }
}
