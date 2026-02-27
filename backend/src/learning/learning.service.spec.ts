import { Test, TestingModule } from '@nestjs/testing';
import { LearningService } from './learning.service';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';

describe('LearningService', () => {
  let service: LearningService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LearningService,
        {
          provide: AiService,
          useValue: { generateText: jest.fn() },
        },
        {
          provide: PrismaService,
          useValue: {
            learningSession: { create: jest.fn(), update: jest.fn() },
            learningMessage: { create: jest.fn() },
            topic: { findUnique: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<LearningService>(LearningService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
