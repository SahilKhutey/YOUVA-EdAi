import { Test, TestingModule } from '@nestjs/testing';
import { RlDifficultyService } from './rl-difficulty.service';

describe('RlDifficultyService', () => {
  let service: RlDifficultyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RlDifficultyService],
    }).compile();

    service = module.get<RlDifficultyService>(RlDifficultyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
