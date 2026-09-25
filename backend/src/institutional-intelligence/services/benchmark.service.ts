import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InstitutionalPolicy } from '../policies/institutional-policy';
import { BenchmarkScope, PopulationDefinition } from '../domain/benchmark';

export interface CreateBenchmarkDto {
  metric: string;
  scope: BenchmarkScope;
  populationDefinition: PopulationDefinition;
  periodStart: Date;
  periodEnd: Date;
  value: number;
  sampleSize: number;
  methodologyVersion?: string;
}

export interface QueryBenchmarkDto {
  metric?: string;
  scope?: BenchmarkScope;
  userRole: string;
}

@Injectable()
export class BenchmarkService {
  private readonly logger = new Logger(BenchmarkService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records an institutional benchmark calculation.
   */
  async recordBenchmark(dto: CreateBenchmarkDto, tenantId = 'default-tenant') {
    return this.prisma.learningBenchmark.create({
      data: {
        tenantId,
        metric: dto.metric,
        scope: dto.scope,
        populationDefinition: JSON.stringify(dto.populationDefinition),
        periodStart: dto.periodStart,
        periodEnd: dto.periodEnd,
        value: dto.value,
        sampleSize: dto.sampleSize,
        methodologyVersion: dto.methodologyVersion || 'BENCHMARK_V1',
      },
    });
  }

  /**
   * Queries institutional benchmarks with role validation.
   */
  async queryBenchmarks(query: QueryBenchmarkDto, tenantId = 'default-tenant') {
    // Validate role permissions
    InstitutionalPolicy.validateRoleAccess(
      query.userRole,
      query.scope === 'INSTITUTION' ? 'INSTITUTIONAL' : 'CLASSROOM',
    );

    const where: any = { tenantId };
    if (query.metric) where.metric = query.metric;
    if (query.scope) where.scope = query.scope;

    const benchmarks = await this.prisma.learningBenchmark.findMany({
      where,
      orderBy: { periodEnd: 'desc' },
    });

    return benchmarks.map((b) => ({
      ...b,
      populationDefinition: JSON.parse(b.populationDefinition),
    }));
  }
}
