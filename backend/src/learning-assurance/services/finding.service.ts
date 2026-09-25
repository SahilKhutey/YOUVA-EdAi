import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AcknowledgeFindingDto,
  AssuranceDomain,
  AssuranceFindingDto,
  AssuranceOverviewDto,
  FindingSeverity,
  FindingStatus,
  ResolveFindingDto,
  WaiveFindingDto,
} from '../domain/assurance.types';
import { WaiverPolicy } from '../policies/waiver-policy';

@Injectable()
export class FindingService {
  private readonly logger = new Logger(FindingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly waiverPolicy: WaiverPolicy,
  ) {}

  computeFingerprint(
    tenantId: string,
    ruleId: string,
    targetType: string,
    targetId: string,
    ruleVersion = '1.0.0',
  ): string {
    return crypto
      .createHash('sha256')
      .update(`${tenantId}:${ruleId}:${targetType}:${targetId}:${ruleVersion}`)
      .digest('hex');
  }

  async createOrUpdateFinding(data: {
    tenantId: string;
    domain: AssuranceDomain;
    targetType: string;
    targetId: string;
    ruleId: string;
    ruleVersion?: string;
    severity: FindingSeverity;
    message: string;
    evidenceIds?: string[];
    metadata?: Record<string, any>;
  }): Promise<AssuranceFindingDto> {
    const ruleVersion = data.ruleVersion ?? '1.0.0';
    const fingerprint = this.computeFingerprint(
      data.tenantId,
      data.ruleId,
      data.targetType,
      data.targetId,
      ruleVersion,
    );

    // Check for existing active finding with the same fingerprint (deduplication)
    const existing = await this.prisma.assuranceFinding.findFirst({
      where: {
        tenantId: data.tenantId,
        fingerprint,
        status: { in: ['OPEN', 'ACKNOWLEDGED', 'REMEDIATING'] },
      },
    });

    if (existing) {
      // Update existing finding without creating duplicates
      const updated = await this.prisma.assuranceFinding.update({
        where: { id: existing.id },
        data: {
          message: data.message,
          evidenceIds: (data.evidenceIds ?? []) as any,
          metadata: {
            ...((existing.metadata as Record<string, any>) || {}),
            ...(data.metadata || {}),
            lastSeenAt: new Date().toISOString(),
          } as any,
        },
      });

      return this.mapToDto(updated);
    }

    // Create new finding
    const created = await this.prisma.assuranceFinding.create({
      data: {
        tenantId: data.tenantId,
        domain: data.domain,
        targetType: data.targetType,
        targetId: data.targetId,
        ruleId: data.ruleId,
        ruleVersion,
        severity: data.severity,
        status: 'OPEN',
        fingerprint,
        message: data.message,
        evidenceIds: (data.evidenceIds ?? []) as any,
        metadata: data.metadata as any,
      },
    });

    this.logger.warn(
      `Assurance Finding created [${created.severity}][${created.domain}] ${created.ruleId} for ${created.targetType}:${created.targetId}: ${created.message}`,
    );

    return this.mapToDto(created);
  }

  async listFindings(filter?: {
    tenantId?: string;
    domain?: AssuranceDomain;
    severity?: FindingSeverity;
    status?: FindingStatus;
    targetType?: string;
  }): Promise<AssuranceFindingDto[]> {
    const records = await this.prisma.assuranceFinding.findMany({
      where: {
        tenantId: filter?.tenantId,
        domain: filter?.domain,
        severity: filter?.severity,
        status: filter?.status,
        targetType: filter?.targetType,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return records.map((r) => this.mapToDto(r));
  }

  async getFinding(id: string): Promise<AssuranceFindingDto> {
    const record = await this.prisma.assuranceFinding.findUnique({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException(`Assurance finding '${id}' not found.`);
    }
    return this.mapToDto(record);
  }

  async acknowledgeFinding(
    id: string,
    dto: AcknowledgeFindingDto,
  ): Promise<AssuranceFindingDto> {
    const existing = await this.prisma.assuranceFinding.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Assurance finding '${id}' not found.`);
    }

    const updated = await this.prisma.assuranceFinding.update({
      where: { id },
      data: {
        status: 'ACKNOWLEDGED',
        metadata: {
          ...((existing.metadata as Record<string, any>) || {}),
          acknowledgedBy: dto.acknowledgedBy,
          acknowledgedAt: new Date().toISOString(),
          acknowledgementNotes: dto.notes,
        } as any,
      },
    });

    return this.mapToDto(updated);
  }

  async resolveFinding(
    id: string,
    dto: ResolveFindingDto,
  ): Promise<AssuranceFindingDto> {
    const existing = await this.prisma.assuranceFinding.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Assurance finding '${id}' not found.`);
    }

    const updated = await this.prisma.assuranceFinding.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        metadata: {
          ...((existing.metadata as Record<string, any>) || {}),
          resolvedBy: dto.resolvedBy,
          resolvedAt: new Date().toISOString(),
          resolutionNotes: dto.resolutionNotes,
        } as any,
      },
    });

