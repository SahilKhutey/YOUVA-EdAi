import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LearningGraphService {
  private readonly logger = new Logger(LearningGraphService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieve a concept and all its direct graph relations.
   */
  async getConcept(id: string) {
    const concept = await this.prisma.learningConcept.findUnique({
      where: { id },
      include: {
        alignments: true,
      },
    });

    if (!concept) {
      throw new NotFoundException('Learning concept not found.');
    }

    const relations = await this.prisma.learningConceptRelation.findMany({
      where: {
        OR: [
          { fromConceptId: id },
          { toConceptId: id },
        ],
      },
      include: {
        fromConcept: true,
        toConcept: true,
      },
    });

    return {
      concept,
      relations,
    };
  }

  /**
   * Retrieve prerequisite concepts required before learning the specified concept.
   */
  async getPrerequisites(id: string) {
    return this.prisma.learningConceptRelation.findMany({
      where: {
        toConceptId: id,
        relationType: 'PREREQUISITE',
      },
      include: {
        fromConcept: true,
      },
    });
  }

  /**
   * Find candidate next concepts that can be recommended after completing a concept.
   * INVARIANT: Does NOT automatically mark next concepts mastered!
   */
  async getNextCandidates(id: string) {
    return this.prisma.learningConceptRelation.findMany({
      where: {
        fromConceptId: id,
        relationType: {
          in: [
            'PREREQUISITE',
            'RELATED',
            'EXTENSION',
          ],
        },
      },
      include: {
        toConcept: true,
      },
    });
  }

  /**
   * Create a canonical learning concept.
   */
  async createConcept(data: {
    canonicalKey: string;
    name: string;
    description?: string;
    subject: string;
    domain?: string;
    ageMin?: number;
    ageMax?: number;
    metadata?: Record<string, any>;
  }) {
    const existing = await this.prisma.learningConcept.findUnique({
      where: { canonicalKey: data.canonicalKey },
    });

    if (existing) {
      throw new ConflictException(
        `Concept with key '${data.canonicalKey}' already exists.`,
      );
    }

    return this.prisma.learningConcept.create({
      data: {
        canonicalKey: data.canonicalKey,
        name: data.name,
        description: data.description,
        subject: data.subject,
        domain: data.domain,
        ageMin: data.ageMin,
        ageMax: data.ageMax,
        metadataJson: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });
  }

  /**
   * Connect two concepts with a typed semantic edge.
   */
  async createRelation(data: {
    fromConceptId: string;
    toConceptId: string;
    relationType: string;
    weight?: number;
    metadata?: Record<string, any>;
  }) {
    return this.prisma.learningConceptRelation.upsert({
      where: {
        fromConceptId_toConceptId_relationType: {
          fromConceptId: data.fromConceptId,
          toConceptId: data.toConceptId,
          relationType: data.relationType,
        },
      },
      create: {
        fromConceptId: data.fromConceptId,
        toConceptId: data.toConceptId,
        relationType: data.relationType,
        weight: data.weight ?? 1.0,
        metadataJson: data.metadata ? JSON.stringify(data.metadata) : null,
      },
      update: {
        weight: data.weight ?? 1.0,
        metadataJson: data.metadata ? JSON.stringify(data.metadata) : undefined,
      },
    });
  }
}
