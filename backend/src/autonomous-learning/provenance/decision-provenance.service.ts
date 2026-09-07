import { Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

export interface DecisionExplanation {
  actionId: string;
  summary: string;
  evidence: string[];
  factors: {
    name: string;
    contribution: number;
  }[];
  policyDecision: string;
  confidence: number;
  limitations: string[];
}

@Injectable()
export class DecisionProvenanceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Computes a stable SHA-256 hash over input parameters.
   */
  hashInput(payload: any): string {
    const canonical = JSON.stringify(payload, Object.keys(payload || {}).sort());
    return crypto.createHash('sha256').update(canonical).digest('hex');
  }

  /**
   * Records immutable cryptographic decision provenance.
   */
  async recordProvenance(data: {
    decisionId: string;
    tenantId: string;
    actorType: string;
    actorId?: string;
    modelVersion?: string;
    policyVersion: string;
    inputPayload: any;
    decision: any;
    evidenceIds: string[];
  }) {
    const prismaClient = this.prisma as any;
    const inputHash = this.hashInput(data.inputPayload);

    return prismaClient.decisionProvenance.create({
      data: {
        decisionId: data.decisionId,
        tenantId: data.tenantId,
        actorType: data.actorType,
        actorId: data.actorId ?? null,
        modelVersion: data.modelVersion ?? null,
        policyVersion: data.policyVersion,
        inputHash,
        decisionJson: JSON.stringify(data.decision),
        evidenceIdsJson: JSON.stringify(data.evidenceIds),
      },
    });
  }

  /**
   * Retrieves decision provenance by decisionId.
   */
  async getProvenance(decisionId: string) {
    const prismaClient = this.prisma as any;
    return prismaClient.decisionProvenance.findFirst({
      where: { decisionId },
    });
  }

  /**
   * Explains the factors behind a learning action (Section 71 & 72).
   */
  async explainDecision(actionId: string): Promise<DecisionExplanation> {
    const prismaClient = this.prisma as any;
    const action = await prismaClient.learningAction.findUnique({
      where: { id: actionId },
    });
    if (!action) throw new NotFoundException('Action not found.');

    return {
      actionId,
      summary: `Action ${action.type} proposed with confidence ${(action.confidence * 100).toFixed(0)}%.`,
      evidence: JSON.parse(action.evidenceIdsJson || '[]'),
      factors: [
        { name: 'learningBenefit', contribution: 0.30 },
        { name: 'goalAlignment', contribution: 0.20 },
        { name: 'evidenceConfidence', contribution: 0.15 },
        { name: 'urgency', contribution: 0.15 },
      ],
      policyDecision: action.autonomyLevel,
      confidence: action.confidence,
      limitations: [
        'Model recommendation requires teacher confirmation for non-reversible changes.',
      ],
    };
  }
}
