/**
 * Usage: npx ts-node prisma/pilot-report.ts --topic "One-Step Equations" [--from 2026-10-20] [--to 2026-11-10]
 *                                          [--measures ../docs/pilot/success-measures.json] [--out ../docs/PILOT_REPORT_NUMBERS.md]
 * Builds the NUMBERS part of the pilot report from the real database. Students appear as S1, S2, ... (no names).
 * It cannot write what happened in the room: the sections at the end are for you to fill in by hand.
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import { completion, evaluateMeasures, improvement, itemAnalysis, overrideSummary, perStudent, pseudonyms, Measures } from '../src/pilot/pilot-metrics';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const pct = (v: number | null) => (v === null ? 'n/a' : `${Math.round(v * 100)}%`);

async function main() {
  const topicTitle = arg('topic');
  if (!topicTitle) throw new Error('Provide --topic "<topic title>".');
  const from = arg('from') ? new Date(`${arg('from')}T00:00:00Z`) : undefined;
  const to = arg('to') ? new Date(`${arg('to')}T23:59:59Z`) : undefined;
  const range = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
  const measures: Measures = arg('measures') ? JSON.parse(fs.readFileSync(arg('measures')!, 'utf8')) : {};

  const prisma = new PrismaClient();
  try {
    const topic = await prisma.topic.findFirst({ where: { title: topicTitle } });
    if (!topic) throw new Error(`Topic "${topicTitle}" not found.`);

    const sessionRows = await prisma.practiceSession.findMany({
      where: { topicId: topic.id, user: { role: 'STUDENT' }, ...(from || to ? { startTime: range } : {}) },
    });
    const sessions = sessionRows.map((s) => ({
      id: s.id, userId: s.userId, score: s.score, startTime: s.startTime, endTime: s.endTime,
      durationSeconds: s.durationSeconds, servedCount: s.servedQuestionIds ? JSON.parse(s.servedQuestionIds).length : 0,
    }));
    const sessionIds = sessions.map((s) => s.id);
    const userIds = [...new Set(sessions.map((s) => s.userId))];
    const answers = await prisma.userAnswer.findMany({ where: { sessionId: { in: sessionIds } } });
    const questions = await prisma.question.findMany({ where: { topicId: topic.id, source: 'BANK' } });
    const overrides = await prisma.teacherIntervention.findMany({
      where: { action: 'OVERRIDE', studentId: { in: userIds }, ...(from || to ? { createdAt: range } : {}) },
    });
    const consents = await prisma.consentRecord.findMany({ where: { studentId: { in: userIds } } });

    const names = pseudonyms(userIds);
    const comp = completion(sessions);
    const students = perStudent(sessions);
    const imp = improvement(students);
    const items = itemAnalysis(questions, answers);
    const ov = overrideSummary(overrides.map((o) => ({ teacherId: o.teacherId, studentId: o.studentId })));
    const results = evaluateMeasures(measures, { students: students.length, completionRate: comp.rate, improvedShare: imp.share, overrides: ov.count });
    const withoutConsent = userIds.filter((id) => !consents.some((c) => c.studentId === id));

    const lines: string[] = [];
    lines.push(`# Pilot numbers - ${topic.title}`);
    lines.push(`Generated ${new Date().toISOString()} from the database. Numbers only. Students are pseudonyms.`);
    lines.push(`Period: ${arg('from') ?? 'start'} to ${arg('to') ?? 'now'}\n`);
    lines.push('## Totals');
    lines.push(`- Sessions started: ${comp.started}; completed: ${comp.completed}; completion rate: ${pct(comp.rate)}`);
    lines.push(`- Students with at least one session: ${userIds.length}; with a completed session: ${students.length}`);
    lines.push(`- Answers recorded: ${answers.length}`);
    lines.push(`- Improvement (students with 2+ completed sessions): ${imp.improved} of ${imp.eligible} had a higher last score than first (${pct(imp.share)})`);
    lines.push(`- Teacher difficulty overrides: ${ov.count} (${ov.students} student(s), ${ov.teachers} teacher(s))\n`);
    lines.push('## Per student (scores are percent)');
    lines.push('| Student | Sessions | Average | First | Last | Change | Minutes |\n|---|---|---|---|---|---|---|');
    for (const s of students) lines.push(`| ${names.get(s.userId)} | ${s.sessions} | ${s.avgScore.toFixed(0)} | ${s.firstScore.toFixed(0)} | ${s.lastScore.toFixed(0)} | ${s.delta >= 0 ? '+' : ''}${s.delta.toFixed(0)} | ${s.minutes.toFixed(0)} |`);
    lines.push('\n## Questions to review with the teacher (flagged items first)');
    lines.push('| Question | Set difficulty | Attempts | % correct | Flags |\n|---|---|---|---|---|');
    for (const it of [...items].sort((a, b) => b.flags.length - a.flags.length)) lines.push(`| ${it.content.replace(/\|/g, '/')} | ${it.difficulty} | ${it.attempts} | ${pct(it.pctCorrect)} | ${it.flags.join(', ') || '-'} |`);
    lines.push('\nFlags need at least 5 attempts. check_answer_key = most students chose the same non-keyed answer: re-check the key before blaming the students.\n');
    if (results.length) {
      lines.push('## Targets written before the pilot vs actual');
      lines.push('| Measure | Target | Actual | Result |\n|---|---|---|---|');
      for (const r of results) lines.push(`| ${r.name} | ${r.target} | ${r.actual} | ${r.pass === null ? 'not measurable' : r.pass ? 'met' : 'NOT met'} |`);
      lines.push('');
    }
    lines.push('## Integrity checks');
    lines.push(`- Students with sessions but no consent record at all: ${withoutConsent.length} (should be 0)`);
    lines.push(`- Sample size: ${userIds.length} student(s). With so few, report individual stories, not percentages as proof.\n`);
    lines.push('## Write by hand (not in the database)');
    lines.push('- Incidents (content, data, wellbeing): none / describe');
    lines.push('- What broke or confused students, from the session notes');
    lines.push('- What the teacher said, in their words, including whether they would use it again');
    lines.push('- Decision and the single next thing to build, from the evidence above');

    const out = arg('out');
    if (out) { fs.writeFileSync(out, lines.join('\n') + '\n'); console.log(`Wrote ${out}`); } else console.log(lines.join('\n'));
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
