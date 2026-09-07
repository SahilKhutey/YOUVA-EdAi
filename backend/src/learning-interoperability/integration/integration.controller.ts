import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { ExternalLearningEventService } from './external-learning-event.service';
import { CurriculumTranslationService } from './curriculum-translation.service';
import { LearningProviderEvent } from './integration.types';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
    sub?: string;
    userId?: string;
    tenantId?: string;
    role?: string;
  };
}

@Controller(['api/v1/integrations', 'v1/integrations', 'integrations'])
export class IntegrationController {
  constructor(
    private readonly externalEventService: ExternalLearningEventService,
    private readonly curriculumTranslationService: CurriculumTranslationService,
  ) {}

  @Get('providers')
  @UseGuards(JwtAuthGuard)
  async listProviders() {
    return [
      {
        providerId: 'provider-cbse',
        name: 'CBSE Digital Portal',
        status: 'ACTIVE',
        capabilities: ['ACTIVITY_COMPLETED', 'ASSESSMENT_COMPLETED'],
      },
      {
        providerId: 'provider-cambridge',
        name: 'Cambridge Assessment International',
        status: 'ACTIVE',
        capabilities: ['CREDENTIAL_ISSUED', 'ASSESSMENT_COMPLETED'],
      },
    ];
  }

  @Get('providers/:id')
  @UseGuards(JwtAuthGuard)
  async getProvider(@Param('id') id: string) {
    return {
      providerId: id,
      name: `External Learning Provider ${id}`,
      status: 'ACTIVE',
      supportedContracts: ['v1', 'v2'],
    };
  }

  @Post('events')
  async ingestEvent(
    @Body() body: LearningProviderEvent & { tenantId?: string },
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = body.tenantId || req.user?.tenantId || 'default-tenant';
    return this.externalEventService.receive({
      ...body,
      tenantId,
    });
  }

  @Get('events/:id')
  @UseGuards(JwtAuthGuard)
  async getEvent(@Param('id') id: string) {
    return this.externalEventService.getEvent('provider-default', id);
  }

  @Get('mappings')
  @UseGuards(JwtAuthGuard)
  async resolveMapping(
    @Req() req: AuthenticatedRequest,
  ) {
    const curriculum = (req.query?.curriculum as string) || 'CBSE';
    const code = (req.query?.code as string) || 'MATH-G7-01';
    return this.curriculumTranslationService.resolveConcept(curriculum, code);
  }

  @Get('health')
  async checkHealth() {
    return {
      status: 'HEALTHY',
      subsystem: 'learning-interoperability',
      timestamp: new Date().toISOString(),
    };
  }
}
