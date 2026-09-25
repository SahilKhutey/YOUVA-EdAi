import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSnapshotDto, TwinSnapshotDto } from '../domain/twin.types';
import { SimulationPolicy } from '../policies/simulation-policy';

@Injectable()
export class SnapshotService {
  private readonly logger = new Logger(SnapshotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly simulationPolicy: SimulationPolicy,
  ) {}

  computeChecksum(
    tenantId: string,
    knowledgeVersionSet: string,
    curriculumVersionSet: string,
    policyVersionSet: string,
    timestamp: string,
  ): string {
    return crypto
      .createHash('sha256')
      .update(`${tenantId}:${knowledgeVersionSet}:${curriculumVersionSet}:${policyVersionSet}:${timestamp}`)
      .digest('hex');
  }

  async createSnapshot(dto: CreateSnapshotDto): Promise<TwinSnapshotDto> {
    const tenantId = dto.tenantId ?? 'default-tenant';
    const now = new Date();
    const knowledgeVersionSet = dto.knowledgeVersionSet ?? 'KV_2026_09';
    const curriculumVersionSet = dto.curriculumVersionSet ?? 'CV_2026_09';
    const policyVersionSet = dto.policyVersionSet ?? 'PV_2026_09';
    const learnerStateSnapshot = dto.learnerStateSnapshot ?? 'LS_ACTIVE_COHORT_2026';
    const assessmentVersionSet = dto.assessmentVersionSet ?? 'AV_2026_09';
    const methodologyVersion = dto.methodologyVersion ?? '1.0.0';

    const checksum = this.computeChecksum(
      tenantId,
      knowledgeVersionSet,
      curriculumVersionSet,
      policyVersionSet,
      now.toISOString(),
    );

    const record = await this.prisma.ecosystemTwinSnapshot.create({
      data: {
        tenantId,
        snapshotTime: now,
        knowledgeVersionSet,
        curriculumVersionSet,
        policyVersionSet,
        learnerStateSnapshot,
        assessmentVersionSet,
        methodologyVersion,
        checksum,
      },
    });

    this.logger.log(`Created digital twin snapshot '${record.id}' for tenant '${tenantId}' with checksum ${checksum.substring(0, 8)}...`);

    return this.mapToDto(record);
  }

  async getSnapshot(id: string): Promise<TwinSnapshotDto> {
    const record = await this.prisma.ecosystemTwinSnapshot.findUnique({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException(`Digital twin snapshot '${id}' not found.`);
    }
    return this.mapToDto(record);
  }

  async listSnapshots(tenantId = 'default-tenant'): Promise<TwinSnapshotDto[]> {
    const records = await this.prisma.ecosystemTwinSnapshot.findMany({
      where: { tenantId },
      orderBy: { snapshotTime: 'desc' },
      take: 50,
    });
    return records.map((r) => this.mapToDto(r));
  }

  async validateSnapshot(id: string): Promise<{
    valid: boolean;
    checksumValid: boolean;
    isStale: boolean;
    reason?: string;
  }> {
    const snapshot = await this.getSnapshot(id);

    // Verify Checksum
    const expectedChecksum = this.computeChecksum(
      snapshot.tenantId,
      snapshot.knowledgeVersionSet,
      snapshot.curriculumVersionSet,
      snapshot.policyVersionSet,
      snapshot.snapshotTime.toISOString(),
    );

    const checksumValid = snapshot.checksum === expectedChecksum;

    // Check Staleness against simulated current versions
    const currentVersions = {
      knowledge: 'KV_2026_09',
      curriculum: 'CV_2026_09',
      policy: 'PV_2026_09',
    };

    const freshness = this.simulationPolicy.validateSnapshotFreshness(snapshot, currentVersions);

    return {
      valid: checksumValid && !freshness.isStale,
      checksumValid,
      isStale: freshness.isStale,
      reason: freshness.reason,
    };
  }

  private mapToDto(r: any): TwinSnapshotDto {
    return {
      id: r.id,
      tenantId: r.tenantId,
      snapshotTime: r.snapshotTime,
      knowledgeVersionSet: r.knowledgeVersionSet,
      curriculumVersionSet: r.curriculumVersionSet,
      policyVersionSet: r.policyVersionSet,
      learnerStateSnapshot: r.learnerStateSnapshot,
      assessmentVersionSet: r.assessmentVersionSet,
      methodologyVersion: r.methodologyVersion,
      checksum: r.checksum,
      createdAt: r.createdAt,
    };
  }
}
