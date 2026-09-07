import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CurriculumService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Align an external curriculum standard code to a canonical learning concept.
   */
  async alignConcept(data: {
    conceptId: string;
    curriculum: string;
    region?: string;
    grade?: string;
    code?: string;
    source?: string;
    confidence?: number;
    metadata?: Record<string, any>;
  }) {
    const concept = await this.prisma.learningConcept.findUnique({
      where: { id: data.conceptId },
    });

    if (!concept) {
      throw new NotFoundException(`Concept [${data.conceptId}] not found.`);
    }

    return this.prisma.curriculumAlignment.create({
      data: {
        conceptId: data.conceptId,
        curriculum: data.curriculum.toUpperCase(),
        region: data.region,
        grade: data.grade,
        code: data.code,
        source: data.source,
        confidence: data.confidence ?? 1.0,
        metadataJson: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });
  }

  /**
   * Get all aligned concepts for a specific curriculum and grade level.
   */
  async getCurriculumAlignments(curriculum: string, grade?: string) {
    const where: any = { curriculum: curriculum.toUpperCase() };
    if (grade) {
      where.grade = grade;
    }

    return this.prisma.curriculumAlignment.findMany({
      where,
      include: {
        concept: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get all curriculum alignments for a single concept across all supported educational frameworks.
   */
  async getAlignmentsForConcept(conceptId: string) {
    return this.prisma.curriculumAlignment.findMany({
      where: { conceptId },
    });
  }
}
