import { Test, TestingModule } from '@nestjs/testing';
import { PracticeService } from './practice.service';

import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { GamificationService } from '../gamification/gamification.service';
import { BktService } from '../learning-engine/services/bkt.service';
import { RlDifficultyService } from '../learning-engine/services/rl-difficulty.service';
import { ConsentService } from '../consent/consent.service';
import { TelemetryService } from '../telemetry/telemetry.service';

describe('PracticeService', () => {
  let service: PracticeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PracticeService,
        {
          provide: PrismaService,
          useValue: {
            user: { findUnique: jest.fn() },
            parentStudent: { findFirst: jest.fn() },
            consentRecord: { findFirst: jest.fn() },
            topic: { findUnique: jest.fn() },
            practiceSession: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            question: { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
            userAnswer: { create: jest.fn() },
            userTopicMastery: { findUnique: jest.fn(), upsert: jest.fn(), create: jest.fn(), update: jest.fn() },
          },
        },
        {
          provide: AiService,
          useValue: { generateText: jest.fn(), generateQuiz: jest.fn() },
        },
        {
          provide: GamificationService,
          useValue: { addXp: jest.fn(), updateStreak: jest.fn() },
        },
        {
          provide: BktService,
          useValue: { updateMastery: jest.fn().mockResolvedValue(0.35) },
        },
        {
          provide: RlDifficultyService,
          useValue: { getOptimalDifficulty: jest.fn().mockResolvedValue(0.5), updateDifficultyState: jest.fn() },
        },
        {
          provide: ConsentService,
          useValue: { hasConsent: jest.fn().mockResolvedValue(true) },
        },
        {
          provide: TelemetryService,
          useValue: { emitEvent: jest.fn(), exportCohortTelemetry: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<PracticeService>(PracticeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
