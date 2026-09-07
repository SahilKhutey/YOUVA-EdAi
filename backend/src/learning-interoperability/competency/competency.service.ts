import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CompetencyAssessment,
  canCertifyCompetency,
} from './competency.types';

@Injectable()
export class CompetencyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registers a canonical competency definition.
   */
  async registerCompetency(data: {
    key: string;
    name: string;
    description?: string;
    level: string;
    metadata?: Record<string, any>;
  }) {
    const prismaClient = this.prisma as any;
    return prismaClient.learningCompetency.upsert({
      where: { key: data.key },
      create: {
        key: data.key,
        name: data.name,
        description: data.description ?? null,
        level: data.level,
        metadataJson: data.metadata ? JSON.stringify(data.metadata) : null,
        status: 'ACTIVE',
      },
      update: {
        name: data.name,
        description: data.description ?? null,
        level: data.level,
        metadataJson: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });
  }

  /**
   * Looks up a competency by key or ID.
   */
  async getCompetency(keyOrId: string) {
    const prismaClient = this.prisma as any;
    const byKey = await prismaClient.learningCompetency.findUnique({
      where: { key: keyOrId },
    });
    if (byKey) return byKey;

    return prismaClient.learningCompetency.findUnique({
      where: { id: keyOrId },
    });
  }

  /**
   * Evaluates and records learner competency certification.
   * Invariant: AI CANNOT CERTIFY. Requires explicit teacher verification and evidence.
   */
  async certify(learnerId: string, assessment: CompetencyAssessment) {
    if (!canCertifyCompetency(assessment)) {
      throw new ForbiddenException(
        'Competency certification denied: Requires teacher verification, evidence >= 1, and confidence >= 0.8. AI cannot certify.',
      );
    }

    const prismaClient = this.prisma as any;
    const competency = await this.getCompetency(assessment.competencyId);
    if (!competency) {
      throw new NotFoundException(`Competency ${assessment.competencyId} not found.`);
    }

    return prismaClient.learnerCompetency.upsert({
      where: {
        learnerId_competencyId: {
          learnerId,
          competencyId: competency.id,
        },
      },
      create: {
        learnerId,
        competencyId: competency.id,
        level: assessment.achievedLevel,
        confidence: assessment.confidence,
        evidenceCount: assessment.evidenceIds.length,
        lastEvaluatedAt: new Date(),
      },
      update: {
        level: assessment.achievedLevel,
        confidence: assessment.confidence,
        evidenceCount: assessment.evidenceIds.length,
        lastEvaluatedAt: new Date(),
      },
    });
  }
}
