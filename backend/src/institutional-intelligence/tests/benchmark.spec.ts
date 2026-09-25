import { Test, TestingModule } from '@nestjs/testing';
import { BenchmarkService } from '../services/benchmark.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';

describe('BenchmarkService & Access Security (LKC-12)', () => {
  let service: BenchmarkService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      learningBenchmark: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BenchmarkService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BenchmarkService>(BenchmarkService);
  });

  it('should record an institutional benchmark with methodology version', async () => {
    mockPrisma.learningBenchmark.create.mockImplementation((args) =>
      Promise.resolve({ id: 'bm-1', ...args.data }),
    );

    const bm = await service.recordBenchmark(
      {
        metric: 'mastery_progression',
        scope: 'INSTITUTION',
        populationDefinition: { gradeLevels: ['GRADE_9', 'GRADE_10'] },
        periodStart: new Date('2026-01-01'),
        periodEnd: new Date('2026-03-31'),
        value: 0.74,
        sampleSize: 1450,
        methodologyVersion: 'BENCHMARK_MASTERY_V3',
      },
      'tenant-1',
    );

    expect(bm.id).toBe('bm-1');
    expect(bm.metric).toBe('mastery_progression');
    expect(bm.methodologyVersion).toBe('BENCHMARK_MASTERY_V3');
    expect(bm.sampleSize).toBe(1450);
  });

  it('should allow ADMIN to query institutional benchmarks', async () => {
    mockPrisma.learningBenchmark.findMany.mockResolvedValue([
      {
        id: 'bm-1',
        metric: 'mastery_progression',
        scope: 'INSTITUTION',
        populationDefinition: JSON.stringify({ gradeLevels: ['GRADE_9'] }),
        value: 0.74,
      },
    ]);

    const results = await service.queryBenchmarks(
      {
        metric: 'mastery_progression',
        scope: 'INSTITUTION',
        userRole: 'ADMIN',
      },
      'tenant-1',
    );

    expect(results.length).toBe(1);
    expect(results[0].populationDefinition.gradeLevels).toContain('GRADE_9');
  });

  it('ACCESS CONTROL: should reject STUDENT from querying institutional benchmarks', async () => {
    await expect(
      service.queryBenchmarks(
        {
          scope: 'INSTITUTION',
          userRole: 'STUDENT',
        },
        'tenant-1',
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});
