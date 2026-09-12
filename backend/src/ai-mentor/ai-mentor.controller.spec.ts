import { Test, TestingModule } from '@nestjs/testing';
import { AiMentorController } from './ai-mentor.controller';
import { PedagogyService } from './services/pedagogy/pedagogy.service';
import { ValidatorService } from './services/validator/validator.service';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AiMentorController', () => {
  let controller: AiMentorController;

  beforeEach(async () => {
    const mockPrisma = {
      user: { findUnique: jest.fn() },
      subscription: { findUnique: jest.fn() },
    };

    const mockPedagogy = {
      getStudentContext: jest.fn(),
    };

    const mockValidator = {
      validateResponse: jest.fn(),
    };

    const mockAi = {
      generateText: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiMentorController],
      providers: [
        { provide: PedagogyService, useValue: mockPedagogy },
        { provide: ValidatorService, useValue: mockValidator },
        { provide: AiService, useValue: mockAi },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    controller = module.get<AiMentorController>(AiMentorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
