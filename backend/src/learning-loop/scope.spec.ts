import { ForbiddenException } from '@nestjs/common';
import { LearningLoopController } from './learning-loop.controller';

describe('learning loop teacher actions are limited to the teacher\'s own students', () => {
  function setup() {
    const loop: any = { getContext: jest.fn(async () => ({})), getGateStatus: jest.fn(async () => ({})) };
    const machine: any = { getEscalationStudentId: jest.fn(async () => 's-other'), transitionState: jest.fn(async () => ({})) };
    const scope: any = { assertTeacherStudentScope: jest.fn(async (_t: string, s: string) => { if (s === 's-other') throw new ForbiddenException(); return true; }) };
    const ctrl = new LearningLoopController(loop, {} as any, machine, {} as any, scope);
    return { ctrl, loop, machine, scope };
  }
  const teacher = { user: { id: 't1', role: 'TEACHER' } };
  const student = { user: { id: 's1', role: 'STUDENT' } };

  it('context: a student always gets their own; a teacher naming a student needs scope', async () => {
    const { ctrl, loop, scope } = setup();
    await ctrl.getContext(student, { topicId: 'x', studentId: 'someone-else' } as any);
    expect(loop.getContext).toHaveBeenCalledWith('s1', 'x');
    expect(scope.assertTeacherStudentScope).not.toHaveBeenCalled();
    await ctrl.getContext(teacher, { topicId: 'x', studentId: 's1' } as any);
    expect(scope.assertTeacherStudentScope).toHaveBeenCalledWith('t1', 's1');
    await expect(ctrl.getContext(teacher, { topicId: 'x', studentId: 's-other' } as any)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('gate: a teacher needs the student in scope', async () => {
    const { ctrl, loop } = setup();
    await ctrl.getGateStatus(teacher, 's1', { topicId: 't' });
    await expect(ctrl.getGateStatus(teacher, 's-other', { topicId: 't' })).rejects.toBeInstanceOf(ForbiddenException);
    expect(loop.getGateStatus).toHaveBeenCalledTimes(1);
  });

  it('resolving an escalation: a teacher cannot resolve one for a student outside their scope', async () => {
    const { ctrl, machine } = setup();
    await expect(ctrl.resolveEscalation(teacher, 'esc1', { status: 'RESOLVED', resolutionNotes: 'done' } as any)).rejects.toBeInstanceOf(ForbiddenException);
    expect(machine.transitionState).not.toHaveBeenCalled();
    machine.getEscalationStudentId.mockResolvedValueOnce('s1');
    await ctrl.resolveEscalation(teacher, 'esc1', { status: 'RESOLVED', resolutionNotes: 'done' } as any);
    expect(machine.transitionState).toHaveBeenCalledTimes(1);
  });
});
