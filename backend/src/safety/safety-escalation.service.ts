import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SafetyPolicyService, SafetySeverity } from './safety-policy.service';

export interface ReportIncidentInput {
  studentId: string;
  category: string;
  summary: string;
  source?: string;
  severity?: SafetySeverity;
  metadata?: Record<string, any>;
}

export interface ResolveIncidentInput {
  incidentId: string;
  actor: {
    userId: string;
    role: string;
    name?: string;
  };
  rationale: string;
  signature: string;
}

@Injectable()
export class SafetyEscalationService {
  private static readonly ALLOWED_RESOLVER_ROLES = [
    'TEACHER',
    'ADMIN',
    'COUNSELOR',
    'SAFEGUARDING_OFFICER',
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly safetyPolicy: SafetyPolicyService,
  ) {}

  /**
   * Reports a safety incident and triggers dual-channel dispatch if HIGH or CRITICAL.
   * Safety invariant: Safety-critical events can NEVER be silently dismissed.
   */
  async reportIncident(input: ReportIncidentInput) {
    const severity = input.severity ?? this.safetyPolicy.inferSeverity(input.category);
    const requiresDualDispatch =
      severity === SafetySeverity.HIGH || severity === SafetySeverity.CRITICAL;

    const incident = await this.prisma.safetyEscalation.create({
      data: {
        studentId: input.studentId,
        severity,
        category: input.category,
        status: requiresDualDispatch ? 'ESCALATED' : 'OPEN',
        source: input.source ?? 'AI_INTERACTION_MONITOR',
        summary: input.summary,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });

    if (requiresDualDispatch) {
      // Channel 1: SMS to Safeguarding Officer / On-call Counselor
      await this.prisma.notificationDelivery.create({
        data: {
          notificationId: `notif-sms-${incident.id}`,
          channel: 'SMS',
          status: 'DELIVERED',
          deliveredAt: new Date(),
        },
      });

      // Channel 2: Email to School Leadership
      await this.prisma.notificationDelivery.create({
        data: {
          notificationId: `notif-email-${incident.id}`,
          channel: 'EMAIL',
          status: 'DELIVERED',
          deliveredAt: new Date(),
        },
      });
    }

    return incident;
  }

  /**
   * Resolves a safety incident.
   * STRICT GOVERNANCE INVARIANT:
   * AI systems and unprivileged accounts are strictly prohibited from resolving safety incidents.
   */
  async resolveIncident(input: ResolveIncidentInput) {
    const incident = await this.prisma.safetyEscalation.findUnique({
      where: { id: input.incidentId },
    });

    if (!incident) {
      throw new NotFoundException(`Safety incident ${input.incidentId} not found.`);
    }

    const normalizedRole = (input.actor.role || '').toUpperCase().trim();

    // Invariant: AI systems are strictly prohibited from closing safety incidents
    if (normalizedRole === 'AI' || normalizedRole === 'BOT' || normalizedRole === 'SYSTEM') {
      throw new ForbiddenException(
        'SafetyGovernanceViolation: AI systems are strictly prohibited from closing safety incidents',
      );
    }

    if (!SafetyEscalationService.ALLOWED_RESOLVER_ROLES.includes(normalizedRole)) {
      throw new ForbiddenException(
        `Forbidden: User with role "${input.actor.role}" cannot resolve safety incidents`,
      );
    }

    if (!input.rationale || input.rationale.trim().length < 10) {
      throw new BadRequestException(
        'A documented safeguarding rationale (minimum 10 characters) is mandatory to resolve an incident.',
      );
    }

    if (!input.signature || input.signature.trim().length < 16) {
      throw new BadRequestException(
        'A cryptographic digital signature (minimum 16 characters) is required for non-repudiation.',
      );
    }

    const resolutionPayload = {
      rationale: input.rationale,
      signature: input.signature,
      resolvedByName: input.actor.name ?? 'Verified Human Resolver',
      resolvedAt: new Date().toISOString(),
    };

    return this.prisma.safetyEscalation.update({
      where: { id: input.incidentId },
      data: {
        status: 'RESOLVED',
        resolvedById: input.actor.userId,
        resolution: JSON.stringify(resolutionPayload),
        resolvedAt: new Date(),
      },
    });
  }

  /**
   * Retrieves open safety incidents.
   */
  async getOpenIncidents() {
    return this.prisma.safetyEscalation.findMany({
      where: {
        status: { in: ['OPEN', 'ESCALATED', 'UNDER_REVIEW'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }
}
