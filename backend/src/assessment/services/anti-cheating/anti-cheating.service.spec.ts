import { Test, TestingModule } from '@nestjs/testing';
import { AntiCheatingService } from './anti-cheating.service';

describe('AntiCheatingService', () => {
  let service: AntiCheatingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AntiCheatingService],
    }).compile();

    service = module.get<AntiCheatingService>(AntiCheatingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
