import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateExperimentDto,
  ExperimentStatus,
  LearningExperimentDto,
} from '../domain/evolution.types';
import {
  ExperimentGuardrailsPolicy,
  GuardrailCheckResult,
} from '../policies/experiment-guardrails.policy';

@Injectable()
export class ExperimentService {
  private readonly logger = new Logger(ExperimentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly guardrailsPolicy: ExperimentGuardrailsPolicy,
  ) {}

  async createExperiment(dto: CreateExperimentDto): Promise<LearningExperimentDto> {
    const tenantId = dto.tenantId ?? 'default-tenant';

    // Validate definition & guardrails
    this.guardrailsPolicy.validateExperimentDefinition(dto);

    const record = await this.prisma.evolutionExperiment.create({
      data: {
        tenantId,
        hypothesis: dto.hypothesis,
        baselineDefinition: dto.baselineDefinition as any,
        treatmentDefinition: dto.treatmentDefinition as any,
        populationDefinition: dto.populationDefinition as any,
        successMetrics: dto.successMetrics as any,
        guardrails: (dto.guardrails ?? ['MAX_ABANDONMENT_DELTA_15%']) as any,
        methodologyVersion: dto.methodologyVersion ?? '1.0.0',
        status: 'DRAFT',
      },
    });

    this.logger.log(`Created learning experiment '${record.id}' (${record.hypothesis.substring(0, 30)}...).`);

    return this.mapToDto(record);
  }

  async startExperiment(id: string, actorRole?: string): Promise<LearningExperimentDto> {
    if (actorRole === 'STUDENT') {
      throw new ForbiddenException('Students cannot administer or start educational experiments.');
    }

    const exp = await this.getExperiment(id);
    if (exp.status === 'RUNNING') {
      return exp;
    }

    const updated = await this.prisma.evolutionExperiment.update({
      where: { id },
      data: { status: 'RUNNING' },
    });

    this.logger.log(`Experiment '${id}' started.`);
    return this.mapToDto(updated);
  }

  async pauseExperiment(id: string, reason?: string): Promise<LearningExperimentDto> {
    const updated = await this.prisma.evolutionExperiment.update({
      where: { id },
      data: { status: 'PAUSED' },
    });

    this.logger.warn(`Experiment '${id}' paused. Reason: ${reason ?? 'Manual pause'}`);
    return this.mapToDto(updated);
  }

  async stopExperiment(id: string, reason?: string): Promise<LearningExperimentDto> {
    const updated = await this.prisma.evolutionExperiment.update({
      where: { id },
      data: { status: 'STOPPED' },
    });

    this.logger.warn(`Experiment '${id}' permanently stopped. Reason: ${reason ?? 'Manual stop'}`);
    return this.mapToDto(updated);
  }

  async completeExperiment(id: string): Promise<LearningExperimentDto> {
    const updated = await this.prisma.evolutionExperiment.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });

    this.logger.log(`Experiment '${id}' marked completed.`);
    return this.mapToDto(updated);
  }

  async evaluateGuardrails(
    id: string,
    currentMetrics: Record<string, number>,
  ): Promise<GuardrailCheckResult> {
    const exp = await this.getExperiment(id);
    const result = this.guardrailsPolicy.checkGuardrails(exp, currentMetrics);

    // Automatic Experiment Stop Invariant: If guardrail breached -> pause immediately
    if (result.breached && exp.status === 'RUNNING') {
      this.logger.error(`Automatic Experiment Stop Triggered for '${id}': ${result.reason}`);
      await this.pauseExperiment(id, result.reason);
    }

    return result;
  }

  async getExperiment(id: string): Promise<LearningExperimentDto> {
    const record = await this.prisma.evolutionExperiment.findUnique({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException(`Experiment '${id}' not found.`);
    }
    return this.mapToDto(record);
  }

  async listExperiments(
    tenantId = 'default-tenant',
    status?: ExperimentStatus,
  ): Promise<LearningExperimentDto[]> {
    const whereClause: any = { tenantId };
    if (status) {
      whereClause.status = status;
    }
    const records = await this.prisma.evolutionExperiment.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return records.map((r) => this.mapToDto(r));
  }

  private mapToDto(r: any): LearningExperimentDto {
    return {
      id: r.id,
      tenantId: r.tenantId,
      hypothesis: r.hypothesis,
      baselineDefinition: r.baselineDefinition,
      treatmentDefinition: r.treatmentDefinition,
      populationDefinition: r.populationDefinition,
      successMetrics: r.successMetrics as any,
      guardrails: r.guardrails as any,
      methodologyVersion: r.methodologyVersion,
      status: r.status as ExperimentStatus,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }
}
