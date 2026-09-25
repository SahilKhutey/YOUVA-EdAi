import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InstitutionalPolicy } from '../policies/institutional-policy';
import { SystemicInsightType, SystemicInsightStatus } from '../domain/systemic-insight';

export interface CreateSystemicInsightDto {
  type: SystemicInsightType;
  title: string;
  summary: string;
  affectedCourses: string[];
  affectedLearnerCount: number;
  evidenceReferences?: string[];
  confidence?: number;
}

@Injectable()
export class SystemicInsightService {
  private readonly logger = new Logger(SystemicInsightService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a systemic insight after verifying population thresholds.
   */
  async createInsight(dto: CreateSystemicInsightDto, tenantId = 'default-tenant') {
    // Validate systemic thresholds
    InstitutionalPolicy.validateSystemicThreshold(
      dto.affectedLearnerCount,
      dto.affectedCourses.length,
    );

    return this.prisma.systemicInsight.create({
      data: {
        tenantId,
        type: dto.type,
        title: dto.title,
        summary: dto.summary,
        affectedCourses: dto.affectedCourses,
        affectedLearnerCount: dto.affectedLearnerCount,
        evidenceReferences: dto.evidenceReferences || [],
        confidence: dto.confidence ?? 0.88,
        status: 'DETECTED',
      },
    });
  }

  /**
   * Lists systemic insights with optional filters.
   */
  async listInsights(tenantId = 'default-tenant', status?: SystemicInsightStatus) {
    const where: any = { tenantId };
    if (status) where.status = status;

    return this.prisma.systemicInsight.findMany({
      where,
      orderBy: { detectedAt: 'desc' },
    });
  }

  /**
   * Retrieves single systemic insight by ID.
   */
  async getInsight(id: string, tenantId = 'default-tenant') {
    const insight = await this.prisma.systemicInsight.findFirst({
      where: { id, tenantId },
    });

    if (!insight) {
      throw new NotFoundException(`Systemic insight '${id}' not found.`);
    }

    return insight;
  }

  /**
   * Updates status of systemic insight (CONFIRMED, DISMISSED, RESOLVED).
   */
  async updateStatus(id: string, status: SystemicInsightStatus, tenantId = 'default-tenant') {
    await this.getInsight(id, tenantId);

    return this.prisma.systemicInsight.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Detects cross-course prerequisite gap patterns from raw aggregated signals.
   */
  async detectSystemicPrerequisiteGaps(
    prerequisiteId: string,
    affectedCourses: string[],
    failedLearnersCount: number,
    tenantId = 'default-tenant',
  ) {
    InstitutionalPolicy.validateSystemicThreshold(failedLearnersCount, affectedCourses.length);

    return this.createInsight(
      {
        type: 'SYSTEMIC_PREREQUISITE_GAP',
        title: `Systemic Prerequisite Failure on '${prerequisiteId}'`,
        summary: `Detected persistent prerequisite failure across ${affectedCourses.length} courses affecting ${failedLearnersCount} learners.`,
        affectedCourses,
        affectedLearnerCount: failedLearnersCount,
        evidenceReferences: [`prereq_gap:${prerequisiteId}`],
        confidence: 0.92,
      },
      tenantId,
    );
  }
}
