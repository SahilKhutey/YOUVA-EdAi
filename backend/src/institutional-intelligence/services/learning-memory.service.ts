import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MemoryType, MemoryStatus } from '../domain/learning-memory';

export interface CreateMemoryDto {
  memoryType: MemoryType;
  statement: string;
  confidence?: number;
  evidenceReferences?: string[];
  expiresInDays?: number;
}

@Injectable()
export class LearningMemoryService {
  private readonly logger = new Logger(LearningMemoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Stores a new institutional learning memory.
   */
  async createMemory(dto: CreateMemoryDto, tenantId = 'default-tenant') {
    const expiresAt = dto.expiresInDays
      ? new Date(Date.now() + dto.expiresInDays * 86400000)
      : new Date(Date.now() + 90 * 86400000); // 90 days default

    return this.prisma.learningMemory.create({
      data: {
        tenantId,
        memoryType: dto.memoryType,
        statement: dto.statement,
        confidence: dto.confidence ?? 0.85,
        status: 'ACTIVE',
        evidenceReferences: dto.evidenceReferences || [],
        expiresAt,
      },
    });
  }

  /**
   * Retrieves active learning memories.
   */
  async getActiveMemories(tenantId = 'default-tenant', memoryType?: MemoryType) {
    const where: any = {
      tenantId,
      status: 'ACTIVE',
    };
    if (memoryType) where.memoryType = memoryType;

    return this.prisma.learningMemory.findMany({
      where,
      orderBy: { confidence: 'desc' },
    });
  }

  /**
   * Handles conflicting evidence: reduces confidence or transitions memory to REVALIDATING or EXPIRED.
   */
  async handleConflictingEvidence(
    memoryId: string,
    conflictingEvidenceRef: string,
    confidenceDrop = 0.25,
    tenantId = 'default-tenant',
  ) {
    const memory = await this.prisma.learningMemory.findFirst({
      where: { id: memoryId, tenantId },
    });

    if (!memory) {
      throw new NotFoundException(`Learning memory '${memoryId}' not found.`);
    }

    const newConfidence = Math.max(0.1, memory.confidence - confidenceDrop);
    const newStatus: MemoryStatus = newConfidence < 0.5 ? 'EXPIRED' : 'REVALIDATING';

    return this.prisma.learningMemory.update({
      where: { id: memoryId },
      data: {
        confidence: newConfidence,
        status: newStatus,
        evidenceReferences: [...memory.evidenceReferences, `conflict:${conflictingEvidenceRef}`],
      },
    });
  }

  /**
   * Revalidates an institutional memory with supporting evidence.
   */
  async revalidateMemory(memoryId: string, supportingEvidenceRef: string, tenantId = 'default-tenant') {
    const memory = await this.prisma.learningMemory.findFirst({
      where: { id: memoryId, tenantId },
    });

    if (!memory) {
      throw new NotFoundException(`Learning memory '${memoryId}' not found.`);
    }

    const newConfidence = Math.min(0.98, memory.confidence + 0.1);

    return this.prisma.learningMemory.update({
      where: { id: memoryId },
      data: {
        confidence: newConfidence,
        status: 'ACTIVE',
        evidenceReferences: [...memory.evidenceReferences, `support:${supportingEvidenceRef}`],
      },
    });
  }
}
