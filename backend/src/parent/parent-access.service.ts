import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ParentAccessService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Asserts that a parent has an active, authorized relationship with a student.
   * Throws ForbiddenException if no active relation exists.
   */
  async assertParentOfStudent(
    parentId: string,
    studentId: string,
  ): Promise<void> {
    const relation = await this.prisma.parentStudent.findFirst({
      where: {
        parentId,
        studentId,
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    if (!relation) {
      throw new ForbiddenException(
        'Parent is not authorized to access this student',
      );
    }
  }

  /**
   * Returns all active linked children for a parent.
   */
  async getChildren(parentId: string) {
    return this.prisma.parentStudent.findMany({
      where: {
        parentId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        student: {
          select: {
            id: true,
            name: true,
            gradeLevel: true,
            cognitiveLevel: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * Returns sanitized, parent-permitted educational progress for a linked child.
   * Filters out private AI prompts, raw classifier scores, and teacher-private notes.
   */
  async getChild(parentId: string, studentId: string) {
    await this.assertParentOfStudent(parentId, studentId);

    const student = await this.prisma.user.findFirst({
      where: {
        id: studentId,
        role: 'STUDENT',
      },
      select: {
        id: true,
        name: true,
        gradeLevel: true,
        cognitiveLevel: true,
        avatarUrl: true,
        stats: {
          select: {
            totalXp: true,
            currentLevel: true,
            currentStreak: true,
          },
        },
        topicMastery: {
          select: {
            masteryProbability: true,
            difficultyState: true,
            lastReviewed: true,
            topic: {
              select: {
                id: true,
                title: true,
                subject: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  /**
   * Links a parent and student with an active status.
   */
  async linkParentStudent(parentId: string, studentId: string) {
    return this.prisma.parentStudent.upsert({
      where: {
        parentId_studentId: {
          parentId,
          studentId,
        },
      },
      create: {
        parentId,
        studentId,
        status: 'ACTIVE',
      },
      update: {
        status: 'ACTIVE',
      },
    });
  }
}
