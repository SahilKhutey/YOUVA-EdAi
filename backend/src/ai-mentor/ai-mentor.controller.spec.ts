import { Test, TestingModule } from '@nestjs/testing';
import { AiMentorController } from './ai-mentor.controller';

describe('AiMentorController', () => {
  let controller: AiMentorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiMentorController],
    }).compile();

    controller = module.get<AiMentorController>(AiMentorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
