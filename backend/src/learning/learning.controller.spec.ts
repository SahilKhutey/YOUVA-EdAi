import { Test, TestingModule } from '@nestjs/testing';
import { LearningController } from './learning.controller';

import { LearningService } from './learning.service';

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
      ],
    }).compile();

    controller = module.get<LearningController>(LearningController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
