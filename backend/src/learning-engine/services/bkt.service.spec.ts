import { Test, TestingModule } from '@nestjs/testing';
import { BktService } from './bkt.service';

describe('BktService', () => {
  let service: BktService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BktService],
    }).compile();

    service = module.get<BktService>(BktService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
