import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';

function makeService(opts: { enrollments?: { classId: string; studentId: string }[]; stats?: any[] } = {}) {
  const enrollments = opts.enrollments ?? [];
  const seen: any = {};
  const prisma: any = {
    teacherClassEnrollment: {
      findMany: jest.fn(async ({ where }: any) => {
        if (where.studentId) return enrollments.filter((e) => e.studentId === where.studentId).map((e) => ({ classId: e.classId }));
        return enrollments.filter((e) => where.classId.in.includes(e.classId)).map((e) => ({ studentId: e.studentId }));
      }),
    },
    userStats: { findMany: jest.fn(async (args: any) => { seen.args = args; return opts.stats ?? []; }) },
  };
  return { svc: new GamificationService(prisma, {} as any), prisma, seen };
}

describe('leaderboard privacy', () => {
  it('classmates are the caller plus students who share a class; a student in no class sees only themselves', async () => {
    const { svc } = makeService({ enrollments: [
      { classId: 'c1', studentId: 'me' }, { classId: 'c1', studentId: 'a' }, { classId: 'c2', studentId: 'b' },
    ] });
    expect((await svc.getClassmateIds('me')).sort()).toEqual(['a', 'me']);
    expect(await svc.getClassmateIds('loner')).toEqual(['loner']);
  });

  it('ranks only the visible students, only students, and never returns emails or user ids', async () => {
    const { svc, seen } = makeService({ stats: [
      { userId: 'me', totalXp: 50, currentLevel: 2, currentStreak: 3, user: { name: 'Asha' } },
      { userId: 'a', totalXp: 40, currentLevel: 1, currentStreak: 0, user: { name: null } },
    ] });
    const out: any[] = await svc.getLeaderboard('me', ['me', 'a']);
    expect(seen.args.where).toEqual({ userId: { in: ['me', 'a'] }, user: { role: 'STUDENT' } });
    expect(seen.args.include.user.select).toEqual({ name: true }); // email and id are never selected
    expect(out).toEqual([
      { rank: 1, name: 'Asha', totalXp: 50, currentLevel: 2, currentStreak: 3, isCurrentUser: true },
      { rank: 2, name: 'Student', totalXp: 40, currentLevel: 1, currentStreak: 0, isCurrentUser: false },
    ]);
    expect(JSON.stringify(out)).not.toMatch(/@|userId/);
  });

  it('the controller shows a student their classmates and a teacher their own students', async () => {
    const service: any = { getClassmateIds: jest.fn(async () => ['me', 'a']), getLeaderboard: jest.fn(async () => []) };
    const scope: any = { getScopedStudentIds: jest.fn(async () => ['s1', 's2']) };
    const ctrl = new GamificationController(service, scope);
    await ctrl.getLeaderboard({ user: { userId: 'me', id: 'me', role: 'STUDENT' } });
    expect(service.getLeaderboard).toHaveBeenLastCalledWith('me', ['me', 'a']);
    await ctrl.getLeaderboard({ user: { userId: 't1', id: 't1', role: 'TEACHER' } });
    expect(scope.getScopedStudentIds).toHaveBeenCalledWith('t1');
    expect(service.getLeaderboard).toHaveBeenLastCalledWith('t1', ['s1', 's2']);
  });
});
