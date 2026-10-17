import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PromptOrchestratorService } from './services/prompt-orchestrator/prompt-orchestrator.service';
import { AssessmentIntelligenceService } from '../assessment-intelligence/assessment-intelligence.service';

describe('content publishing ownership', () => {
  function setup() {
    const prisma: any = { generatedContent: {
      findUnique: jest.fn(async ({ where }: any) => (where.id === 'd1' ? { id: 'd1', teacherId: 't1' } : null)),
      update: jest.fn(async ({ data }: any) => data),
    } };
    const svc = new PromptOrchestratorService(prisma, {} as any, {} as any);
    return { prisma, svc };
  }
  it('lets only the author or an admin publish, and never writes for anyone else', async () => {
    const { svc, prisma } = setup();
    await expect(svc.publishContent('d1', { x: 1 }, { id: 't2', role: 'TEACHER' })).rejects.toBeInstanceOf(ForbiddenException);
    await expect(svc.publishContent('d1', { x: 1 }, { id: 's1', role: 'STUDENT' })).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.generatedContent.update).not.toHaveBeenCalled();
    await svc.publishContent('d1', { x: 1 }, { id: 't1', role: 'TEACHER' });
    await svc.publishContent('d1', { x: 1 }, { id: 'a1', role: 'ADMIN' });
    expect(prisma.generatedContent.update).toHaveBeenCalledTimes(2);
    await expect(svc.publishContent('nope', {}, { id: 't1', role: 'TEACHER' })).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('project evaluation ownership', () => {
  function setup() {
    const prisma: any = { assessmentProject: { findUnique: jest.fn(async () => ({ id: 'p1', userId: 's1', topic: { title: 'T' }, prompt: 'p', gradingRubric: 'r' })) } };
    const ai = { generateText: jest.fn(async () => { throw new Error('stop after the access check'); }) };
    const scope: any = { assertTeacherStudentScope: jest.fn(async (t: string) => { if (t !== 't1') throw new ForbiddenException(); }) };
    return { svc: new AssessmentIntelligenceService(prisma, ai as any, {} as any, scope), ai, scope };
  }
  it('refuses a different student and an out-of-scope teacher before anything is sent to the AI', async () => {
    const { svc, ai } = setup();
    await expect(svc.evaluateSubmission('p1', 'text', { id: 's2', role: 'STUDENT' })).rejects.toBeInstanceOf(NotFoundException);
    await expect(svc.evaluateSubmission('p1', 'text', { id: 't2', role: 'TEACHER' })).rejects.toBeInstanceOf(ForbiddenException);
    expect(ai.generateText).not.toHaveBeenCalled();
  });
  it('lets the assigned student, their teacher and an admin reach the evaluation step', async () => {
    for (const actor of [{ id: 's1', role: 'STUDENT' }, { id: 't1', role: 'TEACHER' }, { id: 'a1', role: 'ADMIN' }]) {
      const { svc, ai } = setup();
      await svc.evaluateSubmission('p1', 'text', actor).catch(() => undefined);
      expect(ai.generateText).toHaveBeenCalled();
    }
  });
});
