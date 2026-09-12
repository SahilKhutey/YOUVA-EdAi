import { Test, TestingModule } from '@nestjs/testing';
import { PedagogyService } from './pedagogy.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('PedagogyService', () => {
  let service: PedagogyService;

  beforeEach(async () => {
    const mockPrisma = {
      user: { findUnique: jest.fn() },
      mistakeLog: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PedagogyService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PedagogyService>(PedagogyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
