import { Test, TestingModule } from '@nestjs/testing';
import { ValidatorService } from './validator.service';
import { AiService } from '../../../ai/ai.service';

describe('ValidatorService', () => {
  let service: ValidatorService;

  beforeEach(async () => {
    const mockAi = {
      generateText: jest.fn().mockResolvedValue('{"isValid": true}'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidatorService,
        { provide: AiService, useValue: mockAi },
      ],
    }).compile();

    service = module.get<ValidatorService>(ValidatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
