import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DecisionComparison,
  RecordAITraceDto,
} from './ai-trace.types';
import { hashCanonicalEvidence } from '../evidence/evidence-integrity.service';

@Injectable()
export class AIDecisionTraceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Persists an auditable AI decision trace without storing sensitive raw learner data.
   */
  async recordTrace(dto: RecordAITraceDto) {
    const inputHash = hashCanonicalEvidence(dto.inputPayload);
    const outputHash = hashCanonicalEvidence(dto.outputPayload);
    const prismaClient = this.prisma as any;

    return prismaClient.aIDecisionTrace.create({
      data: {
        requestId: dto.requestId,
        tenantId: dto.tenantId,
        learnerId: dto.learnerId,
        modelVersion: dto.modelVersion,
        promptVersion: dto.promptVersion,
        policyVersion: dto.policyVersion,
        inputHash,
        outputHash,
        contextRefsJson: JSON.stringify(dto.contextRefs),
        toolCallsJson: dto.toolCalls ? JSON.stringify(dto.toolCalls) : null,
        action: dto.action,
        decision: dto.decision,
      },
    });
  }

  /**
   * Retrieves single AI decision trace by requestId.
   */
  async getTrace(requestId: string) {
    const prismaClient = this.prisma as any;
    const trace = await prismaClient.aIDecisionTrace.findUnique({
      where: { requestId },
    });

    if (!trace) {
      throw new NotFoundException(`AI decision trace '${requestId}' not found`);
    }
    return trace;
  }

  /**
   * Registers a versioned system prompt template with cryptographic template hash.
   */
  async registerPromptVersion(key: string, version: string, template: string, approvedBy?: string) {
    const templateHash = hashCanonicalEvidence({ template });
    const prismaClient = this.prisma as any;

    return prismaClient.aIPromptVersion.upsert({
      where: { key_version: { key, version } },
      create: {
        key,
        version,
        templateHash,
        status: approvedBy ? 'APPROVED' : 'DRAFT',
        approvedBy,
        approvedAt: approvedBy ? new Date() : null,
      },
      update: {
        templateHash,
        status: approvedBy ? 'APPROVED' : 'DRAFT',
        approvedBy,
        approvedAt: approvedBy ? new Date() : null,
      },
    });
  }

  /**
   * Compares an original AI decision against a candidate model's decision in replay sandbox.
   */
  compareDecisions(original: any, candidate: any): DecisionComparison {
    return {
      originalDecision: typeof original === 'string' ? original : JSON.stringify(original),
      candidateDecision: typeof candidate === 'string' ? candidate : JSON.stringify(candidate),
      actionChanged: original?.action !== candidate?.action,
      safetyChanged: original?.safetyScore !== candidate?.safetyScore,
      policyChanged: original?.policyVersion !== candidate?.policyVersion,
      outcomePredictionChanged: original?.predictedOutcome !== candidate?.predictedOutcome,
    };
  }

  /**
   * Lists traces.
   */
  async listTraces(filters: { tenantId?: string; modelVersion?: string; limit?: number }) {
    const prismaClient = this.prisma as any;
    const where: any = {};
    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.modelVersion) where.modelVersion = filters.modelVersion;

    return prismaClient.aIDecisionTrace.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit ?? 50,
    });
  }
}
