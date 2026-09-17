import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import {
  AiGateway,
  AiGenerationRequest,
  AiGenerationResult,
} from '../interfaces/ai-gateway.interface';
import { ModelRouterService } from '../routing/model-router.service';
import { PromptRegistryService } from '../prompts/prompt-registry.service';
import { StructuredOutputService } from '../validation/structured-output.service';
import { ContextMinimizerService } from '../privacy/context-minimizer.service';
import { AiSafetyModeratorService } from '../safety/ai-safety-moderator.service';
import { AiRateLimiterService } from '../governance/ai-rate-limiter.service';
import { AiCostTrackerService } from '../governance/ai-cost-tracker.service';
import { AiAuditService } from '../audit/ai-audit.service';
import { MetricsService } from '../../observability/metrics.service';

@Injectable()
export class AiGatewayService implements AiGateway {
  private readonly logger = new Logger(AiGatewayService.name);

  constructor(
    private readonly modelRouter: ModelRouterService,
    private readonly promptRegistry: PromptRegistryService,
    private readonly structuredOutput: StructuredOutputService,
    private readonly contextMinimizer: ContextMinimizerService,
    private readonly safetyModerator: AiSafetyModeratorService,
    private readonly rateLimiter: AiRateLimiterService,
    private readonly costTracker: AiCostTrackerService,
    private readonly aiAuditService: AiAuditService,
    private readonly metricsService: MetricsService,
  ) {}

