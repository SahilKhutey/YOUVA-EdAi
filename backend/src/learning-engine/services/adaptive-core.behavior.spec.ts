import { BktService } from './bkt.service';
import { RlDifficultyService } from './rl-difficulty.service';

/** In-memory stand-in for the one Prisma delegate these services use. */
function fakePrisma(initial?: { masteryProbability: number; difficultyState: number }) {
  let rec: any = initial ? { id: 'r1', userId: 'u', topicId: 't', ...initial } : null;
  return {
    userTopicMastery: {
      findUnique: jest.fn(async () => rec),
      create: jest.fn(async ({ data }: any) => (rec = { id: 'r1', ...data })),
      update: jest.fn(async ({ data }: any) => (rec = { ...rec, ...data })),
    },
    get record() { return rec; },
  } as any;
}

describe('BktService (heuristic mastery update) - real behavior', () => {
  it('starts an unseen topic at 0.1 and raises it to 0.28 after one correct answer', async () => {
    const p = fakePrisma();
    const out = await new BktService(p).updateMastery('u', 't', true);
    expect(out).toBeCloseTo(0.28, 5);
    expect(p.record.masteryProbability).toBeCloseTo(0.28, 5);
  });

  it('lowers mastery after an incorrect answer (0.1 -> 0.07)', async () => {
    const out = await new BktService(fakePrisma()).updateMastery('u', 't', false);
    expect(out).toBeCloseTo(0.07, 5);
  });

  it('drops faster than it rises (penalty 0.3x vs gain 0.2x of the gap)', async () => {
    const up = await new BktService(fakePrisma({ masteryProbability: 0.5, difficultyState: 0.5 })).updateMastery('u', 't', true);
    const down = await new BktService(fakePrisma({ masteryProbability: 0.5, difficultyState: 0.5 })).updateMastery('u', 't', false);
    expect(up - 0.5).toBeCloseTo(0.1, 5);
    expect(0.5 - down).toBeCloseTo(0.15, 5);
  });

  it('never reaches 1.0 or 0.0 (clamped to [0.01, 0.99])', async () => {
    const hi = await new BktService(fakePrisma({ masteryProbability: 0.989, difficultyState: 0.5 })).updateMastery('u', 't', true);
    const lo = await new BktService(fakePrisma({ masteryProbability: 0.011, difficultyState: 0.5 })).updateMastery('u', 't', false);
    expect(hi).toBeLessThanOrEqual(0.99);
    expect(lo).toBeGreaterThanOrEqual(0.01);
  });

  it('converges toward mastery over repeated correct answers', async () => {
    const p = fakePrisma();
    const svc = new BktService(p);
    let v = 0;
    for (let i = 0; i < 10; i++) v = await svc.updateMastery('u', 't', true);
    expect(v).toBeGreaterThan(0.8);
  });
});

describe('RlDifficultyService - real behavior', () => {
  it('defaults to medium difficulty (0.5) when there is no history', async () => {
    expect(await new RlDifficultyService(fakePrisma()).getOptimalDifficulty('u', 't')).toBe(0.5);
  });

  it('raises target difficulty more for a hard question answered correctly (0.5 -> 0.595)', async () => {
    const out = await new RlDifficultyService(fakePrisma({ masteryProbability: 0.1, difficultyState: 0.5 })).updateDifficultyState('u', 't', true, 0.9);
    expect(out).toBeCloseTo(0.595, 5);
  });

  it('lowers target difficulty more for an easy question answered wrongly (0.5 -> 0.405)', async () => {
    const out = await new RlDifficultyService(fakePrisma({ masteryProbability: 0.1, difficultyState: 0.5 })).updateDifficultyState('u', 't', false, 0.1);
    expect(out).toBeCloseTo(0.405, 5);
  });

  it('stays within [0.1, 1.0]', async () => {
    const hi = await new RlDifficultyService(fakePrisma({ masteryProbability: 0.1, difficultyState: 0.99 })).updateDifficultyState('u', 't', true, 1);
    const lo = await new RlDifficultyService(fakePrisma({ masteryProbability: 0.1, difficultyState: 0.11 })).updateDifficultyState('u', 't', false, 0);
    expect(hi).toBeLessThanOrEqual(1.0);
    expect(lo).toBeGreaterThanOrEqual(0.1);
  });
});
