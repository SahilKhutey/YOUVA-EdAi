import { Test, TestingModule } from '@nestjs/testing';
import { SystemicInsightService } from '../services/systemic-insight.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('SystemicInsightService & Thresholds (LKC-12)', () => {
  let service: SystemicInsightService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      systemicInsight: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemicInsightService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SystemicInsightService>(SystemicInsightService);
  });

  it('should detect and create systemic prerequisite gap when threshold (N>=30, courses>=3) is met', async () => {
    mockPrisma.systemicInsight.create.mockImplementation((args) =>
      Promise.resolve({ id: 'ins-sys-1', ...args.data }),
    );

    const insight = await service.detectSystemicPrerequisiteGaps(
      'ko-fractions',
      ['course-101', 'course-102', 'course-103'],
      45, // N >= 30!
      'tenant-1',
    );

    expect(insight.id).toBe('ins-sys-1');
    expect(insight.type).toBe('SYSTEMIC_PREREQUISITE_GAP');
    expect(insight.affectedCourses.length).toBe(3);
    expect(insight.affectedLearnerCount).toBe(45);
    expect(insight.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('THRESHOLD CHECK: should reject systemic insight if learner count is below 30', async () => {
    await expect(
      service.detectSystemicPrerequisiteGaps(
        'ko-fractions',
        ['course-101', 'course-102', 'course-103'],
        12, // Below 30!
        'tenant-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('THRESHOLD CHECK: should reject systemic insight if affected courses is below 3', async () => {
    await expect(
      service.detectSystemicPrerequisiteGaps(
        'ko-fractions',
        ['course-101', 'course-102'], // Only 2 courses!
        40,
        'tenant-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should update insight status to CONFIRMED or RESOLVED', async () => {
    mockPrisma.systemicInsight.findFirst.mockResolvedValue({
      id: 'ins-sys-1',
      status: 'DETECTED',
    });
    mockPrisma.systemicInsight.update.mockResolvedValue({
      id: 'ins-sys-1',
      status: 'CONFIRMED',
    });

    const confirmed = await service.updateStatus('ins-sys-1', 'CONFIRMED', 'tenant-1');
    expect(confirmed.status).toBe('CONFIRMED');
  });
});
