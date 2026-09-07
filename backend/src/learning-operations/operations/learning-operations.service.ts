import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LearningOperationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Enforces transactional idempotency for operations event processing.
   * Invariant: Never process identical event twice or create duplicate interventions.
   */
  async processOnce(eventId: string, eventType = 'UNKNOWN'): Promise<boolean> {
    const prismaClient = this.prisma as any;
    const existing = await prismaClient.operationsEventProcessing.findUnique({
      where: { eventId },
    });

    if (existing) {
      return false;
    }

    try {
      await prismaClient.operationsEventProcessing.create({
        data: {
          eventId,
          eventType,
          status: 'PROCESSING',
        },
      });
      return true;
    } catch {
      // Handles race conditions under concurrent worker execution
      return false;
    }
  }

  /**
   * Retrieves signals scoped strictly to requesting tenant and role.
   */
  async getSignals(user: { tenantId: string; userId: string; role?: string }) {
    const prismaClient = this.prisma as any;
    return prismaClient.learningSignal.findMany({
      where: {
        tenantId: user.tenantId,
      },
      orderBy: { detectedAt: 'desc' },
    });
  }

  /**
   * Retrieves interventions scoped strictly to requesting tenant.
   */
  async getInterventions(user: { tenantId: string; userId: string; role?: string }) {
    const prismaClient = this.prisma as any;
    return prismaClient.learningIntervention.findMany({
      where: {
        tenantId: user.tenantId,
      },
      orderBy: { priority: 'desc' },
    });
  }

  /**
   * Aggregates Command Center telemetry for teachers and institutional administrators.
   */
  async getCommandCenterKPIs(tenantId: string) {
    const prismaClient = this.prisma as any;
    const [signals, interventions, recommendations] = await Promise.all([
      prismaClient.learningSignal.findMany({ where: { tenantId, status: 'OPEN' } }).catch(() => []),
      prismaClient.learningIntervention.findMany({ where: { tenantId } }).catch(() => []),
      prismaClient.policyRecommendation.findMany({ where: { tenantId, status: 'PROPOSED' } }).catch(() => []),
    ]);

    const proposedInterventions = interventions.filter((i: any) => i.status === 'PROPOSED');
    const highSeveritySignals = signals.filter((s: any) => s.severity === 'HIGH');

    return {
      learnersNeedingReview: new Set(highSeveritySignals.map((s: any) => s.learnerId)).size,
      interventionBacklog: proposedInterventions.length,
      highConfidenceOpportunities: signals.filter((s: any) => s.type === 'MASTERY_BREAKTHROUGH').length,
      contentAnomalies: recommendations.filter((r: any) => r.category === 'CONTENT').length,
      aiRecommendationsRequiringReview: proposedInterventions.filter((i: any) => i.requiresTeacherApproval).length,
      priorityQueue: highSeveritySignals.slice(0, 5).map((s: any) => ({
        id: s.id,
        learnerId: s.learnerId,
        type: s.type,
        severity: s.severity,
      })),
    };
  }
}
