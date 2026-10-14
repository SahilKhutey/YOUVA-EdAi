/** Pure functions that turn raw pilot rows into honest numbers. No database access, no names. */
export interface SessionRow { id: string; userId: string; score: number | null; startTime: Date; endTime: Date | null; durationSeconds: number | null; servedCount: number }
export interface AnswerRow { sessionId: string; questionId: string; answer: string; isCorrect: boolean }
export interface QuestionRow { id: string; content: string; difficulty: number; correctAnswer: string }
export interface OverrideRow { teacherId: string; studentId: string }

export function pseudonyms(userIds: string[]): Map<string, string> {
  const map = new Map<string, string>();
  [...new Set(userIds)].sort().forEach((id, i) => map.set(id, `S${i + 1}`));
  return map;
}

export function completion(sessions: SessionRow[]) {
  const started = sessions.length;
  const completed = sessions.filter((s) => s.endTime !== null && s.score !== null).length;
  return { started, completed, rate: started === 0 ? null : completed / started };
}

export interface StudentSummary { userId: string; sessions: number; avgScore: number; firstScore: number; lastScore: number; delta: number; minutes: number }

export function perStudent(sessions: SessionRow[]): StudentSummary[] {
  const byUser = new Map<string, SessionRow[]>();
  for (const s of sessions) {
    if (s.endTime === null || s.score === null) continue;
    byUser.set(s.userId, [...(byUser.get(s.userId) ?? []), s]);
  }
  return [...byUser.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([userId, rows]) => {
    rows.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    const scores = rows.map((r) => r.score as number);
    return {
      userId,
      sessions: rows.length,
      avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      firstScore: scores[0],
      lastScore: scores[scores.length - 1],
      delta: scores[scores.length - 1] - scores[0],
      minutes: rows.reduce((a, r) => a + (r.durationSeconds ?? 0), 0) / 60,
    };
  });
}

/** Only students with 2+ completed sessions can show change. */
export function improvement(students: StudentSummary[]) {
  const eligible = students.filter((s) => s.sessions >= 2);
  const improved = eligible.filter((s) => s.delta > 0).length;
  return { eligible: eligible.length, improved, share: eligible.length === 0 ? null : improved / eligible.length };
}

export interface ItemStat {
  id: string; content: string; difficulty: number; attempts: number; pctCorrect: number | null;
  distribution: Record<string, number>; flags: string[];
}

/** Flags items worth a teacher's second look. Thresholds are deliberately simple and need >= 5 attempts. */
export function itemAnalysis(questions: QuestionRow[], answers: AnswerRow[]): ItemStat[] {
  return questions.map((q) => {
    const mine = answers.filter((a) => a.questionId === q.id);
    const distribution: Record<string, number> = {};
    for (const a of mine) distribution[a.answer] = (distribution[a.answer] ?? 0) + 1;
    const attempts = mine.length;
    const correct = mine.filter((a) => a.isCorrect).length;
    const pctCorrect = attempts === 0 ? null : correct / attempts;
    const flags: string[] = [];
    if (attempts >= 5 && pctCorrect !== null) {
      const topAnswer = Object.entries(distribution).sort((a, b) => b[1] - a[1])[0];
      if (topAnswer[0] !== q.correctAnswer && topAnswer[1] / attempts > 0.5 && pctCorrect < 0.25) flags.push('check_answer_key');
      else if (pctCorrect < 0.2) flags.push('very_hard');
      if (pctCorrect > 0.95) flags.push('very_easy');
    }
    return { id: q.id, content: q.content, difficulty: q.difficulty, attempts, pctCorrect, distribution, flags };
  });
}

export function overrideSummary(rows: OverrideRow[]) {
  return { count: rows.length, students: new Set(rows.map((r) => r.studentId)).size, teachers: new Set(rows.map((r) => r.teacherId)).size };
}

export interface Measures { minStudentsWithSession?: number; minCompletionRate?: number; minImprovedShare?: number; minOverrides?: number }
export interface MeasureResult { name: string; target: string; actual: string; pass: boolean | null }

/** Compares real numbers with targets that were written down before the pilot. null = not measurable yet. */
export function evaluateMeasures(m: Measures, s: { students: number; completionRate: number | null; improvedShare: number | null; overrides: number }): MeasureResult[] {
  const out: MeasureResult[] = [];
  const pct = (v: number | null) => (v === null ? 'n/a' : `${Math.round(v * 100)}%`);
  if (m.minStudentsWithSession !== undefined) out.push({ name: 'Students with a completed session', target: `>= ${m.minStudentsWithSession}`, actual: String(s.students), pass: s.students >= m.minStudentsWithSession });
  if (m.minCompletionRate !== undefined) out.push({ name: 'Quiz completion rate', target: `>= ${pct(m.minCompletionRate)}`, actual: pct(s.completionRate), pass: s.completionRate === null ? null : s.completionRate >= m.minCompletionRate });
  if (m.minImprovedShare !== undefined) out.push({ name: 'Students whose last score beat their first', target: `>= ${pct(m.minImprovedShare)}`, actual: pct(s.improvedShare), pass: s.improvedShare === null ? null : s.improvedShare >= m.minImprovedShare });
  if (m.minOverrides !== undefined) out.push({ name: 'Teacher difficulty overrides used', target: `>= ${m.minOverrides}`, actual: String(s.overrides), pass: s.overrides >= m.minOverrides });
  return out;
}
