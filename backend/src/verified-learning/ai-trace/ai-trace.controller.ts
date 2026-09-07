import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AIDecisionTraceService } from './ai-trace.service';
import { RecordAITraceDto } from './ai-trace.types';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
    sub?: string;
    userId?: string;
    role?: string;
    email?: string;
  };
}

@Controller(['v1/ai/traces', 'ai/traces'])
export class AIDecisionTraceController {
  constructor(private readonly traceService: AIDecisionTraceService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async listTraces(
    @Query('tenantId') tenantId?: string,
    @Query('modelVersion') modelVersion?: string,
    @Query('limit') limit?: string,
  ) {
    return this.traceService.listTraces({
      tenantId,
      modelVersion,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Get(':requestId')
  @UseGuards(JwtAuthGuard)
  async getTrace(@Param('requestId') requestId: string) {
    return this.traceService.getTrace(requestId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async recordTrace(@Body() dto: RecordAITraceDto) {
    return this.traceService.recordTrace(dto);
  }

  @Post('prompts/version')
  @UseGuards(JwtAuthGuard)
  async registerPrompt(
    @Body()
    body: {
      key: string;
      version: string;
      template: string;
    },
    @Req() req: AuthenticatedRequest,
  ) {
    const approver = req.user?.role === 'ADMIN' ? (req.user?.sub || req.user?.id) : undefined;
    return this.traceService.registerPromptVersion(
      body.key,
      body.version,
      body.template,
      approver,
    );
  }
}
