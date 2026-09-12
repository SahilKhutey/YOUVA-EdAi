import { Test, TestingModule } from '@nestjs/testing';
import { RlDifficultyService } from './rl-difficulty.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('RlDifficultyService', () => {
  let service: RlDifficultyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RlDifficultyService,
        {
          provide: PrismaService,
          useValue: {
            userTopicMastery: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<RlDifficultyService>(RlDifficultyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
