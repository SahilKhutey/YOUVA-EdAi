import { BadRequestException, ConflictException, ForbiddenException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PracticeService } from './practice.service';
import { BktService } from '../learning-engine/services/bkt.service';
import { RlDifficultyService } from '../learning-engine/services/rl-difficulty.service';

/** Minimal in-memory database covering exactly the calls the practice flow makes. */
function makeDb(questions: any[]) {
  const db: any = { questions: [...questions], sessions: [] as any[], answers: [] as any[], mastery: [] as any[], seq: 0 };
  const id = (p: string) => `${p}${++db.seq}`;
  db.prisma = {
    topic: { findUnique: async ({ where }: any) => (where.id === 'topic1' ? { id: 'topic1', title: 'One-Step Equations', description: '' } : null) },
    question: {
      findMany: async ({ where }: any) => db.questions.filter((q: any) => q.topicId === where.topicId && q.source === where.source),
      findUnique: async ({ where }: any) => db.questions.find((q: any) => q.id === where.id) ?? null,
      create: async ({ data }: any) => { const q = { id: id('qa'), ...data }; db.questions.push(q); return q; },
    },
    practiceSession: {
      create: async ({ data }: any) => { const s = { id: id('s'), endTime: null, startTime: new Date(Date.now() - 90_000), ...data }; db.sessions.push(s); return s; },
      findUnique: async ({ where }: any) => db.sessions.find((s: any) => s.id === where.id) ?? null,
      update: async ({ where, data }: any) => Object.assign(db.sessions.find((s: any) => s.id === where.id), data),
    },
    userAnswer: {
      create: async ({ data }: any) => { db.answers.push(data); return data; },
      findMany: async ({ where }: any) => db.answers.filter((a: any) => db.sessions.find((s: any) => s.id === a.sessionId && s.userId === where.session.userId && s.topicId === where.session.topicId)).map((a: any) => ({ questionId: a.questionId })),
    },
    userTopicMastery: {
      findUnique: async ({ where }: any) => db.mastery.find((m: any) => m.userId === where.userId_topicId.userId && m.topicId === where.userId_topicId.topicId) ?? null,
      create: async ({ data }: any) => { const m = { id: id('m'), ...data }; db.mastery.push(m); return m; },
      update: async ({ where, data }: any) => Object.assign(db.mastery.find((m: any) => m.id === where.id), data),
    },
  };
  return db;
}

const bank = (n: number, difficulty: number, source = 'BANK') => ({
  id: `b${n}`, topicId: 'topic1', content: `Q${n}`, difficulty, type: 'MCQ', source,
  options: JSON.stringify(['A', 'B', 'C', 'D']), correctAnswer: 'A', explanation: `E${n}`,
});

function build(questions: any[]) {
  const db = makeDb(questions);
  const ai = { generateQuiz: jest.fn() };
  const gam = { addXp: jest.fn(), updateStreak: jest.fn() };
  const consent = { assertActiveConsent: jest.fn(async () => undefined) };
  const svc = new PracticeService(db.prisma, ai as any, gam as any, new BktService(db.prisma), new RlDifficultyService(db.prisma), consent as any);
  return { db, ai, gam, svc, consent };
}

