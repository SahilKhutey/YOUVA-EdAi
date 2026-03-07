import { Test, TestingModule } from '@nestjs/testing';
import { ContentGenController } from './content-gen.controller';

describe('ContentGenController', () => {
  let controller: ContentGenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContentGenController],
    }).compile();

    controller = module.get<ContentGenController>(ContentGenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