    this.logger.log(`Assurance finding '${id}' resolved by ${dto.resolvedBy}`);
    return this.mapToDto(updated);
  }

  async waiveFinding(
    id: string,
    dto: WaiveFindingDto,
  ): Promise<AssuranceFindingDto> {
    const existing = await this.prisma.assuranceFinding.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Assurance finding '${id}' not found.`);
    }

    const waiverResult = this.waiverPolicy.validateWaiver(
      existing.severity as FindingSeverity,
      existing.domain,
      dto,
    );

    if (!waiverResult.allowed) {
      throw new Error(`Waiver denied: ${waiverResult.reason}`);
    }

    const updated = await this.prisma.assuranceFinding.update({
      where: { id },
      data: {
        status: 'WAIVED',
        metadata: {
          ...((existing.metadata as Record<string, any>) || {}),
          waiver: {
            waivedBy: dto.waivedBy,
            reason: dto.reason,
            policy: dto.policy,
            expiry: new Date(dto.expiry).toISOString(),
            scope: dto.scope,
            grantedAt: new Date().toISOString(),
          },
        } as any,
      },
    });

    this.logger.warn(`Assurance finding '${id}' waived by ${dto.waivedBy} until ${dto.expiry}`);
    return this.mapToDto(updated);
  }

  async getOverview(tenantId = 'default-tenant'): Promise<AssuranceOverviewDto> {
    const findings = await this.prisma.assuranceFinding.findMany({
      where: {
        tenantId,
        status: { in: ['OPEN', 'ACKNOWLEDGED', 'REMEDIATING'] },
      },
    });

    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;

    const domainCounts: Record<AssuranceDomain, number> = {
      KNOWLEDGE: 0,
      LEARNING: 0,
      ASSESSMENT: 0,
      AI: 0,
      PERSONALIZATION: 0,
      ORCHESTRATION: 0,
      DATA: 0,
      SECURITY: 0,
      OPERATIONS: 0,
    };

    for (const f of findings) {
      if (f.severity === 'CRITICAL') criticalCount++;
      else if (f.severity === 'HIGH') highCount++;
      else if (f.severity === 'MEDIUM') mediumCount++;
      else lowCount++;

      const domain = f.domain as AssuranceDomain;
      if (domainCounts[domain] !== undefined) {
        domainCounts[domain]++;
      }
    }

    let systemStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL_RISK' = 'HEALTHY';
    if (criticalCount > 0) systemStatus = 'CRITICAL_RISK';
    else if (highCount > 0 || mediumCount > 10) systemStatus = 'DEGRADED';

    return {
      openFindingsCount: findings.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      domainCounts,
      blockedActionsCount: criticalCount,
      pendingReviewsCount: highCount + mediumCount,
      systemStatus,
      lastEvaluatedAt: new Date().toISOString(),
    };
  }

  private mapToDto(r: any): AssuranceFindingDto {
    return {
      id: r.id,
      tenantId: r.tenantId,
      domain: r.domain as AssuranceDomain,
      targetType: r.targetType,
      targetId: r.targetId,
      ruleId: r.ruleId,
      ruleVersion: r.ruleVersion,
      severity: r.severity as FindingSeverity,
      status: r.status as FindingStatus,
      fingerprint: r.fingerprint,
      message: r.message,
      evidenceIds: r.evidenceIds as string[],
      metadata: r.metadata as Record<string, any>,
      createdAt: r.createdAt,
      resolvedAt: r.resolvedAt,
    };
  }
}
