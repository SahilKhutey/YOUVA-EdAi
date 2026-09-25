import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PatternStatus } from '../domain/learning-pattern';

export interface CreatePatternDto {
  patternKey: string;
  type?: string;
  statement: string;
  conceptScope: string;
  evidenceCount: number;
  effectiveness?: number;
  confidence?: number;
  methodologyVersion?: string;
}

@Injectable()
export class LearningPatternService {
  private readonly logger = new Logger(LearningPatternService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registers or updates a cross-entity learning pattern.
   */
  async registerPattern(dto: CreatePatternDto, tenantId = 'default-tenant') {
    const confidence = dto.confidence ?? Math.min(0.95, 0.5 + (dto.evidenceCount / 100) * 0.4);
    const status: PatternStatus = dto.evidenceCount >= 50 && confidence >= 0.75 ? 'VALIDATED' : 'CANDIDATE';

    return this.prisma.learningPattern.upsert({
      where: { patternKey: dto.patternKey },
      create: {
        tenantId,
        patternKey: dto.patternKey,
        type: dto.type || 'LEARNING_BEHAVIOR',
        statement: dto.statement,
        conceptScope: dto.conceptScope,
        evidenceCount: dto.evidenceCount,
        effectiveness: dto.effectiveness ?? 0.82,
        confidence,
        sourceVersion: '1.0.0',
        methodologyVersion: dto.methodologyVersion || 'PATTERN_V1',
        status,
      },
      update: {
        evidenceCount: dto.evidenceCount,
        effectiveness: dto.effectiveness,
        confidence,
        status,
      },
    });
  }

  /**
   * Lists learning patterns.
   */
  async listPatterns(tenantId = 'default-tenant', status?: PatternStatus) {
    const where: any = { tenantId };
    if (status) where.status = status;

    return this.prisma.learningPattern.findMany({
      where,
      orderBy: { evidenceCount: 'desc' },
    });
  }

  /**
   * Revalidates a pattern with new evidence.
   */
  async revalidatePattern(
    patternKey: string,
    additionalEvidenceCount: number,
    newEffectiveness: number,
  ) {
    const pattern = await this.prisma.learningPattern.findUnique({
      where: { patternKey },
    });

    if (!pattern) {
      throw new NotFoundException(`Pattern '${patternKey}' not found.`);
    }

    const updatedEvidence = pattern.evidenceCount + additionalEvidenceCount;
    const updatedConfidence = Math.min(0.98, (pattern.confidence || 0.7) + 0.05);

    return this.prisma.learningPattern.update({
      where: { patternKey },
      data: {
        evidenceCount: updatedEvidence,
        effectiveness: newEffectiveness,
        confidence: updatedConfidence,
        status: 'VALIDATED',
      },
    });
  }

  /**
   * Expires an obsolete or contradicted pattern.
   */
  async expirePattern(patternKey: string) {
    return this.prisma.learningPattern.update({
      where: { patternKey },
      data: { status: 'EXPIRED' },
    });
  }
}
