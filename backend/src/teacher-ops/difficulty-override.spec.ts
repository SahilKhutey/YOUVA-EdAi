import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { TeacherDifficultyOverrideService } from './services/teacher-difficulty-override.service';
import { RlDifficultyService } from '../learning-engine/services/rl-difficulty.service';

function setup(allowed = true, existing: any = null) {
  const state: any = { mastery: existing, interventions: [] as any[] };
  const prisma: any = {
    userTopicMastery: {
      findUnique: jest.fn(async () => state.mastery),
      update: jest.fn(async ({ data }: any) => Object.assign(state.mastery, data)),
      create: jest.fn(async ({ data }: any) => (state.mastery = { id: 'm1', ...data })),
    },
    teacherIntervention: { create: jest.fn(async ({ data }: any) => { state.interventions.push(data); return data; }) },
  };
  const scope: any = { assertTeacherStudentScope: jest.fn(async () => { if (!allowed) throw new ForbiddenException(); return true; }) };
  return { state, prisma, svc: new TeacherDifficultyOverrideService(prisma, scope), rl: new RlDifficultyService(prisma) };
}

describe('Teacher difficulty override', () => {
  it('changes the value the next quiz reads, and records an audit entry', async () => {
    const { svc, rl, state } = setup(true, { id: 'm1', userId: 's1', topicId: 't1', difficultyState: 0.8 });
    const out = await svc.override('teacher1', 's1', 't1', 0.3, 'Student is struggling with negatives');
    expect(out).toEqual({ studentId: 's1', topicId: 't1', previous: 0.8, current: 0.3 });
    expect(await rl.getOptimalDifficulty('s1', 't1')).toBe(0.3);
    expect(state.interventions).toHaveLength(1);
    expect(state.interventions[0]).toMatchObject({ teacherId: 'teacher1', studentId: 's1', action: 'OVERRIDE', status: 'RESOLVED' });
    expect(JSON.parse(state.interventions[0].overrideDetails)).toMatchObject({ type: 'DIFFICULTY', previous: 0.8, forced: 0.3 });
  });

  it('creates a mastery record when the student has none yet', async () => {
    const { svc, prisma } = setup(true, null);
    const out = await svc.override('teacher1', 's1', 't1', 0.4, 'Starting easier');
    expect(out.previous).toBe(0.5);
    expect(prisma.userTopicMastery.create).toHaveBeenCalled();
  });

  it('refuses a teacher outside the student scope and writes nothing', async () => {
    const { svc, prisma } = setup(false);
    await expect(svc.override('teacher2', 's1', 't1', 0.4, 'x')).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.teacherIntervention.create).not.toHaveBeenCalled();
  });

  it('rejects out-of-range values and missing reasons', async () => {
    const { svc } = setup();
    await expect(svc.override('t', 's', 'x', 1.5, 'r')).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.override('t', 's', 'x', 0.05, 'r')).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.override('t', 's', 'x', 0.5, '  ')).rejects.toBeInstanceOf(BadRequestException);
  });
});
