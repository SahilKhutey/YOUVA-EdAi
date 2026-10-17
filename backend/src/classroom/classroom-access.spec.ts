import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { LessonPlanService } from './lesson-plan.service';
import { WorksheetService } from './worksheet.service';
import { ClassroomSessionService } from './classroom-session.service';

const teacher = { id: 't1', role: 'TEACHER' };
const otherTeacher = { id: 't2', role: 'TEACHER' };
const student = { id: 's1', role: 'STUDENT' };
const admin = { id: 'a1', role: 'ADMIN' };

describe('lesson plan access', () => {
  const plans: any = { draft: { id: 'draft', teacherId: 't1', status: 'DRAFT', steps: [] }, live: { id: 'live', teacherId: 't1', status: 'PUBLISHED', steps: [] } };
  const prisma: any = { lessonPlan: {
    findUnique: jest.fn(async ({ where }: any) => plans[where.id] ?? null),
    update: jest.fn(async ({ where, data }: any) => Object.assign(plans[where.id], data)),
  } };
  const svc = new LessonPlanService(prisma, {} as any);

  it('shows a draft only to its owner or an admin, and a published plan to anyone logged in', async () => {
    await expect(svc.getLessonPlanById('draft', teacher)).resolves.toBeTruthy();
    await expect(svc.getLessonPlanById('draft', admin)).resolves.toBeTruthy();
    await expect(svc.getLessonPlanById('draft', student)).rejects.toBeInstanceOf(NotFoundException);
    await expect(svc.getLessonPlanById('draft', otherTeacher)).rejects.toBeInstanceOf(NotFoundException);
    await expect(svc.getLessonPlanById('live', student)).resolves.toBeTruthy();
  });

  it('lets only the owner or an admin publish', async () => {
    await expect(svc.publishLessonPlan('draft', student)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(svc.publishLessonPlan('draft', otherTeacher)).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.lessonPlan.update).not.toHaveBeenCalled();
    await svc.publishLessonPlan('draft', teacher);
    expect(plans.draft.status).toBe('PUBLISHED');
    await expect(svc.publishLessonPlan('missing', teacher)).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('worksheet access and submission', () => {
  const q = (id: string, extra: any = {}) => ({ id, content: `Q${id}`, type: 'MCQ', points: 1, order: 1, correctAnswer: 'A', explanation: 'because', ...extra });
  const mk = (status: string) => ({ id: 'w1', teacherId: 't1', status, questions: [q('q1'), q('q2')] });
  function setup(status = 'PUBLISHED') {
    const ws = mk(status);
    const submissions: any[] = [];
    const ai = { generateText: jest.fn(async () => '{"isCorrect":true,"feedback":"ok"}') };
    const prisma: any = {
      worksheet: { findUnique: jest.fn(async () => ws), update: jest.fn() },
      worksheetSubmission: {
        create: jest.fn(async ({ data }: any) => { const s = { id: 'sub1', studentId: data.studentId, worksheetId: data.worksheetId, worksheet: ws, answers: data.answers.create.map((a: any, i: number) => ({ id: `a${i}`, ...a, question: ws.questions.find((x) => x.id === a.questionId) })) }; submissions.push(s); return s; }),
        update: jest.fn(async ({ data }: any) => ({ id: 'sub1', ...data })),
        findUnique: jest.fn(async () => submissions[0] ?? { id: 'sub1', studentId: 's1', worksheet: ws, answers: [] }),
      },
      worksheetSubmissionAnswer: { update: jest.fn(async () => ({})) },
    };
    return { svc: new WorksheetService(prisma, ai as any), prisma, ai };
  }

  it('hides the answer key from students but not from the owning teacher', async () => {
    const { svc } = setup();
    const asStudent: any = await svc.getWorksheetById('w1', student);
    expect(asStudent.questions[0]).not.toHaveProperty('correctAnswer');
    expect(asStudent.questions[0]).not.toHaveProperty('explanation');
    const asTeacher: any = await svc.getWorksheetById('w1', teacher);
    expect(asTeacher.questions[0].correctAnswer).toBe('A');
  });

  it('does not show an unpublished worksheet to a student', async () => {
    const { svc } = setup('DRAFT');
    await expect(svc.getWorksheetById('w1', student)).rejects.toBeInstanceOf(NotFoundException);
    await expect(svc.getWorksheetById('w1', teacher)).resolves.toBeTruthy();
  });

  it('rejects submissions to unpublished worksheets, foreign questions, duplicates and empty answers', async () => {
    const draft = setup('DRAFT');
    await expect(draft.svc.submitWorksheet('s1', 'w1', { answers: [{ questionId: 'q1', studentAnswer: 'A' }] })).rejects.toBeInstanceOf(NotFoundException);
    const { svc, prisma } = setup();
    await expect(svc.submitWorksheet('s1', 'w1', { answers: [{ questionId: 'other', studentAnswer: 'A' }] })).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.submitWorksheet('s1', 'w1', { answers: [{ questionId: 'q1', studentAnswer: 'A' }, { questionId: 'q1', studentAnswer: 'B' }] })).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.submitWorksheet('s1', 'w1', { answers: [] })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.worksheetSubmission.create).not.toHaveBeenCalled();
  });

  it('grades multiple choice without the AI, and holds free-text answers for the teacher unless AI is enabled', async () => {
    delete process.env.ENABLE_AI_FEATURES;
    const { svc, prisma, ai } = setup();
    prisma.worksheet.findUnique = jest.fn(async () => ({ ...mk('PUBLISHED'), questions: [q('q1'), q('q2', { type: 'SHORT_ANSWER' })] }));
    const out: any = await svc.submitWorksheet('s1', 'w1', { answers: [{ questionId: 'q1', studentAnswer: 'A' }, { questionId: 'q2', studentAnswer: 'my own words' }] });
    expect(ai.generateText).not.toHaveBeenCalled();
    expect(out.score).toBe(50);
  });

  it('shows a submission only to its student, the worksheet\'s teacher, or an admin', async () => {
    const { svc } = setup();
    await expect(svc.getSubmission('sub1', student)).resolves.toBeTruthy();
    await expect(svc.getSubmission('sub1', teacher)).resolves.toBeTruthy();
    await expect(svc.getSubmission('sub1', admin)).resolves.toBeTruthy();
    await expect(svc.getSubmission('sub1', { id: 's2', role: 'STUDENT' })).rejects.toBeInstanceOf(NotFoundException);
    await expect(svc.getSubmission('sub1', otherTeacher)).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('classroom sessions', () => {
  function setup() {
    const session: any = { id: 'sess1', teacherId: 't1', studentId: 's1', lessonPlan: null, student: { id: 's1', name: 'Asha' }, teacher: { id: 't1', name: 'Ms Rao' } };
    const prisma: any = {
      lessonPlan: { findUnique: jest.fn(async () => ({ id: 'lp', teacherId: 't2', status: 'DRAFT' })) },
      digitalClassroomSession: { create: jest.fn(async ({ data }: any) => ({ id: 'new', ...data })), findUnique: jest.fn(async () => session) },
    };
    const scope: any = { assertTeacherStudentScope: jest.fn(async (_t: string, s: string) => { if (s !== 's1') throw new ForbiddenException(); }) };
    return { prisma, scope, svc: new ClassroomSessionService(prisma, scope) };
  }

  it('lets a teacher start a session only with a student in their scope, and writes nothing otherwise', async () => {
    const { svc, prisma } = setup();
    await expect(svc.start(teacher, { studentId: 'someone-else' })).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.digitalClassroomSession.create).not.toHaveBeenCalled();
    const ok: any = await svc.start(teacher, { studentId: 's1' });
    expect(ok).toMatchObject({ teacherId: 't1', studentId: 's1', status: 'ACTIVE' });
  });

  it('lets admins skip the scope check, and refuses another teacher\'s unpublished lesson plan', async () => {
    const { svc, scope } = setup();
    await svc.start(admin, { studentId: 'anyone' });
    expect(scope.assertTeacherStudentScope).not.toHaveBeenCalled();
    await expect(svc.start(teacher, { studentId: 's1', lessonPlanId: 'lp' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('students cannot start sessions naming other students (they are not even in scope)', async () => {
    const { svc } = setup();
    await expect(svc.start(student, { studentId: 's2' })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('shows a session only to its two participants or an admin, and returns names only', async () => {
    const { svc, prisma } = setup();
    await expect(svc.get('sess1', teacher)).resolves.toBeTruthy();
    await expect(svc.get('sess1', student)).resolves.toBeTruthy();
    await expect(svc.get('sess1', admin)).resolves.toBeTruthy();
    await expect(svc.get('sess1', { id: 's2', role: 'STUDENT' })).rejects.toBeInstanceOf(NotFoundException);
    await expect(svc.get('sess1', otherTeacher)).rejects.toBeInstanceOf(NotFoundException);
    const include = prisma.digitalClassroomSession.findUnique.mock.calls[0][0].include;
    expect(include.student).toEqual({ select: { id: true, name: true } });
    expect(include.teacher).toEqual({ select: { id: true, name: true } });
  });
});
