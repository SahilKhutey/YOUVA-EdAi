import { Test, TestingModule } from '@nestjs/testing';
import { PracticeService } from './practice.service';

import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

describe('PracticeService', () => {
  let service: PracticeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PracticeService,
        {
          provide: PrismaService,
          useValue: {
            topic: { findUnique: jest.fn() },
            practiceSession: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            question: { create: jest.fn(), findUnique: jest.fn() },
            userAnswer: { create: jest.fn() },
            userTopicMastery: { findUnique: jest.fn(), upsert: jest.fn() },
          },
        },
        {
          provide: AiService,
          useValue: { generateText: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<PracticeService>(PracticeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
