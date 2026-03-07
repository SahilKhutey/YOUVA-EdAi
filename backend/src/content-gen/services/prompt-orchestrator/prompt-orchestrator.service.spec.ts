import { Test, TestingModule } from '@nestjs/testing';
import { PromptOrchestratorService } from './prompt-orchestrator.service';

describe('PromptOrchestratorService', () => {
  let service: PromptOrchestratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PromptOrchestratorService],
    }).compile();

    service = module.get<PromptOrchestratorService>(PromptOrchestratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
