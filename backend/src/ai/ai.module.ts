import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { ObservabilityModule } from '../observability/observability.module';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiGatewayService } from './gateway/ai-gateway.service';
import { ModelRouterService } from './routing/model-router.service';
import { PromptRegistryService } from './prompts/prompt-registry.service';
import { StructuredOutputService } from './validation/structured-output.service';
import { ContextMinimizerService } from './privacy/context-minimizer.service';
import { AiSafetyModeratorService } from './safety/ai-safety-moderator.service';
import { AiRateLimiterService } from './governance/ai-rate-limiter.service';
import { AiCostTrackerService } from './governance/ai-cost-tracker.service';
import { AiAuditService } from './audit/ai-audit.service';
import { GeminiProvider } from './providers/gemini.provider';
import { OllamaProvider } from './providers/ollama.provider';
import { DeterministicFallbackProvider } from './providers/deterministic-fallback.provider';
import { MockAiProvider } from './providers/mock.provider';

@Module({
  imports: [ConfigModule, PrismaModule, AuditModule, ObservabilityModule],
  controllers: [AiController],
  providers: [
    AiService,
    AiGatewayService,
    ModelRouterService,
    PromptRegistryService,
    StructuredOutputService,
    ContextMinimizerService,
    AiSafetyModeratorService,
    AiRateLimiterService,
    AiCostTrackerService,
    AiAuditService,
    GeminiProvider,
    OllamaProvider,
    DeterministicFallbackProvider,
    MockAiProvider,
  ],
  exports: [
    AiService,
    AiGatewayService,
    ModelRouterService,
    PromptRegistryService,
    StructuredOutputService,
    ContextMinimizerService,
    AiSafetyModeratorService,
    AiRateLimiterService,
    AiCostTrackerService,
    AiAuditService,
    GeminiProvider,
    OllamaProvider,
    DeterministicFallbackProvider,
    MockAiProvider,
  ],
})
export class AiModule {}
