import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';

describe('P3 AuditService', () => {
  let service: AuditService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      auditEvent: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  describe('Privileged Audit Logging', () => {
    it('✓ records successful privileged operations', async () => {
      prisma.auditEvent.create.mockResolvedValue({ id: 'aud-1' });

      await service.record({
        actorId: 'teacher-1',
        actorRole: 'TEACHER',
        action: 'INTERVENTION_RESOLVE',
        resource: 'SafetyEscalation',
        resourceId: 'esc-1',
        outcome: 'SUCCESS',
        metadata: { notes: 'Counselor contact completed' },
      });

      expect(prisma.auditEvent.create).toHaveBeenCalledWith({
        data: {
          actorId: 'teacher-1',
          actorRole: 'TEACHER',
          action: 'INTERVENTION_RESOLVE',
          resource: 'SafetyEscalation',
          resourceId: 'esc-1',
          outcome: 'SUCCESS',
          metadata: JSON.stringify({ notes: 'Counselor contact completed' }),
        },
      });
    });

    it('✓ records denied access operations for threat telemetry', async () => {
      prisma.auditEvent.create.mockResolvedValue({ id: 'aud-2' });

      await service.record({
        actorId: 'student-1',
        actorRole: 'STUDENT',
        action: 'PARENT_DATA_ACCESS',
        resource: 'Student',
        resourceId: 'student-2',
        outcome: 'DENIED',
      });

      expect(prisma.auditEvent.create).toHaveBeenCalledWith({
        data: {
          actorId: 'student-1',
          actorRole: 'STUDENT',
          action: 'PARENT_DATA_ACCESS',
          resource: 'Student',
          resourceId: 'student-2',
          outcome: 'DENIED',
          metadata: undefined,
        },
      });
    });

    it('✓ retrieves audit events with actor and resource filtering', async () => {
      prisma.auditEvent.findMany.mockResolvedValue([
        { id: 'aud-1', action: 'CONSENT_GRANTED', outcome: 'SUCCESS' },
      ]);

      const events = await service.getEvents({
        actorId: 'parent-1',
        resource: 'ConsentRecord',
        limit: 10,
      });

      expect(events).toHaveLength(1);
      expect(prisma.auditEvent.findMany).toHaveBeenCalledWith({
        where: {
          actorId: 'parent-1',
          resource: 'ConsentRecord',
          resourceId: undefined,
          action: undefined,
          outcome: undefined,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: expect.any(Object),
      });
    });
  });
});
