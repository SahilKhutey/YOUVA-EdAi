import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Headers,
} from '@nestjs/common';
import { BenchmarkService, CreateBenchmarkDto, QueryBenchmarkDto } from '../services/benchmark.service';
import { BenchmarkScope } from '../domain/benchmark';

@Controller('api/v1/institutional-intelligence/benchmarks')
export class BenchmarkController {
  constructor(private readonly benchmarkService: BenchmarkService) {}

  @Get()
  async getBenchmarks(
    @Query('metric') metric?: string,
    @Query('scope') scope?: BenchmarkScope,
    @Query('userRole') userRole = 'ADMIN',
    @Headers('x-tenant-id') tenantId = 'default-tenant',
  ) {
    return this.benchmarkService.queryBenchmarks({ metric, scope, userRole }, tenantId);
  }

  @Post('query')
  async queryBenchmarks(
    @Body() query: QueryBenchmarkDto,
    @Headers('x-tenant-id') tenantId = 'default-tenant',
  ) {
    return this.benchmarkService.queryBenchmarks(query, tenantId);
  }

  @Post()
  async recordBenchmark(
    @Body() dto: CreateBenchmarkDto,
    @Headers('x-tenant-id') tenantId = 'default-tenant',
  ) {
    return this.benchmarkService.recordBenchmark(dto, tenantId);
  }
}
