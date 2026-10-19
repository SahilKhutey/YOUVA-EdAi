import { ForbiddenException } from '@nestjs/common';
import { TeacherAnalyticsController } from './teacher-analytics.controller';
import { TeacherAnalyticsService } from './teacher-analytics.service';

const req = (id = 't1', role = 'TEACHER') => ({ user: { id, userId: id, role } });

describe('teacher analytics are limited to the teacher\'s own students', () => {
  function setup(scoped: string[] = ['s1', 's2']) {
    const service: any = {
      getCohortOverview: jest.fn(async () => ({})), getAllStudents: jest.fn(async () => []),
      getStudentDetail: jest.fn(async () => ({})), exportStudentsCsv: jest.fn(async () => 'a,b'),
    };
    const scope: any = {
      getScopedStudentIds: jest.fn(async () => scoped),
      assertTeacherStudentScope: jest.fn(async (_t: string, s: string) => { if (!scoped.includes(s)) throw new ForbiddenException(); return true; }),
    };
    return { service, scope, ctrl: new TeacherAnalyticsController(service, scope) };
  }

  it('passes only the scoped student ids to the cohort overview, the list and the CSV export', async () => {
    const { ctrl, service, scope } = setup(['s1', 's2']);
    await ctrl.getCohortOverview(req());
    await ctrl.getAllStudents(req());
    const res: any = { set: jest.fn(), send: jest.fn() };
    await ctrl.exportCsv(req(), res);
    expect(scope.getScopedStudentIds).toHaveBeenCalledWith('t1');
    expect(service.getCohortOverview).toHaveBeenCalledWith(['s1', 's2']);
    expect(service.getAllStudents).toHaveBeenCalledWith(['s1', 's2']);
    expect(service.exportStudentsCsv).toHaveBeenCalledWith(['s1', 's2']);
  });

  it('refuses a student detail outside the teacher\'s scope and never queries it', async () => {
    const { ctrl, service } = setup(['s1']);
    await expect(ctrl.getStudentDetail(req(), 's9')).rejects.toBeInstanceOf(ForbiddenException);
    expect(service.getStudentDetail).not.toHaveBeenCalled();
    await ctrl.getStudentDetail(req(), 's1');
    expect(service.getStudentDetail).toHaveBeenCalledWith('s1');
  });

  it('the service restricts every query it runs to the given ids', async () => {
    const calls: any = {};
    const prisma: any = {
      subject: { findMany: jest.fn(async () => []) },
      userTopicMastery: { findMany: jest.fn(async (a: any) => { calls.mastery = a.where; return []; }) },
      engagementLog: { findMany: jest.fn(async (a: any) => { calls.engagement = a.where; return []; }) },
      user: {
        count: jest.fn(async (a: any) => { (calls.counts ||= []).push(a.where); return 0; }),
        findMany: jest.fn(async (a: any) => { calls.students = a.where; return []; }),
      },
    };
    const svc = new TeacherAnalyticsService(prisma);
    await svc.getCohortOverview(['s1']);
    await svc.getAllStudents(['s1']);
    expect(calls.mastery).toEqual({ userId: { in: ['s1'] } });
    expect(calls.engagement).toEqual({ userId: { in: ['s1'] } });
    expect(calls.counts.every((w: any) => w.id.in[0] === 's1')).toBe(true);
    expect(calls.students).toEqual({ role: 'STUDENT', id: { in: ['s1'] } });
  });

  it('a teacher with no students sees an empty cohort, not everyone', async () => {
    const calls: any[] = [];
    const prisma: any = {
      user: { findMany: jest.fn(async (a: any) => { calls.push(a.where); return []; }) },
    };
    await new TeacherAnalyticsService(prisma).getAllStudents([]);
    expect(calls[0]).toEqual({ role: 'STUDENT', id: { in: [] } });
  });
});
