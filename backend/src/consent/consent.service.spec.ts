import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConsentService } from './consent.service';
import { ERASED, MANUAL_CHECK, lowerFirst } from './erasure-map';

/** Fake database: generic delegates keyed by lower-camel model name, recording deleteMany calls in order. */
function makeDb(opts: { users?: any[]; counts?: Record<string, number>; consents?: any[] } = {}) {
  const calls: string[] = [];
  const consents: any[] = opts.consents ?? [];
  const users: any[] = opts.users ?? [{ id: 's1', role: 'STUDENT', name: 'Asha', email: 'a@x.in', password: 'h' }];
  const delegate = (name: string) => ({
    count: jest.fn(async ({ where }: any) => (opts.counts?.[name] ?? 0)),
    deleteMany: jest.fn((args: any) => { calls.push(`delete:${name}:${JSON.stringify(args.where)}`); return Promise.resolve({ count: 1 }); }),
  });
  const base: any = {};
  for (const r of [...ERASED, ...MANUAL_CHECK]) base[lowerFirst(r.model)] = delegate(lowerFirst(r.model));
  base.userAnswer = delegate('userAnswer');
  base.user = {
    findUnique: jest.fn(async ({ where }: any) => users.find((u) => u.id === where.id) ?? null),
    update: jest.fn((args: any) => { calls.push(`anonymise:${args.where.id}`); Object.assign(users.find((u) => u.id === args.where.id), args.data); return Promise.resolve(); }),
  };
  base.consentRecord = {
    create: jest.fn(async ({ data }: any) => { const c = { id: `c${consents.length + 1}`, revokedAt: null, ...data }; consents.push(c); return c; }),
    findMany: jest.fn(async ({ where }: any) => consents.filter((c) => c.studentId === where.studentId && (where.revokedAt === null ? c.revokedAt === null : true))),
    update: jest.fn(async ({ where, data }: any) => Object.assign(consents.find((c) => c.id === where.id), data)),
    updateMany: jest.fn((args: any) => { calls.push(`consent-updateMany:${JSON.stringify(Object.keys(args.data))}`); consents.filter((c) => c.studentId === args.where.studentId).forEach((c) => Object.assign(c, args.data)); return Promise.resolve(); }),
  };
  base.$transaction = jest.fn(async (ops: any[]) => Promise.all(ops));
  return { prisma: base, calls, consents, users };
}

const input = { studentId: 's1', guardianName: 'R. Kumar', guardianRelation: 'father', formVersion: 'pilot-v1', signedAt: new Date('2026-10-01'), notes: undefined };

