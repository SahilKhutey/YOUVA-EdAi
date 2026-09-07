import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FeatureFlagsService } from './feature-flags.service';
import {
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
  EvaluateFlagDto,
  LogAIModelEvaluationDto,
} from './dto/feature-flag.dto';

@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  /**
   * List all feature flags (Administrative).
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async listFlags() {
    return this.featureFlagsService.listFlags();
  }

  /**
   * Create a new feature flag.
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createFlag(@Body() dto: CreateFeatureFlagDto) {
    return this.featureFlagsService.createFlag(dto);
  }

  /**
   * Update an existing feature flag.
   */
  @Put(':key')
  @UseGuards(JwtAuthGuard)
  async updateFlag(
    @Param('key') key: string,
    @Body() dto: UpdateFeatureFlagDto,
  ) {
    return this.featureFlagsService.updateFlag(key, dto);
  }

  /**
   * Evaluate a feature flag in the context of the calling user/tenant.
   */
  @Post('evaluate')
  @UseGuards(JwtAuthGuard)
  async evaluateFlag(@Body() dto: EvaluateFlagDto, @Request() req: any) {
    const userId = dto.userId || req.user?.id;
    const role = dto.role || req.user?.role;
    const tenantId = dto.tenantId || req.headers['x-tenant-id'];

    const enabled = await this.featureFlagsService.isEnabled({
      flagKey: dto.flagKey,
      userId,
      role,
      tenantId,
    });

    return {
      flagKey: dto.flagKey,
      enabled,
      evaluatedFor: { userId, role, tenantId },
    };
  }

  /**
   * Log an AI model evaluation record.
   */
  @Post('evaluations/ai-model')
  @UseGuards(JwtAuthGuard)
  async logModelEvaluation(@Body() dto: LogAIModelEvaluationDto) {
    return this.featureFlagsService.logModelEvaluation(dto);
  }

  /**
   * Telemetry metrics on teacher agreement and model safety.
   */
  @Get('evaluations/metrics')
  @UseGuards(JwtAuthGuard)
  async getMetrics(@Query('modelName') modelName?: string) {
    return this.featureFlagsService.getModelGovernanceMetrics(modelName);
  }
}