describe('PracticeService - reviewed item bank flow', () => {
  beforeEach(() => { delete process.env.QUESTION_SOURCE; });

  it('serves only BANK questions, nearest to the target difficulty, and never calls the AI', async () => {
    const items = [bank(1, 0.2), bank(2, 0.5), bank(3, 0.5), bank(4, 0.5), bank(5, 0.5), bank(6, 0.5), bank(7, 0.9), bank(8, 0.5, 'AI')];
    const { svc, ai } = build(items);
    const quiz = await svc.generateQuiz('u1', 'topic1');
    const ids = quiz.questions.map((q) => q.id);
    expect(ids).toHaveLength(5);
    expect(ids).not.toContain('b8');   // AI-sourced item excluded
    expect(ids).not.toContain('b7');   // farthest from 0.5 target
    expect(ids).not.toContain('b1');
    expect(ai.generateQuiz).not.toHaveBeenCalled();
    expect(quiz.questions[0].options).toEqual(['A', 'B', 'C', 'D']);
  });

  it('throws NotFound (no fake questions) when the topic has no reviewed items', async () => {
    const { svc } = build([bank(1, 0.5, 'AI')]);
    await expect(svc.generateQuiz('u1', 'topic1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('AI mode failure raises ServiceUnavailable instead of serving mock questions', async () => {
    process.env.QUESTION_SOURCE = 'AI';
    const { svc, ai, db } = build([]);
    ai.generateQuiz.mockRejectedValue(new Error('no key'));
    await expect(svc.generateQuiz('u1', 'topic1')).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(db.sessions).toHaveLength(0);
  });

  it('rejects empty, foreign, duplicate and repeated submissions', async () => {
    const { svc } = build([bank(1, 0.5), bank(2, 0.5)]);
    const quiz = await svc.generateQuiz('u1', 'topic1');
    await expect(svc.submitQuiz(quiz.sessionId, 'u1', [])).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.submitQuiz(quiz.sessionId, 'u1', [{ questionId: 'not-served', answer: 'A' }])).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.submitQuiz(quiz.sessionId, 'u1', [{ questionId: 'b1', answer: 'A' }, { questionId: 'b1', answer: 'A' }])).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.submitQuiz(quiz.sessionId, 'someone-else', [{ questionId: 'b1', answer: 'A' }])).rejects.toBeInstanceOf(NotFoundException);
    await svc.submitQuiz(quiz.sessionId, 'u1', [{ questionId: 'b1', answer: 'A' }]);
    await expect(svc.submitQuiz(quiz.sessionId, 'u1', [{ questionId: 'b2', answer: 'A' }])).rejects.toBeInstanceOf(ConflictException);
  });

  it('scores against everything served: skipping questions cannot inflate the score', async () => {
    const { svc, gam } = build([bank(1, 0.5), bank(2, 0.5), bank(3, 0.5), bank(4, 0.5)]);
    const quiz = await svc.generateQuiz('u1', 'topic1');
    const res = await svc.submitQuiz(quiz.sessionId, 'u1', [{ questionId: 'b1', answer: 'A' }]);
    expect(res.total).toBe(4);
    expect(res.unanswered).toBe(3);
    expect(res.score).toBe(25);
    expect(gam.addXp).toHaveBeenCalledTimes(1);
  });

  it('full loop: correct answers raise mastery, and the next quiz moves toward harder items', async () => {
    const items = [bank(1, 0.2), bank(2, 0.2), bank(3, 0.5), bank(4, 0.5), bank(5, 0.8), bank(6, 0.8), bank(7, 0.9), bank(8, 0.95)];
    const { svc, db } = build(items);
    const first = await svc.generateQuiz('u1', 'topic1');
    const res = await svc.submitQuiz(first.sessionId, 'u1', first.questions.map((q) => ({ questionId: q.id, answer: 'A' })));
    expect(res.score).toBe(100);
    const m = db.mastery[0];
    expect(m.masteryProbability).toBeGreaterThan(0.5);
    expect(m.difficultyState).toBeGreaterThan(0.5);
    const second = await svc.generateQuiz('u1', 'topic1');
    expect(second.questions.some((q) => ['b7', 'b8', 'b5', 'b6'].includes(q.id))).toBe(true); // unseen, harder items appear
    const unseen = items.map((i) => i.id).filter((id) => !first.questions.some((f) => f.id === id));
    const secondIds = second.questions.map((q) => q.id);
    expect(unseen.every((id) => secondIds.includes(id))).toBe(true); // every unseen item is served before any repeat
  });

  it('blocks a student without active consent and creates no session', async () => {
    const { svc, consent, db } = build([bank(1, 0.5)]);
    consent.assertActiveConsent.mockRejectedValue(new ForbiddenException());
    await expect(svc.generateQuiz('u1', 'topic1', 'STUDENT')).rejects.toBeInstanceOf(ForbiddenException);
    expect(db.sessions).toHaveLength(0);
  });

  it('lets a teacher or admin preview a quiz without a student consent record', async () => {
    const { svc, consent } = build([bank(1, 0.5)]);
    await svc.generateQuiz('t1', 'topic1', 'TEACHER');
    await svc.generateQuiz('a1', 'topic1', 'ADMIN');
    expect(consent.assertActiveConsent).not.toHaveBeenCalled();
  });

  it('records how long the session took (needed for pilot minutes)', async () => {
    const { svc, db } = build([bank(1, 0.5)]);
    const quiz = await svc.generateQuiz('u1', 'topic1');
    await svc.submitQuiz(quiz.sessionId, 'u1', [{ questionId: 'b1', answer: 'A' }]);
    expect(db.sessions[0].durationSeconds).toBeGreaterThanOrEqual(90);
    expect(db.sessions[0].durationSeconds).toBeLessThan(120);
  });
});
