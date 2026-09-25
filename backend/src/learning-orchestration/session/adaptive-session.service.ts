import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AdaptiveActionType,
  AdaptiveSessionContext,
} from '../decision/decision.types';

@Injectable()
export class AdaptiveSessionService {
  private readonly logger = new Logger(AdaptiveSessionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves an active adaptive session or creates a new one.
   * Survives page refresh, device switch, and temporary disconnect.
   */
  async getOrCreateSession(
    learnerId: string,
    tenantId: string = 'default-tenant',
    initialKnowledgeId?: string,
  ): Promise<AdaptiveSessionContext> {
    const session = await this.prisma.adaptiveSession.upsert({
      where: {
        tenantId_learnerId: { tenantId, learnerId },
      },
      update: {
        lastInteractionAt: new Date(),
        ...(initialKnowledgeId ? { currentKnowledgeId: initialKnowledgeId } : {}),
      },
      create: {
        tenantId,
        learnerId,
        currentKnowledgeId: initialKnowledgeId || null,
        currentAction: AdaptiveActionType.CONTINUE,
        interventionLevel: 0,
        remediationDepth: 0,
        status: 'ACTIVE',
        actionsTaken: '[]',
      },
    });

    return this.mapToContext(session);
  }

  /**
   * Updates session properties after an action or intervention level shift.
   */
  async updateSession(
    learnerId: string,
    tenantId: string = 'default-tenant',
    updates: {
      currentKnowledgeId?: string;
      currentVersionId?: string;
      currentAction?: AdaptiveActionType;
      interventionLevel?: number;
      remediationDepth?: number;
      remediationTargetId?: string | null;
      actionTakenId?: string;
    },
  ): Promise<AdaptiveSessionContext> {
    const current = await this.prisma.adaptiveSession.findUnique({
      where: { tenantId_learnerId: { tenantId, learnerId } },
    });

    let actionsArray: string[] = [];
    if (current?.actionsTaken) {
      try {
        actionsArray = JSON.parse(current.actionsTaken);
      } catch {
        actionsArray = [];
      }
    }

    if (updates.actionTakenId) {
      actionsArray.push(updates.actionTakenId);
    }

    const updated = await this.prisma.adaptiveSession.update({
      where: { tenantId_learnerId: { tenantId, learnerId } },
      data: {
        ...(updates.currentKnowledgeId !== undefined
          ? { currentKnowledgeId: updates.currentKnowledgeId }
          : {}),
        ...(updates.currentVersionId !== undefined
          ? { currentVersionId: updates.currentVersionId }
          : {}),
        ...(updates.currentAction !== undefined
          ? { currentAction: updates.currentAction }
          : {}),
        ...(updates.interventionLevel !== undefined
          ? { interventionLevel: updates.interventionLevel }
          : {}),
        ...(updates.remediationDepth !== undefined
          ? { remediationDepth: updates.remediationDepth }
          : {}),
        ...(updates.remediationTargetId !== undefined
          ? { remediationTargetId: updates.remediationTargetId }
          : {}),
        actionsTaken: JSON.stringify(actionsArray.slice(-50)), // Keep last 50 actions
        lastInteractionAt: new Date(),
      },
    });

    return this.mapToContext(updated);
  }

  private mapToContext(record: any): AdaptiveSessionContext {
    let actions: string[] = [];
    if (record.actionsTaken) {
      try {
        actions = JSON.parse(record.actionsTaken);
      } catch {
        actions = [];
      }
    }

    return {
      sessionId: record.id,
      learnerId: record.learnerId,
      tenantId: record.tenantId,
      currentKnowledgeId: record.currentKnowledgeId,
      currentVersionId: record.currentVersionId,
      currentAction: record.currentAction as AdaptiveActionType,
      startedAt: record.startedAt,
      lastInteractionAt: record.lastInteractionAt,
      interventionLevel: record.interventionLevel,
      remediationDepth: record.remediationDepth,
      remediationTargetId: record.remediationTargetId,
      actionsTaken: actions,
    };
  }
}
