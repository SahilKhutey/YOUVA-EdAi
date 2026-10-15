import { ForbiddenException } from '@nestjs/common';
import { EdgeSyncService } from './edge-sync.service';
import { EdgeSyncController } from './edge-sync.controller';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { ROLES_KEY } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';

const payload = (userId: string) => Buffer.from(JSON.stringify({
  userId, localTimestamp: '2026-10-20T10:00:00Z',
  offlineEvents: [{ type: 'STUDY_SESSION_COMPLETE', data: { topicId: 't1' } }],
})).toString('base64');

describe('edge sync access control', () => {
  const prisma: any = { learningSession: { create: jest.fn(async () => ({})) }, cognitiveStateLog: { create: jest.fn() } };
  beforeEach(() => jest.clearAllMocks());

  it('lets a user sync their own events', async () => {
    const out: any = await new EdgeSyncService(prisma).processIntercalatedSync(payload('s1'), 's1');
    expect(out.eventsProcessed).toBe(1);
    expect(prisma.learningSession.create).toHaveBeenCalledTimes(1);
  });

  it('refuses a payload naming a different user, and writes nothing', async () => {
    await expect(new EdgeSyncService(prisma).processIntercalatedSync(payload('victim'), 'attacker')).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.learningSession.create).not.toHaveBeenCalled();
    expect(prisma.cognitiveStateLog.create).not.toHaveBeenCalled();
  });

  it('requires login on the whole controller, and teacher/admin for the answer-bearing curriculum pack', () => {
    const guards = Reflect.getMetadata('__guards__', EdgeSyncController);
    expect(guards).toEqual(expect.arrayContaining([JwtAuthGuard, RolesGuard]));
    expect(Reflect.getMetadata(ROLES_KEY, EdgeSyncController.prototype.getCurriculumPack)).toEqual([Role.TEACHER, Role.ADMIN]);
  });
});
