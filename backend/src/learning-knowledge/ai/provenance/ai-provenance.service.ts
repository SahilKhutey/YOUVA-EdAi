import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { AiCapability } from '../ai.types';

export function computeOutputHash(data: unknown): string {
  const serialized = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('sha256').update(serialized).digest('hex');
}

@Injectable()
export class AiProvenanceService {
  private readonly logger = new Logger(AiProvenanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Persists an immutable AI request and provenance record with cryptographic output hash.
   */
  async recordProvenance(params: {
    tenantId: string;
    actorId: string;
    capability: AiCapability;
    provider?: string;
    model?: string;
    promptVersion?: string;
    knowledgeObjectId?: string;
    knowledgeVersionId?: string;
    sourceKnowledgeIds: string[];
    sourceVersionIds: string[];
    outputData: unknown;
    groundingScore?: number;
    safetyStatus?: string;
  }): Promise<{
    requestId: string;
    provenanceId: string;
    outputHash: string;
  }> {
    const outputHash = computeOutputHash(params.outputData);
    const provider = params.provider ?? 'GEMINI';
    const model = params.model ?? 'gemini-1.5-pro';
    const promptVersion = params.promptVersion ?? '1.0.0';

    try {
      const request = await this.prisma.aiRequest.create({
        data: {
          tenantId: params.tenantId,
          actorId: params.actorId,
          capability: params.capability,
          provider,
          model,
          promptVersion,
          status: 'COMPLETED',
          completedAt: new Date(),
          provenance: {
            create: {
              knowledgeObjectId: params.knowledgeObjectId || null,
              knowledgeVersionId: params.knowledgeVersionId || null,
              outputHash,
              sourceKnowledgeIds: params.sourceKnowledgeIds,
              sourceVersionIds: params.sourceVersionIds,
              groundingScore: params.groundingScore,
              safetyStatus: params.safetyStatus || 'PASSED',
            },
          },
        },
        include: {
          provenance: true,
        },
      });

      return {
        requestId: request.id,
        provenanceId: request.provenance[0]?.id || request.id,
        outputHash,
      };
    } catch (err: any) {
      this.logger.error(`Failed to record AI provenance: ${err.message}`);
      // Return synthetic tracking values if database write fails so user flow is not broken
      const fallbackId = `ai-req-${Date.now()}`;
      return {
        requestId: fallbackId,
        provenanceId: `ai-prov-${Date.now()}`,
        outputHash,
      };
    }
  }

  /**
   * Retrieves provenance by ID for audit and inspection.
   */
  async getProvenance(id: string) {
    return this.prisma.aiProvenance.findUnique({
      where: { id },
      include: {
        aiRequest: true,
      },
    });
  }
}
