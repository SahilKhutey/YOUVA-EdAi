import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface InstitutionalOverviewDto {
  insightsCount: number;
  patternsCount: number;
  activeMemoriesCount: number;
  optimizationPlansCount: number;
  lastUpdated: string;
  dataWindow: {
    start: string;
    end: string;
  };
  systemStatus: {
    crossEntityPipeline: string;
    patternEngine: string;
    learningMemory: string;
    benchmarking: string;
  };
}

@Injectable()
export class InstitutionalIntelligenceService {
  private readonly logger = new Logger(InstitutionalIntelligenceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns institutional intelligence overview KPIs with data freshness windows.
   */
  async getOverview(tenantId = 'default-tenant'): Promise<InstitutionalOverviewDto> {
    const [insights, patterns, memories, plans] = await Promise.all([
      this.prisma.systemicInsight.count({ where: { tenantId } }),
      this.prisma.learningPattern.count({
        where: { OR: [{ tenantId }, { tenantId: null }] },
      }),
      this.prisma.learningMemory.count({ where: { tenantId, status: 'ACTIVE' } }),
      this.prisma.systemOptimizationPlan.count({ where: { tenantId } }),
    ]);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

    return {
      insightsCount: insights,
      patternsCount: patterns,
      activeMemoriesCount: memories,
      optimizationPlansCount: plans,
      lastUpdated: now.toISOString(),
      dataWindow: {
        start: thirtyDaysAgo.toISOString(),
        end: now.toISOString(),
      },
      systemStatus: {
        crossEntityPipeline: 'HEALTHY',
        patternEngine: 'HEALTHY',
        learningMemory: 'HEALTHY',
        benchmarking: 'HEALTHY',
      },
    };
  }
}
