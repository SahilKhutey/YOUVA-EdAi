import { Test, TestingModule } from '@nestjs/testing';
import { EmotionScoringService } from './emotion-scoring.service';

describe('EmotionScoringService', () => {
  let service: EmotionScoringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmotionScoringService],
    }).compile();

    service = module.get<EmotionScoringService>(EmotionScoringService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
