import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { PrismaService } from '../prisma/prisma.service';

describe('P5 HealthService & Readiness Probes', () => {
  let service: HealthService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      $queryRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('✓ reports liveness probe status alive', () => {
    const liveness = service.liveness();
    expect(liveness.status).toBe('alive');
    expect(liveness.timestamp).toBeDefined();
  });

  it('✓ reports ready when database ping succeeds', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    const readiness = await service.readiness();
    expect(readiness.status).toBe('ready');
    expect(readiness.database.status).toBe('up');
  });

  it('✓ reports not_ready when database connection fails', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('DB connection refused'));

    const readiness = await service.readiness();
    expect(readiness.status).toBe('not_ready');
    expect(readiness.database.status).toBe('down');
  });
});
