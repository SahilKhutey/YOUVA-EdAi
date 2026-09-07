import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
  EvaluateFlagDto,
  LogAIModelEvaluationDto,
} from './dto/feature-flag.dto';

@Injectable()
export class FeatureFlagsService {
  private readonly logger = new Logger(FeatureFlagsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Deterministically compute an integer bucket [0-99] for canary targeting.
   */
  computeBucket(flagKey: string, entityId: string): number {
    const hash = crypto
      .createHash('sha256')
      .update(`${flagKey}:${entityId}`)
      .digest('hex');
    const numericValue = parseInt(hash.substring(0, 8), 16);
    return numericValue % 100;
  }

  /**
   * Evaluate whether a feature flag is active for a given entity context.
   */
  async isEnabled(dto: EvaluateFlagDto): Promise<boolean> {
    const flag = await this.prisma.featureFlag.findUnique({
      where: { key: dto.flagKey },
    });

    if (!flag || !flag.isEnabled) {
      return false;
    }

    // 1. Direct User Whitelist Check
    if (dto.userId && flag.userWhitelist) {
      const users = flag.userWhitelist.split(',').map((u) => u.trim());
      if (users.includes(dto.userId)) {
        return true;
      }
    }

    // 2. Tenant / Institutional Whitelist Check
    if (dto.tenantId && flag.tenantWhitelist) {
      const tenants = flag.tenantWhitelist.split(',').map((t) => t.trim());
      if (tenants.includes(dto.tenantId)) {
        return true;
      }
    }

    // 3. Target Role Constraint Check
    if (flag.targetRoles) {
      const allowedRoles = flag.targetRoles.split(',').map((r) => r.trim().toUpperCase());
      if (!dto.role || !allowedRoles.includes(dto.role.toUpperCase())) {
        return false; // User role not included in targeted roles
      }
    }

    // 4. Percentage Rollout Evaluation
    if (flag.rolloutPercentage >= 100) {
      return true;
    }

    if (flag.rolloutPercentage <= 0) {
      return false;
    }

    // Use entityId (userId preferred, fallback to tenantId)
    const entityId = dto.userId || dto.tenantId;
    if (!entityId) {
      return false;
    }

    const bucket = this.computeBucket(flag.key, entityId);
    return bucket < flag.rolloutPercentage;
  }

  /**
   * Create a new feature flag.
   */
  async createFlag(dto: CreateFeatureFlagDto) {
    const existing = await this.prisma.featureFlag.findUnique({
      where: { key: dto.key },
    });

    if (existing) {
      throw new ConflictException(`Feature flag key '${dto.key}' already exists`);
    }

    return this.prisma.featureFlag.create({
      data: {
        key: dto.key,
        name: dto.name,
        description: dto.description,
        isEnabled: dto.isEnabled ?? false,
        rolloutPercentage: dto.rolloutPercentage ?? 0,
        tenantWhitelist: dto.tenantWhitelist,
        userWhitelist: dto.userWhitelist,
        targetRoles: dto.targetRoles,
        metadata: dto.metadata ? JSON.stringify(dto.metadata) : null,
      },
    });
  }

  /**
   * Update an existing feature flag.
   */
  async updateFlag(key: string, dto: UpdateFeatureFlagDto) {
    const existing = await this.prisma.featureFlag.findUnique({
      where: { key },
    });

    if (!existing) {
      throw new NotFoundException(`Feature flag '${key}' not found`);
    }

    return this.prisma.featureFlag.update({
      where: { key },
      data: {
        name: dto.name,
        description: dto.description,
        isEnabled: dto.isEnabled,
        rolloutPercentage: dto.rolloutPercentage,
        tenantWhitelist: dto.tenantWhitelist,
        userWhitelist: dto.userWhitelist,
        targetRoles: dto.targetRoles,
        metadata: dto.metadata ? JSON.stringify(dto.metadata) : undefined,
      },
    });
  }

  /**
   * List all feature flags in the platform.
   */
  async listFlags() {
    return this.prisma.featureFlag.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Log an AI model evaluation record for continuous governance and observability.
   */
  async logModelEvaluation(dto: LogAIModelEvaluationDto) {
    return this.prisma.aIModelEvaluationRecord.create({
      data: {
        modelName: dto.modelName,
        modelVersion: dto.modelVersion,
        promptKey: dto.promptKey,
        teacherAgreed: dto.teacherAgreed,
        teacherOverridden: dto.teacherOverridden,
        accuracyScore: dto.accuracyScore,
        safetyPassed: dto.safetyPassed ?? true,
        latencyMs: dto.latencyMs,
        feedback: dto.feedback,
        metadata: dto.metadata ? JSON.stringify(dto.metadata) : null,
      },
    });
  }

  /**
   * Get telemetry summary for model drift and teacher agreement.
   */
  async getModelGovernanceMetrics(modelName?: string) {
    const where = modelName ? { modelName } : {};

    const [totalCount, safetyFailures, agreedCount, overriddenCount] = await Promise.all([
      this.prisma.aIModelEvaluationRecord.count({ where }),
      this.prisma.aIModelEvaluationRecord.count({ where: { ...where, safetyPassed: false } }),
      this.prisma.aIModelEvaluationRecord.count({ where: { ...where, teacherAgreed: true } }),
      this.prisma.aIModelEvaluationRecord.count({ where: { ...where, teacherOverridden: true } }),
    ]);

    const teacherInteractionTotal = agreedCount + overriddenCount;
    const teacherAgreementRate =
      teacherInteractionTotal > 0
        ? Math.round((agreedCount / teacherInteractionTotal) * 100) / 100
        : 1.0;

    return {
      modelName: modelName || 'ALL_MODELS',
      totalEvaluations: totalCount,
      safetyFailures,
      teacherAgreementRate,
      teacherOverrideRate:
        teacherInteractionTotal > 0
          ? Math.round((overriddenCount / teacherInteractionTotal) * 100) / 100
          : 0,
      timestamp: new Date().toISOString(),
    };
  }
}
