import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateScenarioDto,
  LearningScenarioDto,
  ScenarioStatus,
  SimulationResultDto,
} from '../domain/twin.types';
import { SimulationPolicy } from '../policies/simulation-policy';
import { SimulationEngineService } from '../simulation/simulation-engine.service';
import { SnapshotService } from '../snapshots/snapshot.service';

@Injectable()
export class ScenarioService {
  private readonly logger = new Logger(ScenarioService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly snapshotService: SnapshotService,
    private readonly simulationEngine: SimulationEngineService,
    private readonly simulationPolicy: SimulationPolicy,
  ) {}

  async createScenario(dto: CreateScenarioDto): Promise<LearningScenarioDto> {
    const tenantId = dto.tenantId ?? 'default-tenant';

    if (!dto.name || !dto.objective) {
      throw new BadRequestException('Scenario name and objective are required.');
    }

    if (!dto.changes || !Array.isArray(dto.changes)) {
      throw new BadRequestException('Scenario changes array is required.');
    }

    if (dto.changes.length > SimulationPolicy.MAX_SCENARIO_CHANGES) {
      throw new BadRequestException(
        `Scenario changes count (${dto.changes.length}) exceeds maximum limit (${SimulationPolicy.MAX_SCENARIO_CHANGES}).`,
      );
    }

    // Verify snapshot exists
    const snapshot = await this.snapshotService.getSnapshot(dto.snapshotId);

    const record = await this.prisma.learningScenario.create({
      data: {
        tenantId,
        snapshotId: snapshot.id,
        name: dto.name,
        objective: dto.objective,
        changes: dto.changes as any,
        constraints: (dto.constraints ?? []) as any,
        status: 'DRAFT',
        methodologyVersion: dto.methodologyVersion ?? '1.0.0',
      },
      include: {
        snapshot: true,
      },
    });

    this.logger.log(`Created learning scenario '${record.id}' (${record.name}) attached to snapshot '${snapshot.id}'.`);

    return this.mapToDto(record);
  }

  async getScenario(id: string): Promise<LearningScenarioDto> {
    const record = await this.prisma.learningScenario.findUnique({
      where: { id },
      include: {
        snapshot: true,
        results: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!record) {
      throw new NotFoundException(`Learning scenario '${id}' not found.`);
    }

    return this.mapToDto(record);
  }

  async listScenarios(tenantId = 'default-tenant', status?: ScenarioStatus): Promise<LearningScenarioDto[]> {
    const whereClause: any = { tenantId };
    if (status) {
      whereClause.status = status;
    }

    const records = await this.prisma.learningScenario.findMany({
      where: whereClause,
      include: {
        snapshot: true,
        results: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return records.map((r) => this.mapToDto(r));
  }

  async simulateScenario(id: string, actorRole?: string): Promise<SimulationResultDto> {
    if (actorRole) {
      this.simulationPolicy.validateScopeAuthorization(actorRole, 'CLASS');
    }

    const scenario = await this.getScenario(id);
    const snapshot = await this.snapshotService.getSnapshot(scenario.snapshotId);

    // Update status to SIMULATING
    await this.prisma.learningScenario.update({
      where: { id },
      data: { status: 'SIMULATING' },
    });

    try {
      const result = await this.simulationEngine.simulate(snapshot, scenario);

      // Update status to COMPLETED
      await this.prisma.learningScenario.update({
        where: { id },
        data: { status: 'COMPLETED' },
      });

      return result;
    } catch (err: any) {
      this.logger.error(`Simulation failed for scenario '${id}': ${err.message}`, err.stack);
      await this.prisma.learningScenario.update({
        where: { id },
        data: { status: 'FAILED' },
      });
      throw err;
    }
  }

  async approveScenario(id: string, actorRole?: string): Promise<LearningScenarioDto> {
    if (actorRole) {
      this.simulationPolicy.validateScopeAuthorization(actorRole, 'COURSE');
    }

    const scenario = await this.getScenario(id);
    if (scenario.status !== 'COMPLETED') {
      throw new BadRequestException(`Cannot approve scenario in status '${scenario.status}'. Scenario must be COMPLETED.`);
    }

    const updated = await this.prisma.learningScenario.update({
      where: { id },
      data: { status: 'APPROVED' },
      include: { snapshot: true, results: true },
    });

    this.logger.log(`Scenario '${id}' approved by role '${actorRole ?? 'ADMIN'}'.`);
    return this.mapToDto(updated);
  }

  async rejectScenario(id: string, _reason?: string): Promise<LearningScenarioDto> {
    const scenario = await this.getScenario(id);
    if (scenario.status === 'APPROVED' || scenario.status === 'ARCHIVED') {
      throw new BadRequestException(`Cannot reject scenario in status '${scenario.status}'.`);
    }

    const updated = await this.prisma.learningScenario.update({
      where: { id },
      data: { status: 'REJECTED' },
      include: { snapshot: true, results: true },
    });

    this.logger.log(`Scenario '${id}' rejected.`);
    return this.mapToDto(updated);
  }

  async archiveScenario(id: string): Promise<LearningScenarioDto> {
    const updated = await this.prisma.learningScenario.update({
      where: { id },
      data: { status: 'ARCHIVED' },
      include: { snapshot: true, results: true },
    });

    return this.mapToDto(updated);
  }

  private mapToDto(r: any): LearningScenarioDto {
    return {
      id: r.id,
      tenantId: r.tenantId,
      snapshotId: r.snapshotId,
      name: r.name,
      objective: r.objective,
      changes: r.changes as any,
      constraints: r.constraints as any,
      status: r.status as ScenarioStatus,
      methodologyVersion: r.methodologyVersion,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      snapshot: r.snapshot ? {
        id: r.snapshot.id,
        tenantId: r.snapshot.tenantId,
        snapshotTime: r.snapshot.snapshotTime,
        knowledgeVersionSet: r.snapshot.knowledgeVersionSet,
        curriculumVersionSet: r.snapshot.curriculumVersionSet,
        policyVersionSet: r.snapshot.policyVersionSet,
        learnerStateSnapshot: r.snapshot.learnerStateSnapshot,
        assessmentVersionSet: r.snapshot.assessmentVersionSet,
        methodologyVersion: r.snapshot.methodologyVersion,
        checksum: r.snapshot.checksum,
        createdAt: r.snapshot.createdAt,
      } : undefined,
      results: r.results?.map((res: any) => ({
        id: res.id,
        scenarioId: res.scenarioId,
        baseline: res.baseline,
        projected: res.projected,
        impacts: res.impacts,
        risks: res.risks,
        conflicts: res.conflicts,
        assumptions: res.assumptions,
        limitations: res.limitations,
        methodologyVersion: res.methodologyVersion,
        createdAt: res.createdAt,
      })),
    };
  }
}
