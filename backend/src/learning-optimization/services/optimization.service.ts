import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OptimizationOverviewDto } from '../domain/optimization-cycle';

@Injectable()
export class OptimizationService {
  private readonly logger = new Logger(OptimizationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves high-level continuous optimization KPIs.
   */
  async getOverview(tenantId = 'default-tenant'): Promise<OptimizationOverviewDto> {
    const [activePlans, evaluationsRunning, completedImprovements, reopenedLineages] =
      await Promise.all([
        this.prisma.improvementPlan.count({
          where: {
            tenantId,
            status: { in: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'EXECUTING', 'EVALUATING'] },
          },
        }),
        this.prisma.improvementPlan.count({
          where: { tenantId, status: 'EVALUATING' },
        }),
        this.prisma.improvementPlan.count({
          where: { tenantId, status: 'COMPLETED' },
        }),
        this.prisma.learningLineage.count({
          where: {
            tenantId,
            sourceType: 'IMPROVEMENT_PLAN',
            targetType: 'IMPROVEMENT_PLAN',
            relation: 'INFORMED_BY',
          },
        }),
      ]);

    return {
      activePlansCount: activePlans,
      evaluationsRunningCount: evaluationsRunning,
      completedImprovementsCount: completedImprovements,
      reopenedImprovementsCount: reopenedLineages,
      systemStatus: {
        evidencePipeline: 'HEALTHY',
        intelligenceEngine: 'HEALTHY',
        optimizationWorkers: 'HEALTHY',
        evaluationWorkers: 'HEALTHY',
      },
    };
  }
}
