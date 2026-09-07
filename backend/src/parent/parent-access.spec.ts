import { Test, TestingModule } from '@nestjs/testing';
import { ParentAccessService } from './parent-access.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('P3 ParentAccessService', () => {
  let service: ParentAccessService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      parentStudent: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        upsert: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParentAccessService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ParentAccessService>(ParentAccessService);
  });

  describe('Parent-Student Link Verification', () => {
    it('✓ allows a linked parent to access a child', async () => {
      prisma.parentStudent.findFirst.mockResolvedValue({ id: 'rel-1' });

      await expect(
        service.assertParentOfStudent('parent-1', 'student-1'),
      ).resolves.not.toThrow();

      expect(prisma.parentStudent.findFirst).toHaveBeenCalledWith({
        where: {
          parentId: 'parent-1',
          studentId: 'student-1',
          status: 'ACTIVE',
        },
        select: { id: true },
      });
    });

    it('✓ rejects an unrelated student with ForbiddenException', async () => {
      prisma.parentStudent.findFirst.mockResolvedValue(null);

      await expect(
        service.assertParentOfStudent('parent-1', 'student-unrelated'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('✓ returns only linked children for the specific parent', async () => {
      prisma.parentStudent.findMany.mockResolvedValue([
        {
          id: 'rel-1',
          status: 'ACTIVE',
          createdAt: new Date(),
          student: {
            id: 'student-1',
            name: 'Child One',
            gradeLevel: 'Grade 7',
            cognitiveLevel: 'TEEN',
          },
        },
      ]);

      const children = await service.getChildren('parent-1');

      expect(children).toHaveLength(1);
      expect(children[0].student.id).toBe('student-1');
      expect(prisma.parentStudent.findMany).toHaveBeenCalledWith({
        where: { parentId: 'parent-1', status: 'ACTIVE' },
        select: expect.any(Object),
        orderBy: { createdAt: 'asc' },
      });
    });

    it('✓ returns sanitized student details within privacy boundaries', async () => {
      prisma.parentStudent.findFirst.mockResolvedValue({ id: 'rel-1' });
      prisma.user.findFirst.mockResolvedValue({
        id: 'student-1',
        name: 'Child One',
        gradeLevel: 'Grade 7',
        cognitiveLevel: 'TEEN',
        stats: { totalXp: 1500, currentLevel: 5, currentStreak: 6 },
        topicMastery: [
          {
            masteryProbability: 0.85,
            difficultyState: 'PRACTICING',
            lastReviewed: new Date(),
            topic: { id: 'top-1', title: 'Fractions', subject: { name: 'Math' } },
          },
        ],
      });

      const child = await service.getChild('parent-1', 'student-1');
      expect(child.id).toBe('student-1');
      expect(child.stats?.currentStreak).toBe(6);
      expect(child.topicMastery).toHaveLength(1);
    });

    it('✓ throws NotFoundException when linked student record does not exist', async () => {
      prisma.parentStudent.findFirst.mockResolvedValue({ id: 'rel-1' });
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.getChild('parent-1', 'student-missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
