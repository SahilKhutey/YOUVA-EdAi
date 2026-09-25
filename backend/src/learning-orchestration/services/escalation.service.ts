import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  EscalationSeverity,
  EscalationStatus,
  LearningEscalationDto,
} from '../domain/orchestration.types';

@Injectable()
export class EscalationService {
  private readonly logger = new Logger(EscalationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createEscalation(data: {
    tenantId: string;
    orchestrationId: string;
    reason: string;
    severity: EscalationSeverity;
    evidenceIds: string[];
    recommendedAction: string;
    assignedTo?: string;
  }): Promise<LearningEscalationDto> {
    const escalation = await this.prisma.learningEscalation.create({
      data: {
        tenantId: data.tenantId,
        orchestrationId: data.orchestrationId,
        reason: data.reason,
        severity: data.severity,
        evidenceIds: data.evidenceIds as any,
        recommendedAction: data.recommendedAction,
        status: 'OPEN',
        assignedTo: data.assignedTo,
      },
    });

    this.logger.warn(
      `Created learning escalation [${escalation.severity}] for orchestration ${escalation.orchestrationId}: ${escalation.reason}`,
    );

    return {
      id: escalation.id,
      tenantId: escalation.tenantId,
      orchestrationId: escalation.orchestrationId,
      reason: escalation.reason,
      severity: escalation.severity as EscalationSeverity,
      evidenceIds: escalation.evidenceIds as string[],
      recommendedAction: escalation.recommendedAction,
      status: escalation.status as EscalationStatus,
      assignedTo: escalation.assignedTo,
      createdAt: escalation.createdAt,
      resolvedAt: escalation.resolvedAt,
    };
  }

  async listEscalations(filter?: {
    tenantId?: string;
    status?: EscalationStatus;
    severity?: EscalationSeverity;
  }): Promise<LearningEscalationDto[]> {
    const records = await this.prisma.learningEscalation.findMany({
      where: {
        tenantId: filter?.tenantId,
        status: filter?.status,
        severity: filter?.severity,
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((rec) => ({
      id: rec.id,
      tenantId: rec.tenantId,
      orchestrationId: rec.orchestrationId,
      reason: rec.reason,
      severity: rec.severity as EscalationSeverity,
      evidenceIds: rec.evidenceIds as string[],
      recommendedAction: rec.recommendedAction,
      status: rec.status as EscalationStatus,
      assignedTo: rec.assignedTo,
      createdAt: rec.createdAt,
      resolvedAt: rec.resolvedAt,
    }));
  }

  async acknowledgeEscalation(
    id: string,
    acknowledgedBy: string,
  ): Promise<LearningEscalationDto> {
    const record = await this.prisma.learningEscalation.update({
      where: { id },
      data: {
        status: 'ACKNOWLEDGED',
        assignedTo: acknowledgedBy,
      },
    });

    return {
      id: record.id,
      tenantId: record.tenantId,
      orchestrationId: record.orchestrationId,
      reason: record.reason,
      severity: record.severity as EscalationSeverity,
      evidenceIds: record.evidenceIds as string[],
      recommendedAction: record.recommendedAction,
      status: record.status as EscalationStatus,
      assignedTo: record.assignedTo,
      createdAt: record.createdAt,
      resolvedAt: record.resolvedAt,
    };
  }

  async resolveEscalation(
    id: string,
    resolvedBy: string,
    resolutionNotes?: string,
  ): Promise<LearningEscalationDto> {
    const record = await this.prisma.learningEscalation.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        assignedTo: resolvedBy,
      },
    });

    this.logger.log(`Resolved escalation ${id} by ${resolvedBy}: ${resolutionNotes ?? 'No notes'}`);

    return {
      id: record.id,
      tenantId: record.tenantId,
      orchestrationId: record.orchestrationId,
      reason: record.reason,
      severity: record.severity as EscalationSeverity,
      evidenceIds: record.evidenceIds as string[],
      recommendedAction: record.recommendedAction,
      status: record.status as EscalationStatus,
      assignedTo: record.assignedTo,
      createdAt: record.createdAt,
      resolvedAt: record.resolvedAt,
    };
  }
}
