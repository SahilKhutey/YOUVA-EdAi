import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';

import { PrismaService } from '../prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: {
            userTopicMastery: { findMany: jest.fn() },
            learningSession: { findMany: jest.fn(), count: jest.fn() },
            practiceSession: { findMany: jest.fn(), count: jest.fn() },
            subject: { findMany: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
