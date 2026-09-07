import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductEventService {
  constructor(private readonly prisma: PrismaService) {}

  async track(input: {
    userId?: string;
    tenantId?: string;
    sessionId?: string;
    eventName: string;
    properties?: Record<string, unknown>;
  }) {
    return this.prisma.productEvent.create({
      data: {
        userId: input.userId,
        tenantId: input.tenantId,
        sessionId: input.sessionId,
        eventName: input.eventName,
        properties: input.properties
          ? JSON.stringify(input.properties)
          : undefined,
      },
    });
  }

  async getRecentEvents(userId: string, limit = 50) {
    return this.prisma.productEvent.findMany({
      where: { userId },
      orderBy: { occurredAt: 'desc' },
      take: limit,
    });
  }
}
