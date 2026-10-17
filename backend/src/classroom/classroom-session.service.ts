import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScopeAuthorizationService } from '../auth/services/scope-authorization.service';
import { Actor, canRead, isAdmin } from './access';

@Injectable()
export class ClassroomSessionService {
  constructor(private readonly prisma: PrismaService, private readonly scope: ScopeAuthorizationService) {}

  /** A teacher can start a session only with a student in their own class or assignment (admins can with anyone). */
  async start(actor: Actor, body: { lessonPlanId?: string; studentId: string }) {
    if (!isAdmin(actor)) await this.scope.assertTeacherStudentScope(actor.id, body.studentId);
    if (body.lessonPlanId) {
      const plan = await this.prisma.lessonPlan.findUnique({ where: { id: body.lessonPlanId } });
      if (!plan || !canRead(plan.teacherId, plan.status, actor)) throw new NotFoundException('Lesson plan not found');
    }
    return this.prisma.digitalClassroomSession.create({
      data: { teacherId: actor.id, studentId: body.studentId, lessonPlanId: body.lessonPlanId, status: 'ACTIVE', startedAt: new Date() },
    });
  }

  /** Only the two participants (or an admin) can open a session. Names only: never full user records. */
  async get(id: string, actor: Actor) {
    const session = await this.prisma.digitalClassroomSession.findUnique({
      where: { id },
      include: {
        lessonPlan: { include: { steps: { orderBy: { order: 'asc' } } } },
        student: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
      },
    });
    if (!session || !(session.teacherId === actor.id || session.studentId === actor.id || isAdmin(actor))) {
      throw new NotFoundException('Session not found');
    }
    return session;
  }
}
