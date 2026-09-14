import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Query,
  HttpException,
  HttpStatus,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { AiService } from './ai.service';
import { AiGatewayService } from './gateway/ai-gateway.service';
import { ModelRouterService } from './routing/model-router.service';
import { AiCostTrackerService } from './governance/ai-cost-tracker.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly aiGateway: AiGatewayService,
    private readonly modelRouter: ModelRouterService,
    private readonly costTracker: AiCostTrackerService,
  ) {}

  // --------------------------------------------------------------------------
  // Operational Governance Endpoints (N4 API Surface)
  // --------------------------------------------------------------------------

  /**
   * AI Socratic Tutor Endpoint (N4.11)
   */
  @Post('tutor')
  async tutor(
    @Req() req: any,
    @Body() body: {
      tenantId?: string;
      actorId?: string;
      query?: string;
      message?: string;
      subject?: string;
      concept?: string;
      learnerAgeBand?: string;
      masteryLevel?: number;
      recentErrors?: string[];
      history?: Array<{ role: 'student' | 'tutor'; message: string }>;
      preferredProvider?: string;
    },
  ) {
    const tenantId = req.user?.tenantId || body.tenantId;
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }
    const actorId = req.user?.id || req.user?.userId || body.actorId;
    if (!actorId) {
      throw new BadRequestException('actorId is required');
    }
    const actorRole = req.user?.role || 'STUDENT';
    const correlationId =
      req.headers?.['x-correlation-id'] ||
      req.headers?.['x-request-id'] ||
      `corr-${crypto.randomUUID()}`;

    const allowedProviders = body.preferredProvider
      ? [body.preferredProvider, 'deterministic']
      : ['gemini', 'ollama', 'mock', 'deterministic'];

    return this.aiGateway.generate({
      tenantId,
      actorId,
      actorRole,
      purpose: 'TUTOR',
      correlationId,
      requiresHumanAuthorization: false,
      modelPolicy: {
        capability: 'FAST_TUTOR',
        allowedProviders,
        fallbackAllowed: true,
      },
      input: {
        userQuery: body.query || body.message || '',
        subject: body.subject || 'General',
        concept: body.concept || 'General',
        learnerAgeBand: body.learnerAgeBand || '13-14',
        masteryLevel: body.masteryLevel ?? 0.5,
        recentErrors: body.recentErrors || [],
        history: body.history || [],
      },
    });
  }

  /**
   * Diagnostic Assessment Feedback Endpoint (N4.12)
   */
  @Post('feedback')
  async feedback(
    @Req() req: any,
    @Body() body: {
      tenantId?: string;
      actorId?: string;
      subject?: string;
      concept?: string;
      questionContent?: string;
      studentAnswer?: string;
      expectedAnswer?: string;
    },
  ) {
    const tenantId = req.user?.tenantId || body.tenantId;
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }
    const actorId = req.user?.id || req.user?.userId || body.actorId;
    if (!actorId) {
      throw new BadRequestException('actorId is required');
    }
    const actorRole = req.user?.role || 'STUDENT';
    const correlationId =
      req.headers?.['x-correlation-id'] ||
      req.headers?.['x-request-id'] ||
      `corr-${crypto.randomUUID()}`;

    return this.aiGateway.generate({
      tenantId,
      actorId,
      actorRole,
      purpose: 'FEEDBACK',
      correlationId,
      requiresHumanAuthorization: false,
      modelPolicy: {
        capability: 'REASONING',
        allowedProviders: ['gemini', 'mock', 'deterministic'],
        fallbackAllowed: true,
      },
      input: {
        subject: body.subject || 'General',
        concept: body.concept || 'General',
        questionContent: body.questionContent || '',
        studentAnswer: body.studentAnswer || '',
        expectedAnswer: body.expectedAnswer,
      },
    });
  }

  /**
   * Curriculum Content Draft Generation (N4.12) — Educators & Admins only
   */
  @Post('content/draft')
  async contentDraft(
    @Req() req: any,
    @Body() body: {
      tenantId?: string;
      actorId?: string;
      actorRole?: string;
      subject?: string;
      topic?: string;
      gradeLevel?: string;
      targetBloomLevel?: string;
      questionCount?: number;
    },
  ) {
    const actorRole = req.user?.role || body.actorRole || 'TEACHER';
    if (actorRole === 'STUDENT') {
      throw new ForbiddenException('AccessDenied: Only educators and administrators can generate content drafts.');
    }

    const tenantId = req.user?.tenantId || body.tenantId;
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }
    const actorId = req.user?.id || req.user?.userId || body.actorId;
    if (!actorId) {
      throw new BadRequestException('actorId is required');
    }
    const correlationId =
      req.headers?.['x-correlation-id'] ||
      req.headers?.['x-request-id'] ||
      `corr-${crypto.randomUUID()}`;

    return this.aiGateway.generate({
      tenantId,
      actorId,
      actorRole,
      purpose: 'CONTENT',
      correlationId,
      requiresHumanAuthorization: true, // Content requires educator review before publishing
      modelPolicy: {
        capability: 'CONTENT_GENERATION',
        allowedProviders: ['gemini', 'mock', 'deterministic'],
        fallbackAllowed: true,
      },
      input: {
        subject: body.subject || 'Mathematics',
        topic: body.topic || 'Linear Equations',
        gradeLevel: body.gradeLevel || 'Grade 8',
        targetBloomLevel: body.targetBloomLevel || 'APPLICATION',
        questionCount: body.questionCount || 5,
      },
    });
  }

  /**
   * Teacher Assistant Student Summary (N4.13)
   */
  @Post('teacher-summary')
  async teacherSummary(
    @Req() req: any,
    @Body() body: {
      tenantId?: string;
      actorId?: string;
      actorRole?: string;
      studentId?: string;
      subject?: string;
      topicMasteries?: Array<{ topicId: string; topicName: string; masteryScore: number }>;
      recentInterventions?: Array<{ type: string; status: string; reason?: string }>;
      riskFactors?: string[];
    },
  ) {
    const actorRole = req.user?.role || body.actorRole || 'TEACHER';
    if (actorRole === 'STUDENT') {
      throw new ForbiddenException('AccessDenied: Students cannot access teacher diagnostic summaries.');
    }

    const tenantId = req.user?.tenantId || body.tenantId;
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }
    const actorId = req.user?.id || req.user?.userId || body.actorId;
    if (!actorId) {
      throw new BadRequestException('actorId is required');
    }
    const correlationId =
      req.headers?.['x-correlation-id'] ||
      req.headers?.['x-request-id'] ||
      `corr-${crypto.randomUUID()}`;

    return this.aiGateway.generate({
      tenantId,
      actorId,
      actorRole,
      purpose: 'TEACHER_ASSIST',
      correlationId,
      requiresHumanAuthorization: true,
      modelPolicy: {
        capability: 'REASONING',
        allowedProviders: ['gemini', 'mock', 'deterministic'],
        fallbackAllowed: true,
      },
      input: {
        subject: body.subject || 'General',
        topicMasteries: body.topicMasteries || [],
        recentInterventions: body.recentInterventions || [],
        riskFactors: body.riskFactors || [],
      },
    });
  }

  /**
   * Parent Plain-Language Progress Summary (N4.14)
   */
  @Post('parent-summary')
  async parentSummary(
    @Req() req: any,
    @Body() body: {
      tenantId?: string;
      actorId?: string;
      actorRole?: string;
      studentId?: string;
      subject?: string;
      currentStreakDays?: number;
      completedTopicsCount?: number;
      masteryDeltaSummary?: string;
    },
  ) {
    const actorRole = req.user?.role || body.actorRole || 'PARENT';
    if (actorRole === 'STUDENT') {
      throw new ForbiddenException('AccessDenied: Students cannot trigger parent summary notifications.');
    }

    const tenantId = req.user?.tenantId || body.tenantId;
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }
    const actorId = req.user?.id || req.user?.userId || body.actorId;
    if (!actorId) {
      throw new BadRequestException('actorId is required');
    }
    const correlationId =
      req.headers?.['x-correlation-id'] ||
      req.headers?.['x-request-id'] ||
      `corr-${crypto.randomUUID()}`;

    return this.aiGateway.generate({
      tenantId,
      actorId,
      actorRole,
      purpose: 'PARENT_SUMMARY',
      correlationId,
      requiresHumanAuthorization: false,
      modelPolicy: {
        capability: 'FAST_TUTOR',
        allowedProviders: ['gemini', 'mock', 'deterministic'],
        fallbackAllowed: true,
      },
      input: {
        subject: body.subject || 'General',
        currentStreakDays: body.currentStreakDays ?? 0,
        completedTopicsCount: body.completedTopicsCount ?? 0,
        masteryDeltaSummary: body.masteryDeltaSummary,
      },
    });
  }

  /**
   * Aggregated Usage & Cost Governance (N4.18)
   */
  @Get('usage')
  async getUsage(@Req() req: any, @Query('tenantId') queryTenantId?: string) {
    const tenantId = req.user?.tenantId || queryTenantId;
    return this.costTracker.getUsageSummary(tenantId);
  }

  /**
   * Detailed AI System Health & Circuit Status (N4.20)
   */
  @Get('health')
  async getAiHealth() {
    const providerHealth = await this.aiService.getDetailedProviderHealth();
    const circuitBreakers = this.modelRouter.getCircuitStatus();
    return {
      status: 'UP',
      providers: providerHealth,
      circuitBreakers,
      timestamp: new Date().toISOString(),
    };
  }

  // --------------------------------------------------------------------------
  // Legacy / Direct Backwards-Compatibility Endpoints
  // --------------------------------------------------------------------------

  @Get('providers/status')
  async getProviderStatus() {
    return this.aiService.getDetailedProviderHealth();
  }

  @Post('generate')
  async generateLegacy(@Body('prompt') prompt: string) {
    if (!prompt) {
      throw new HttpException('Prompt is required', HttpStatus.BAD_REQUEST);
    }
    return this.aiService.generateText(prompt);
  }

  @Post('generate-structured')
  async generateStructured(
    @Body('prompt') prompt: string,
    @Body('schemaInstruction') schemaInstruction: string,
  ) {
    if (!prompt) {
      throw new HttpException('Prompt is required', HttpStatus.BAD_REQUEST);
    }
    if (!schemaInstruction) {
      throw new HttpException('Schema instruction is required', HttpStatus.BAD_REQUEST);
    }
    try {
      return await this.aiService.generateStructured(prompt, schemaInstruction);
    } catch (err: any) {
      if (err.message?.includes('SafetyModerationViolation')) {
        throw new HttpException(err.message, HttpStatus.FORBIDDEN);
      }
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }
}
