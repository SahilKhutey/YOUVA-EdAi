import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateEvolutionMemoryDto,
  EvolutionMemoryDto,
  MemoryStatus,
} from '../domain/evolution.types';

@Injectable()
export class EvolutionMemoryService {
  private readonly logger = new Logger(EvolutionMemoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createMemory(dto: CreateEvolutionMemoryDto): Promise<EvolutionMemoryDto> {
    const tenantId = dto.tenantId ?? 'default-tenant';

    const record = await this.prisma.evolutionMemory.create({
      data: {
        tenantId,
        changeType: dto.changeType,
        sourceIds: dto.sourceIds as any,
        baseline: dto.baseline as any,
        intervention: dto.intervention as any,
        outcome: dto.outcome as any,
        learning: dto.learning as any,
        limitations: (dto.limitations ?? []) as any,
        confidence: dto.confidence ?? 'HIGH',
        methodologyVersion: dto.methodologyVersion ?? '1.0.0',
        status: 'ACTIVE',
        expiresAt: dto.expiresAt ?? null,
      },
    });

    this.logger.log(`Recorded evolution memory '${record.id}' for change '${dto.changeType}'.`);

    return this.mapToDto(record);
  }

  async revalidateMemory(id: string): Promise<EvolutionMemoryDto> {
    const memory = await this.getMemory(id);
    const now = new Date();

    let newStatus: MemoryStatus = memory.status;
    if (memory.expiresAt && now > memory.expiresAt) {
      newStatus = 'STALE';
    }

    const updated = await this.prisma.evolutionMemory.update({
      where: { id },
      data: { status: newStatus },
    });

    this.logger.log(`Revalidated evolution memory '${id}' (status=${newStatus}).`);
    return this.mapToDto(updated);
  }

  async getMemory(id: string): Promise<EvolutionMemoryDto> {
    const record = await this.prisma.evolutionMemory.findUnique({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException(`Evolution memory '${id}' not found.`);
    }
    return this.mapToDto(record);
  }

  async listMemories(
    tenantId = 'default-tenant',
    status?: MemoryStatus,
  ): Promise<EvolutionMemoryDto[]> {
    const whereClause: any = { tenantId };
    if (status) {
      whereClause.status = status;
    }

    const records = await this.prisma.evolutionMemory.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return records.map((r) => this.mapToDto(r));
  }

  private mapToDto(r: any): EvolutionMemoryDto {
    return {
      id: r.id,
      tenantId: r.tenantId,
      changeType: r.changeType,
      sourceIds: r.sourceIds as any,
      baseline: r.baseline,
      intervention: r.intervention,
      outcome: r.outcome,
      learning: r.learning as any,
      limitations: r.limitations as any,
      confidence: r.confidence,
      methodologyVersion: r.methodologyVersion,
      status: r.status as MemoryStatus,
      createdAt: r.createdAt,
      expiresAt: r.expiresAt,
    };
  }
}
