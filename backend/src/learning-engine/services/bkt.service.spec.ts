import { Test, TestingModule } from '@nestjs/testing';
import { BktService } from './bkt.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('BktService', () => {
  let service: BktService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BktService,
        {
          provide: PrismaService,
          useValue: {
            userTopicMastery: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<BktService>(BktService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