describe('ConsentService', () => {
  afterEach(() => { delete process.env.REQUIRE_CONSENT; });

  it('records consent, and the student then passes the gate', async () => {
    const { prisma } = makeDb();
    const svc = new ConsentService(prisma);
    await expect(svc.assertActiveConsent('s1')).rejects.toBeInstanceOf(ForbiddenException);
    await svc.record('teacher1', input);
    await expect(svc.assertActiveConsent('s1')).resolves.toBeUndefined();
  });

  it('rejects consent for unknown users, non-students, and future signing dates', async () => {
    const { prisma } = makeDb({ users: [{ id: 't1', role: 'TEACHER' }, { id: 's1', role: 'STUDENT' }] });
    const svc = new ConsentService(prisma);
    await expect(svc.record('x', { ...input, studentId: 'nobody' })).rejects.toBeInstanceOf(NotFoundException);
    await expect(svc.record('x', { ...input, studentId: 't1' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.record('x', { ...input, signedAt: new Date(Date.now() + 5 * 864e5) })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('revocation closes the gate again', async () => {
    const { prisma } = makeDb();
    const svc = new ConsentService(prisma);
    await svc.record('teacher1', input);
    expect(await svc.revoke('teacher1', 's1')).toEqual({ revoked: 1 });
    await expect(svc.assertActiveConsent('s1')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(svc.revoke('teacher1', 's1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('enforcement can be switched off for local development only via REQUIRE_CONSENT=false', async () => {
    const { prisma } = makeDb();
    const svc = new ConsentService(prisma);
    process.env.REQUIRE_CONSENT = 'false';
    await expect(svc.assertActiveConsent('s1')).resolves.toBeUndefined();
  });
});

describe('ConsentService.eraseStudent', () => {
  it('deletes answers first, then each learning table, then anonymises the account, and keeps the consent proof', async () => {
    const { prisma, calls, consents, users } = makeDb({ consents: [{ id: 'c1', studentId: 's1', revokedAt: null }] });
    const out = await new ConsentService(prisma).eraseStudent('admin1', 's1');
    expect(calls[0]).toContain('delete:userAnswer');
    const deleted = calls.filter((c) => c.startsWith('delete:')).map((c) => c.split(':')[1]);
    expect(deleted).toEqual(['userAnswer', ...ERASED.map((r) => lowerFirst(r.model))]);
    expect(deleted.indexOf('practiceSession')).toBeGreaterThan(deleted.indexOf('userAnswer')); // children before parents
    expect(users[0]).toMatchObject({ name: 'Withdrawn student', password: 'ERASED', email: 'withdrawn-s1@invalid.example' });
    expect(consents).toHaveLength(1); // proof retained
    expect(consents[0].revokedAt).toBeInstanceOf(Date);
    expect(consents[0].erasedAt).toBeInstanceOf(Date);
    expect(out.deletedFrom).toContain('PracticeSession');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('stops and deletes NOTHING when the student has data in tables the MVP does not cover', async () => {
    const { prisma, calls } = makeDb({ counts: { engagementLog: 3, feedback: 1 } });
    const err: any = await new ConsentService(prisma).eraseStudent('admin1', 's1').catch((e) => e);
    expect(err).toBeInstanceOf(ConflictException);
    expect(err.getResponse().tables).toEqual([{ model: 'EngagementLog', rows: 3 }, { model: 'Feedback', rows: 1 }]);
    expect(calls).toHaveLength(0);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('refuses non-students and unknown ids', async () => {
    const { prisma } = makeDb({ users: [{ id: 't1', role: 'TEACHER' }] });
    const svc = new ConsentService(prisma);
    await expect(svc.eraseStudent('a', 't1')).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.eraseStudent('a', 'zzz')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('ConsentService.exportStudent', () => {
  it('returns the student\'s own data, with question text, and no data from other students', async () => {
    const { prisma } = makeDb({ consents: [{ id: 'c1', studentId: 's1', guardianName: 'R. Kumar', guardianRelation: 'father', formVersion: 'pilot-v1', signedAt: new Date('2026-10-01'), revokedAt: null, erasedAt: null, createdAt: new Date() }] });
    prisma.practiceSession = { findMany: jest.fn(async ({ where }: any) => [{ startTime: new Date('2026-10-02'), endTime: new Date('2026-10-02'), score: 60, durationSeconds: 200, userId: where.userId, answers: [{ answer: '7', isCorrect: true, question: { content: 'Solve: x + 5 = 12', correctAnswer: '7' } }] }]) };
    prisma.userTopicMastery = { findMany: jest.fn(async () => [{ topicId: 't1', masteryProbability: 0.28, difficultyState: 0.5 }]) };
    prisma.userStats = { findUnique: jest.fn(async () => ({ totalXp: 20, currentLevel: 1, currentStreak: 1 })) };
    prisma.teacherIntervention = { findMany: jest.fn(async () => [{ createdAt: new Date('2026-10-03'), action: 'OVERRIDE', feedback: 'Struggling with negatives' }]) };
    const out: any = await new ConsentService(prisma).exportStudent('s1');
    expect(prisma.practiceSession.findMany.mock.calls[0][0].where).toEqual({ userId: 's1' });
    expect(out.account).toMatchObject({ name: 'Asha', email: 'a@x.in' });
    expect(out.account).not.toHaveProperty('password');
    expect(out.sessions[0].answers[0]).toEqual({ question: 'Solve: x + 5 = 12', studentAnswer: '7', correct: true, correctAnswer: '7' });
    expect(out.teacherNotes[0].note).toBe('Struggling with negatives');
    expect(out.consentRecords[0]).toMatchObject({ guardianName: 'R. Kumar', formVersion: 'pilot-v1' });
  });
  it('refuses non-students and unknown ids', async () => {
    const { prisma } = makeDb({ users: [{ id: 't1', role: 'TEACHER' }] });
    const svc = new ConsentService(prisma);
    await expect(svc.exportStudent('t1')).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.exportStudent('nope')).rejects.toBeInstanceOf(NotFoundException);
  });
});
