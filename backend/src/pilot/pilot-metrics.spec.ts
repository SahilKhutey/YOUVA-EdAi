import { AnswerRow, QuestionRow, SessionRow, completion, evaluateMeasures, improvement, itemAnalysis, overrideSummary, perStudent, pseudonyms } from './pilot-metrics';

const d = (day: number) => new Date(`2026-10-${String(day).padStart(2, '0')}T10:00:00Z`);
const sess = (id: string, userId: string, day: number, score: number | null, secs = 300): SessionRow => ({ id, userId, score, startTime: d(day), endTime: score === null ? null : d(day), durationSeconds: secs, servedCount: 5 });

describe('pilot metrics', () => {
  it('pseudonyms are stable, sorted by id, and contain no ids', () => {
    const m = pseudonyms(['zed', 'abe', 'abe', 'mid']);
    expect([...m.entries()]).toEqual([['abe', 'S1'], ['mid', 'S2'], ['zed', 'S3']]);
  });

  it('completion rate counts started vs finished-and-scored sessions', () => {
    expect(completion([sess('1', 'a', 1, 80), sess('2', 'a', 2, null), sess('3', 'b', 1, 40)])).toEqual({ started: 3, completed: 2, rate: 2 / 3 });
    expect(completion([]).rate).toBeNull();
  });

  it('per-student summary orders sessions by time and reports first, last, delta, minutes', () => {
    const rows = [sess('2', 'a', 5, 80, 600), sess('1', 'a', 1, 40, 300), sess('3', 'b', 2, 60, 120), sess('4', 'a', 9, null)];
    const [a, b] = perStudent(rows);
    expect(a).toMatchObject({ userId: 'a', sessions: 2, avgScore: 60, firstScore: 40, lastScore: 80, delta: 40, minutes: 15 });
    expect(b).toMatchObject({ userId: 'b', sessions: 1, delta: 0 });
  });

  it('improvement only counts students with 2+ completed sessions', () => {
    const students = perStudent([sess('1', 'a', 1, 40), sess('2', 'a', 2, 80), sess('3', 'b', 1, 90), sess('4', 'c', 1, 50), sess('5', 'c', 2, 30)]);
    expect(improvement(students)).toEqual({ eligible: 2, improved: 1, share: 0.5 });
    expect(improvement(perStudent([sess('1', 'z', 1, 50)])).share).toBeNull();
  });

  describe('item analysis', () => {
    const q = (id: string, correctAnswer = 'A'): QuestionRow => ({ id, content: `Q ${id}`, difficulty: 0.5, correctAnswer });
    const ans = (questionId: string, answer: string, isCorrect: boolean, n: number): AnswerRow[] => Array.from({ length: n }, () => ({ sessionId: 's', questionId, answer, isCorrect }));

    it('flags a probable wrong answer key when most students agree on a different answer', () => {
      const [s] = itemAnalysis([q('q1')], [...ans('q1', 'B', false, 6), ...ans('q1', 'A', true, 1)]);
      expect(s.attempts).toBe(7);
      expect(s.flags).toEqual(['check_answer_key']);
      expect(s.distribution).toEqual({ B: 6, A: 1 });
    });
    it('flags very hard and very easy items, but only with at least 5 attempts', () => {
      const out = itemAnalysis([q('hard'), q('easy'), q('few')], [
        ...ans('hard', 'C', false, 2), ...ans('hard', 'B', false, 2), ...ans('hard', 'D', false, 1),
        ...ans('easy', 'A', true, 20),
        ...ans('few', 'B', false, 4),
      ]);
      expect(out.find((o) => o.id === 'hard')!.flags).toEqual(['very_hard']);
      expect(out.find((o) => o.id === 'easy')!.flags).toEqual(['very_easy']);
      expect(out.find((o) => o.id === 'few')!.flags).toEqual([]);
    });
    it('reports null percent for items nobody answered', () => {
      expect(itemAnalysis([q('x')], [])[0]).toMatchObject({ attempts: 0, pctCorrect: null, flags: [] });
    });
  });

  it('summarises overrides by distinct students and teachers', () => {
    expect(overrideSummary([{ teacherId: 't', studentId: 'a' }, { teacherId: 't', studentId: 'a' }, { teacherId: 't', studentId: 'b' }])).toEqual({ count: 3, students: 2, teachers: 1 });
  });

  it('evaluates pre-written targets, and reports "not measurable" instead of a false pass or fail', () => {
    const r = evaluateMeasures(
      { minStudentsWithSession: 3, minCompletionRate: 0.8, minImprovedShare: 0.5, minOverrides: 1 },
      { students: 4, completionRate: 0.75, improvedShare: null, overrides: 1 },
    );
    expect(r.map((x) => x.pass)).toEqual([true, false, null, true]);
    expect(r[1].actual).toBe('75%');
  });
});
