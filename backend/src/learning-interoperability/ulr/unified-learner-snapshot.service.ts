import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  UnifiedLearnerRecord,
  nextSnapshotVersion,
} from './ulr.types';

@Injectable()
export class UnifiedLearnerSnapshotService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves the latest governed Unified Learner Snapshot for a given learner and tenant.
   * Invariant: Filters strictly by tenantId to prevent cross-tenant record leakage.
   */
  async getLatest(learnerId: string, tenantId: string) {
    const prismaClient = this.prisma as any;
    return prismaClient.unifiedLearnerSnapshot.findFirst({
      where: {
        learnerId,
        tenantId,
      },
      orderBy: {
        version: 'desc',
      },
    });
  }

  /**
   * Persists a new governed read-projection snapshot for a learner.
   * Invariant: The ULR is a read model, NOT authoritative state.
   */
  async createSnapshot(
    learnerId: string,
    tenantId: string,
    record: UnifiedLearnerRecord,
    sourceEventId?: string,
  ) {
    const prismaClient = this.prisma as any;
    const latest = await this.getLatest(learnerId, tenantId);
    const newVersion = nextSnapshotVersion(latest?.version ?? null);

    return prismaClient.unifiedLearnerSnapshot.create({
      data: {
        learnerId,
        tenantId,
        version: newVersion,
        snapshotJson: JSON.stringify(record),
        sourceEventId: sourceEventId ?? null,
      },
    });
  }

  /**
   * Rebuilds the Unified Learner Record projection from domain services.
   */
  async rebuildSnapshot(
    learnerId: string,
    tenantId: string,
    sourceEventId?: string,
  ) {
    const prismaClient = this.prisma as any;

    // Fetch existing learner competencies if available
    const competencies = await prismaClient.learnerCompetency.findMany({
      where: { learnerId },
      include: { competency: true },
    }).catch(() => []);

    // Construct governed projection
    const record: UnifiedLearnerRecord = {
      learnerId,
      identity: {
        ageTier: 'SECONDARY',
        tenantId,
      },
      learning: {
        mastery: [],
        concepts: [],
        competencies: competencies.map((c: any) => ({
          competencyId: c.competencyId,
          key: c.competency?.key ?? c.competencyId,
          name: c.competency?.name ?? 'Competency',
          level: c.level,
          confidence: c.confidence,
          evidenceCount: c.evidenceCount,
        })),
      },
      evidence: {
        recent: [],
        confidence: 0.95,
      },
      goals: [],
      interventions: [],
      assessments: [],
      credentials: [],
      preferences: [],
      accessibility: {},
      provenance: {
        generatedAt: new Date().toISOString(),
        sourceVersions: ['P12.0'],
      },
    };

    return this.createSnapshot(learnerId, tenantId, record, sourceEventId);
  }
}
