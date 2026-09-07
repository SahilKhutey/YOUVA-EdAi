import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CurriculumTranslationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolves a curriculum-specific standard/code to a canonical learning concept.
   * Reuses the existing P8 CurriculumAlignment model.
   */
  async resolveConcept(curriculum: string, code: string) {
    const prismaClient = this.prisma as any;
    return prismaClient.curriculumAlignment.findFirst({
      where: {
        curriculum,
        code,
      },
      include: {
        concept: true,
      },
    });
  }

  /**
   * Maps an external code across curriculum boards (e.g. CBSE -> Cambridge).
   */
  async mapAcrossCurricula(fromCurriculum: string, code: string, targetCurriculum: string) {
    const alignment = await this.resolveConcept(fromCurriculum, code);
    if (!alignment) return null;

    const prismaClient = this.prisma as any;
    return prismaClient.curriculumAlignment.findFirst({
      where: {
        conceptId: alignment.conceptId,
        curriculum: targetCurriculum,
      },
    });
  }
}
