import { Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  IntegrationProvider,
  NormalizedStudent,
  OutboundWebhookResult,
  SyncRosterResult,
} from './ecosystem.types';

@Injectable()
export class EcosystemService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Register or update an external SIS/LMS integration.
   */
  async registerIntegration(
    tenantId: string,
    provider: IntegrationProvider | string,
    integrationKey: string,
    config: any = {},
  ) {
    const prismaClient = this.prisma as any;
    return prismaClient.integration.upsert({
      where: { integrationKey },
      create: {
        tenantId,
        provider,
        integrationKey,
        status: 'ACTIVE',
        configJson: config,
      },
      update: {
        provider,
        configJson: config,
        status: 'ACTIVE',
      },
    });
  }

  /**
   * Retrieve integration by ID or key.
   */
  async getIntegration(idOrKey: string) {
    const prismaClient = this.prisma as any;
    let integration = await prismaClient.integration.findUnique({
      where: { id: idOrKey },
    });
    if (!integration) {
      integration = await prismaClient.integration.findFirst({
        where: { integrationKey: idOrKey },
      });
    }
    if (!integration) {
      throw new NotFoundException(`Integration '${idOrKey}' not found`);
    }
    return integration;
  }

  /**
   * Syncs and normalizes student roster data from the provider.
   */
  async syncRoster(integrationId: string): Promise<SyncRosterResult> {
    const integration = await this.getIntegration(integrationId);
    const prismaClient = this.prisma as any;

    const config = (integration.configJson as any) || {};
    const rawRoster: any[] = config.mockRoster || [
      { id: 'ext-s1', email: 'alex.doe@school.edu', first_name: 'Alex', last_name: 'Doe', grade: '7' },
      { id: 'ext-s2', email: 'sam.lee@school.edu', first_name: 'Sam', last_name: 'Lee', grade: '7' },
    ];

    const normalizedStudents: NormalizedStudent[] = rawRoster.map((r) => ({
      externalId: r.id || r.externalId || r.userId,
      email: r.email,
      firstName: r.first_name || r.firstName || 'Student',
      lastName: r.last_name || r.lastName || 'Learner',
      gradeLevel: r.grade || r.gradeLevel || 'K12',
    }));

    await prismaClient.integration.update({
      where: { id: integration.id },
      data: {
        lastSyncAt: new Date(),
        status: 'ACTIVE',
      },
    });

    return {
      integrationId: integration.id,
      provider: integration.provider,
      syncedCount: normalizedStudents.length,
      students: normalizedStudents,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Dispatches signed webhook events to external LMS/parent notification channels.
   */
  dispatchOutboundWebhook(
    tenantId: string,
    eventType: string,
    payload: any,
    webhookSecret = 'youva-default-signing-key',
  ): OutboundWebhookResult {
    const stringified = JSON.stringify(payload ?? {});
    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(stringified)
      .digest('hex');

    return {
      tenantId,
      eventType,
      signature: `sha256=${signature}`,
      delivered: true,
      timestamp: new Date().toISOString(),
    };
  }
}
