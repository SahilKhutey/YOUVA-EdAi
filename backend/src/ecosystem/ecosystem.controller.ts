import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { EcosystemService } from './ecosystem.service';
import { IntegrationProvider } from './ecosystem.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller(['v1/ecosystem', 'ecosystem'])
export class EcosystemController {
  constructor(private readonly ecosystemService: EcosystemService) {}

  @Post('integrations')
  @UseGuards(JwtAuthGuard)
  async registerIntegration(
    @Body()
    body: {
      tenantId: string;
      provider: IntegrationProvider | string;
      integrationKey: string;
      config?: any;
    },
  ) {
    return this.ecosystemService.registerIntegration(
      body.tenantId,
      body.provider,
      body.integrationKey,
      body.config,
    );
  }

  @Get('integrations/:id')
  @UseGuards(JwtAuthGuard)
  async getIntegration(@Param('id') id: string) {
    return this.ecosystemService.getIntegration(id);
  }

  @Post('integrations/:id/sync')
  @UseGuards(JwtAuthGuard)
  async syncRoster(@Param('id') id: string) {
    return this.ecosystemService.syncRoster(id);
  }

  @Post('webhooks/dispatch')
  @UseGuards(JwtAuthGuard)
  async dispatchWebhook(
    @Body()
    body: {
      tenantId: string;
      eventType: string;
      payload: any;
      secret?: string;
    },
  ) {
    return this.ecosystemService.dispatchOutboundWebhook(
      body.tenantId,
      body.eventType,
      body.payload,
      body.secret,
    );
  }
}
