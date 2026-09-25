import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DriftType,
  LearningDriftSignalDto,
} from '../domain/evolution.types';

@Injectable()
export class DriftDetectionService {
  private readonly logger = new Logger(DriftDetectionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async detectDrift(dto: {
    tenantId?: string;
    targetType: string;
    targetId: string;
    baselineDistribution: Record<string, number>;
    currentDistribution: Record<string, number>;
    driftType?: DriftType;
    evidenceIds?: string[];
  }): Promise<LearningDriftSignalDto | null> {
    const tenantId = dto.tenantId ?? 'default-tenant';
    const driftType: DriftType = dto.driftType ?? 'INPUT';
    const evidenceIds = dto.evidenceIds ?? ['EVID_DRIFT_01'];

    // Compute distribution distance (L1 / Total Variation Distance)
    let totalVariation = 0;
    const allKeys = new Set([
      ...Object.keys(dto.baselineDistribution),
      ...Object.keys(dto.currentDistribution),
    ]);

    for (const key of allKeys) {
      const p = dto.baselineDistribution[key] ?? 0;
      const q = dto.currentDistribution[key] ?? 0;
      totalVariation += Math.abs(p - q);
    }
    const distance = totalVariation / 2;

    this.logger.log(`Drift check for '${dto.targetId}' (${driftType}): distance=${distance.toFixed(3)}`);

    // Threshold check (0.15 = drift detected)
    if (distance > 0.15) {
      const severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' =
        distance > 0.35 ? 'HIGH' : distance > 0.25 ? 'MEDIUM' : 'LOW';

      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const record = await this.prisma.learningDriftSignal.create({
        data: {
          tenantId,
          targetType: dto.targetType,
          targetId: dto.targetId,
          driftType,
          baselineWindow: { start: twoWeeksAgo.toISOString(), end: oneWeekAgo.toISOString() } as any,
          comparisonWindow: { start: oneWeekAgo.toISOString(), end: now.toISOString() } as any,
          severity,
          evidenceIds: evidenceIds as any,
        },
      });

      this.logger.warn(`Drift detected for '${dto.targetId}': signal '${record.id}' created (severity=${severity}).`);

      return this.mapToDto(record);
    }

    return null;
  }

  async getDriftSignal(id: string): Promise<LearningDriftSignalDto> {
    const record = await this.prisma.learningDriftSignal.findUnique({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException(`Drift signal '${id}' not found.`);
    }
    return this.mapToDto(record);
  }

  async listDriftSignals(
    tenantId = 'default-tenant',
    driftType?: DriftType,
  ): Promise<LearningDriftSignalDto[]> {
    const whereClause: any = { tenantId };
    if (driftType) {
      whereClause.driftType = driftType;
    }

    const records = await this.prisma.learningDriftSignal.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return records.map((r) => this.mapToDto(r));
  }

  private mapToDto(r: any): LearningDriftSignalDto {
    return {
      id: r.id,
      tenantId: r.tenantId,
      targetType: r.targetType,
      targetId: r.targetId,
      driftType: r.driftType as DriftType,
      baselineWindow: r.baselineWindow as any,
      comparisonWindow: r.comparisonWindow as any,
      severity: r.severity as any,
      evidenceIds: r.evidenceIds as any,
      createdAt: r.createdAt,
    };
  }
}
