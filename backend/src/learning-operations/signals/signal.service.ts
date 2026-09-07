import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  LearningSignalType,
  detectMasteryDecline,
  detectRepeatedMisconception,
} from './signal.types';

@Injectable()
export class LearningSignalService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates an empirical learning signal.
   * Invariant: Signals must be generated from objective evidence/state, never ungrounded LLM opinion.
   */
  async createSignal(data: {
    learnerId: string;
    tenantId: string;
    type: LearningSignalType;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    score: number;
    conceptId?: string;
    evidenceIds: string[];
    expiresAt?: Date;
  }) {
    const prismaClient = this.prisma as any;
    return prismaClient.learningSignal.create({
      data: {
        learnerId: data.learnerId,
        tenantId: data.tenantId,
        type: data.type,
        severity: data.severity,
        score: data.score,
        conceptId: data.conceptId ?? null,
        evidenceIdsJson: JSON.stringify(data.evidenceIds),
        status: 'OPEN',
        expiresAt: data.expiresAt ?? null,
      },
    });
  }

  /**
   * Queries active signals with strict tenant isolation.
   */
  async getSignals(query: {
    tenantId: string;
    learnerId?: string;
    type?: string;
    status?: string;
  }) {
    const prismaClient = this.prisma as any;
    const where: Record<string, any> = {
      tenantId: query.tenantId,
    };
    if (query.learnerId) where.learnerId = query.learnerId;
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;

    return prismaClient.learningSignal.findMany({
      where,
      orderBy: { detectedAt: 'desc' },
    });
  }

  /**
   * Evaluates evidence events for misconception accumulation.
   */
  async processEvidence(event: {
    learnerId: string;
    tenantId: string;
    conceptId?: string;
    misconceptionCount?: number;
    evidenceId?: string;
  }) {
    if (event.misconceptionCount && detectRepeatedMisconception(event.misconceptionCount)) {
      return this.createSignal({
        learnerId: event.learnerId,
        tenantId: event.tenantId,
        type: 'REPEATED_MISCONCEPTION',
        severity: 'HIGH',
        score: 0.85,
        conceptId: event.conceptId,
        evidenceIds: event.evidenceId ? [event.evidenceId] : [],
      });
    }
    return null;
  }

  /**
   * Evaluates mastery updates for sudden regression.
   */
  async processMastery(event: {
    learnerId: string;
    tenantId: string;
    conceptId: string;
    previousMastery: number;
    currentMastery: number;
    evidenceId?: string;
  }) {
    if (detectMasteryDecline(event.previousMastery, event.currentMastery)) {
      return this.createSignal({
        learnerId: event.learnerId,
        tenantId: event.tenantId,
        type: 'MASTERY_DECLINE',
        severity: 'HIGH',
        score: event.previousMastery - event.currentMastery,
        conceptId: event.conceptId,
        evidenceIds: event.evidenceId ? [event.evidenceId] : [],
      });
    }
    return null;
  }
}
