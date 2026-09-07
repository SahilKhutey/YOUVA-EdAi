import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Deterministically assign a subject to an experiment variant using SHA-256.
 */
export function assignVariant(
  experimentKey: string,
  subjectId: string,
  variants: string[],
): string {
  if (!variants || variants.length === 0) {
    throw new BadRequestException('At least one variant is required.');
  }

  const hash = createHash('sha256')
    .update(`${experimentKey}:${subjectId}`)
    .digest();

  const number = hash.readUInt32BE(0);
  return variants[number % variants.length];
}

@Injectable()
export class ExperimentService {
  private readonly logger = new Logger(ExperimentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Register a new learning science or instructional A/B experiment.
   */
  async createExperiment(data: {
    key: string;
    name: string;
    description?: string;
    allocation: Record<string, number>; // e.g. { 'CONTROL': 50, 'INTERLEAVING_V1': 50 }
    metrics: string[];
  }) {
    return this.prisma.learningExperiment.create({
      data: {
        key: data.key,
        name: data.name,
        description: data.description,
        status: 'ACTIVE',
        allocationJson: JSON.stringify(data.allocation),
        metricsJson: JSON.stringify(data.metrics),
      },
    });
  }

  /**
   * Deterministically assign and persist an experiment variant for a student/subject.
   */
  async assignSubjectVariant(experimentKey: string, subjectId: string): Promise<string> {
    const experiment = await this.prisma.learningExperiment.findUnique({
      where: { key: experimentKey },
    });

    if (!experiment) {
      throw new NotFoundException(`Experiment '${experimentKey}' not found.`);
    }

    // Check if an assignment already exists in DB
    const existing = await this.prisma.experimentAssignment.findUnique({
      where: {
        experimentId_subjectId: {
          experimentId: experiment.id,
          subjectId,
        },
      },
    });

    if (existing) {
      return existing.variant;
    }

    const allocation = JSON.parse(experiment.allocationJson);
    const variants = Object.keys(allocation);

    const variant = assignVariant(experimentKey, subjectId, variants);

    await this.prisma.experimentAssignment.create({
      data: {
        experimentId: experiment.id,
        subjectId,
        variant,
      },
    });

    return variant;
  }

  /**
   * Record a metric observation for an experiment variant.
   */
  async recordObservation(
    experimentKey: string,
    subjectId: string,
    metric: string,
    value: number,
  ) {
    const experiment = await this.prisma.learningExperiment.findUnique({
      where: { key: experimentKey },
    });

    if (!experiment) {
      throw new NotFoundException(`Experiment '${experimentKey}' not found.`);
    }

    return this.prisma.experimentObservation.create({
      data: {
        experimentId: experiment.id,
        subjectId,
        metric,
        value,
      },
    });
  }
}
