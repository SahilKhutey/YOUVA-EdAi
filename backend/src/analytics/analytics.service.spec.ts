import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';

import { PrismaService } from '../prisma/prisma.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: {
            learningSession: {
              count: jest.fn(),
              groupBy: jest.fn(),
            },
            practiceSession: {
              count: jest.fn(),
            },
            userTopicMastery: {
              findMany: jest.fn(),
            },
            subject: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
