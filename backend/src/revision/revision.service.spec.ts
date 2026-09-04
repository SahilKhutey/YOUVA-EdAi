import { Test, TestingModule } from '@nestjs/testing';
import { RevisionService } from './revision.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RevisionService', () => {
  let service: RevisionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RevisionService,
        {
          provide: PrismaService,
          useValue: {
            userTopicMastery: { findMany: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<RevisionService>(RevisionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