  /**
   * Central entry point executing the governed 12-step AI generation lifecycle.
   */
  async generate<T = unknown>(request: AiGenerationRequest): Promise<AiGenerationResult<T>> {
    const start = Date.now();
    const requestId = `ai-req-${crypto.randomUUID()}`;

    // 1. Mandatory Invariants Check
    if (!request.tenantId) {
      throw new BadRequestException('AiGatewaySecurity: tenantId is required for AI generation.');
    }
    if (!request.actorId) {
      throw new BadRequestException('AiGatewaySecurity: actorId is required for AI generation.');
    }
    if (!request.purpose) {
      throw new BadRequestException('AiGatewaySecurity: purpose is required for AI generation.');
    }
    if (!request.correlationId) {
      throw new BadRequestException('AiGatewaySecurity: correlationId is required for AI generation.');
    }

    this.metricsService.increment('ai_requests_total');

    // 2. Hard Invariant: Block AI actor from self-authorizing or resolving safety
    if (request.purpose === 'SAFETY_SUPPORT' && request.actorRole === 'AI') {
      this.safetyModerator.assertAiCannotResolveSafety(request.actorRole);
    }

    // 3. Rate Limit & Budget Invariant Check
    this.rateLimiter.checkRateLimit(request.tenantId, request.actorId);
    const budget = this.costTracker?.checkTenantSpendLimit
      ? await this.costTracker.checkTenantSpendLimit(request.tenantId)
      : { allowed: true, currentDailySpend: 0, limitDailySpend: 50 };
    if (!budget.allowed) {
      this.metricsService.increment('ai_requests_blocked');
      throw new ForbiddenException(
        `AiBudgetCeilingExceeded: Tenant [${request.tenantId}] daily AI spend limit ($${budget.limitDailySpend}) exceeded (current: $${budget.currentDailySpend}).`,
      );
    }

    // 4. Learner Context Minimization & PII Redaction
    const minimizedInput = this.minimizeInputByPurpose(request.purpose, request.input);

    // 5. Prompt Selection & Rendering
    const promptKey = request.promptKey || this.getDefaultPromptKey(request.purpose);
    const promptVersion = request.promptVersion || 'v1';
    const rendered = this.promptRegistry.render(promptKey, promptVersion, minimizedInput);

    // 6. Pre-Call Input Moderation & Adversarial Defense
    const inputSafety = this.safetyModerator.moderateInput(
      `${rendered.userPrompt} ${typeof request.input === 'string' ? request.input : JSON.stringify(request.input)}`,
    );

    if (!inputSafety.passed) {
      this.metricsService.increment('ai_requests_blocked');
      this.metricsService.increment('ai_safety_flags', inputSafety.flags.length);

      const auditEventId = await this.aiAuditService.recordAiEvent({
        requestId,
        correlationId: request.correlationId,
        tenantId: request.tenantId,
        actorId: request.actorId,
        actorRole: request.actorRole,
        purpose: request.purpose,
        provider: 'GATEWAY_PRE_FILTER',
        model: 'INPUT_MODERATOR',
        promptKey,
        promptVersion,
        outcome: 'BLOCKED',
        safetyFlags: inputSafety.flags,
        latencyMs: Date.now() - start,
      });

      throw new ForbiddenException(`AiSafetyViolation: ${inputSafety.moderationReason}`);
    }

    // 7. Model Router & Provider Selection
    const provider = await this.modelRouter.selectProvider(request.modelPolicy);

    // 8. Provider Execution with Timeout & Exponential Retry
    let providerResult;
    let providerError: Error | null = null;
    const maxRetries = request.modelPolicy.fallbackAllowed ? 1 : 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        providerResult = await provider.generate({
          systemPrompt: rendered.systemPrompt,
          userPrompt: rendered.userPrompt,
          timeoutMs: request.modelPolicy.maxLatencyMs || 5000,
          jsonMode: true,
        });
        this.modelRouter.recordSuccess(provider.name);
        break;
      } catch (err) {
        providerError = err;
        this.modelRouter.recordFailure(provider.name, err);
        this.metricsService.increment('ai_provider_failures');

        if (attempt < maxRetries) {
          this.logger.warn(
            `Provider ${provider.name} failed on attempt ${attempt + 1}: ${err.message}. Retrying...`,
          );
          await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, attempt)));
        }
      }
    }

    // Fallback if primary attempts failed
    let fallbackUsed = false;
    if (!providerResult) {
      if (request.modelPolicy.fallbackAllowed) {
        this.logger.warn(`Primary provider ${provider.name} failed. Executing deterministic fallback.`);
        const fallbackProvider = this.modelRouter.getProvider('deterministic');
        if (fallbackProvider) {
          providerResult = await fallbackProvider.generate({
            systemPrompt: rendered.systemPrompt,
            userPrompt: rendered.userPrompt,
            jsonMode: true,
          });
          fallbackUsed = true;
          this.metricsService.increment('ai_fallbacks');
        }
      }

      if (!providerResult) {
        this.metricsService.increment('ai_requests_failed');
        await this.aiAuditService.recordAiEvent({
          requestId,
          correlationId: request.correlationId,
          tenantId: request.tenantId,
          actorId: request.actorId,
          actorRole: request.actorRole,
          purpose: request.purpose,
          provider: provider.name,
          model: 'UNKNOWN',
          promptKey,
          promptVersion,
          outcome: 'FAILED',
          safetyFlags: [],
          latencyMs: Date.now() - start,
        });
        throw providerError || new Error('All AI providers failed to generate response.');
      }
    }

    // 9. Structured Output Parsing & Schema Validation
    const parsedJson = this.structuredOutput.parseJson(providerResult.text);
    const validatedOutput = this.structuredOutput.validateByPurpose<T>(request.purpose, parsedJson);

    // 10. Post-Generation Output Moderation
    const outputSafety = this.safetyModerator.moderateOutput(providerResult.text);
    const combinedFlags = [...inputSafety.flags, ...outputSafety.flags];

    const latencyMs = Date.now() - start;

    // 11. Cost Tracking & FinOps Database Record
    const usageMetrics = await this.costTracker.recordUsage({
      tenantId: request.tenantId,
      actorId: request.actorId,
      purpose: request.purpose,
      provider: providerResult.provider,
      model: providerResult.model,
      inputTokens: providerResult.inputTokens || 0,
      outputTokens: providerResult.outputTokens || 0,
      latencyMs,
      status: 'SUCCESS',
    });

    // 12. HMAC Forward-Chained Audit Record
    const auditEventId = await this.aiAuditService.recordAiEvent({
      requestId,
      correlationId: request.correlationId,
      tenantId: request.tenantId,
      actorId: request.actorId,
      actorRole: request.actorRole,
      purpose: request.purpose,
      provider: providerResult.provider,
      model: providerResult.model,
      promptKey,
      promptVersion,
      outcome: 'SUCCESS',
      safetyFlags: combinedFlags,
      latencyMs,
      tokensTotal: usageMetrics.totalTokens,
    });

    // 13. Observability Metrics
    this.metricsService.increment('ai_requests_success');
    this.metricsService.recordLatency('ai_latency_ms', latencyMs);
    if (usageMetrics.inputTokens) {
      this.metricsService.increment('ai_tokens_input', usageMetrics.inputTokens);
    }
    if (usageMetrics.outputTokens) {
      this.metricsService.increment('ai_tokens_output', usageMetrics.outputTokens);
    }

    return {
      requestId,
      provider: providerResult.provider,
      model: providerResult.model,
      output: validatedOutput,
      rawText: providerResult.text,
      usage: usageMetrics,
      safety: {
        passed: outputSafety.passed,
        flags: combinedFlags,
      },
      persisted: true,
      auditEventId,
      fallbackUsed,
      latencyMs,
    };
  }

  private getDefaultPromptKey(purpose: string): string {
    switch (purpose) {
      case 'TUTOR':
        return 'TUTOR_HINT';
      case 'FEEDBACK':
      case 'ASSESSMENT':
        return 'ASSESSMENT_FEEDBACK';
      case 'TEACHER_ASSIST':
        return 'TEACHER_SUMMARY';
      case 'PARENT_SUMMARY':
        return 'PARENT_SUMMARY';
      case 'CONTENT':
        return 'CONTENT_GENERATOR';
      case 'SAFETY_SUPPORT':
        return 'SAFETY_SUPPORT';
      default:
        return 'TUTOR_EXPLANATION';
    }
  }

  private minimizeInputByPurpose(purpose: string, input: any): any {
    if (!input || typeof input !== 'object') {
      return { userQuery: this.contextMinimizer.sanitizeText(String(input || '')) };
    }

    switch (purpose) {
      case 'TUTOR':
        return this.contextMinimizer.minimizeTutorContext(input);
      case 'FEEDBACK':
      case 'ASSESSMENT':
        return this.contextMinimizer.minimizeAssessmentContext(input);
      case 'TEACHER_ASSIST':
        return this.contextMinimizer.minimizeTeacherContext(input);
      case 'PARENT_SUMMARY':
        return this.contextMinimizer.minimizeParentContext(input);
      case 'CONTENT':
        return this.contextMinimizer.minimizeContentContext(input);
      default:
        return this.contextMinimizer.sanitizeObject(input);
    }
  }
}
