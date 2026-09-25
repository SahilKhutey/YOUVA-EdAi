import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CurriculumBottleneck {
  knowledgeId: string;
  title: string;
  struggleRate: number;
  remediationCount: number;
  recommendation: 'INVESTIGATE';
  reason: string;
}

export interface CurriculumAnalyticsOverview {
  curriculumId: string;
  totalConcepts: number;
  publishedConcepts: number;
  objectiveCoverageRate: number;
  bottlenecks: CurriculumBottleneck[];
}

@Injectable()
export class CurriculumAnalyticsService {
  private readonly logger = new Logger(CurriculumAnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Evaluates curriculum coverage, dependency health, and bottleneck detection.
   * Invariant: Bottlenecks trigger INVESTIGATE signals, never auto-mutating curriculum.
   */
  async getCurriculumAnalytics(
    curriculumId: string,
    tenantId: string = 'default-tenant',
  ): Promise<CurriculumAnalyticsOverview> {
    // Fetch knowledge objects for this subject/topic
    const objects = await this.prisma.knowledgeObject.findMany({
      where: {
        AND: [
          { OR: [{ subjectId: curriculumId }, { topicId: curriculumId }] },
          { OR: [{ tenantId }, { tenantId: null }] },
        ],
      },
      include: {
        objectives: true,
        learnerStates: true,
      },
    });

    const totalConcepts = objects.length;
    const publishedConcepts = objects.filter((o) => o.status === 'PUBLISHED').length;

    const conceptsWithObjectives = objects.filter((o) => o.objectives.length > 0).length;
    const objectiveCoverageRate =
      totalConcepts > 0 ? Number((conceptsWithObjectives / totalConcepts).toFixed(2)) : 0;

    // Detect bottlenecks: concepts where >= 40% of learners are struggling
    const bottlenecks: CurriculumBottleneck[] = [];

    for (const obj of objects) {
      const states = obj.learnerStates;
      if (states.length >= 3) {
        const struggling = states.filter(
          (s) => s.masteryLevel < 0.5 || s.status === 'STRUGGLING',
        ).length;
        const struggleRate = Number((struggling / states.length).toFixed(2));

        if (struggleRate >= 0.4) {
          bottlenecks.push({
            knowledgeId: obj.id,
            title: obj.title,
            struggleRate,
            remediationCount: struggling,
            recommendation: 'INVESTIGATE',
            reason: `High struggle rate (${(struggleRate * 100).toFixed(0)}%) across ${states.length} learners. Review pedagogical scaffolding or prerequisite alignment.`,
          });
        }
      }
    }

    return {
      curriculumId,
      totalConcepts,
      publishedConcepts,
      objectiveCoverageRate,
      bottlenecks,
    };
  }
}
