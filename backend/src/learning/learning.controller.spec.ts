import { Test, TestingModule } from '@nestjs/testing';
import { LearningController } from './learning.controller';

import { LearningService } from './learning.service';
import { LearningTransactionService } from './services/learning-transaction.service';

describe('LearningController', () => {
  let controller: LearningController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LearningController],
      providers: [
        {
          provide: LearningService,
          useValue: {
            startSession: jest.fn(),
            continueSession: jest.fn(),
            endSession: jest.fn(),
          },
        },
        {
          provide: LearningTransactionService,
          useValue: {
            createSession: jest.fn(),
            getSession: jest.fn(),
            processDiagnostic: jest.fn(),
            processAttempt: jest.fn(),
            getNextActivity: jest.fn(),
            getSessionProgress: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<LearningController>(LearningController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
