import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import {
  GovernedActionRequest,
  HumanAuthorizationTicket,
  TeacherAutonomyConfig,
} from './n15-types';
import * as crypto from 'crypto';

@Injectable()
export class HumanAuthorizationService {
  private readonly logger = new Logger(HumanAuthorizationService.name);
  private tickets: Map<string, HumanAuthorizationTicket> = new Map();
  private teacherConfigs: Map<string, TeacherAutonomyConfig> = new Map();

  // Override metrics
  private overrideStats = {
    totalRecommendations: 0,
    accepted: 0,
    modified: 0,
    rejected: 0,
  };

  // Granular Emergency Kill Switches
  private globalAutonomyKillSwitch: boolean = false;
  private disabledAgents: Set<string> = new Set();
  private disabledTools: Set<string> = new Set();
  private rolledBackTenants: Set<string> = new Set();

  constructor() {
    this.seedDefaultTeacherConfig();
  }

  private seedDefaultTeacherConfig() {
    this.teacherConfigs.set('teacher-sharma', {
      teacherId: 'teacher-sharma',
      tenantId: 'tenant-dps-rkp',
      allowedDifficultyRange: { min: 0.2, max: 0.8 },
      maxAutoInterventionsPerDay: 5,
      autoSpacedReviewAllowed: true,
      allowedContentTags: ['ALGEBRA', 'GEOMETRY', 'STATISTICS'],
      aiAssistanceLevel: 'BOUNDED_EXECUTION',
    });
  }

  // --- 1. Action Preview & Ticket Issuance (Clauses N15.32 - N15.35) ---

  public createAuthorizationTicket(params: {
    request: GovernedActionRequest;
    risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    evidenceSummary: string;
    expectedImpact: string;
    ttlMinutes?: number;
  }): HumanAuthorizationTicket {
    const ticketId = `ticket-${crypto.randomUUID()}`;
    const ttl = params.ttlMinutes || 60; // 1 hour default TTL
    const expiresAt = new Date(Date.now() + ttl * 60 * 1000).toISOString();

    const ticket: HumanAuthorizationTicket = {
      ticketId,
      actionRequest: params.request,
      risk: params.risk,
      evidenceSummary: params.evidenceSummary,
      expectedImpact: params.expectedImpact,
      policy: params.request.policyVersion,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      expiresAt,
    };

    this.tickets.set(ticketId, ticket);
    this.overrideStats.totalRecommendations += 1;
    this.logger.log(`Created Human Authorization Ticket [${ticketId}] for [${params.request.actionType}]`);
    return ticket;
  }

  public getTicket(ticketId: string): HumanAuthorizationTicket {
    const t = this.tickets.get(ticketId);
    if (!t) {
      throw new NotFoundException(`HUMAN-001: Authorization ticket [${ticketId}] not found`);
    }

    // Check TTL Expiration
    if (t.status === 'PENDING' && new Date() > new Date(t.expiresAt)) {
      t.status = 'EXPIRED';
      this.tickets.set(ticketId, t);
    }

    return t;
  }

  public reviewTicket(params: {
    ticketId: string;
    decision: 'APPROVED' | 'MODIFIED' | 'REJECTED';
    reviewerId: string;
    reviewerRole: string;
    reviewerNotes: string;
    modifiedParameters?: Record<string, any>;
  }): HumanAuthorizationTicket {
    const ticket = this.getTicket(params.ticketId);

    if (ticket.status !== 'PENDING') {
      throw new BadRequestException(
        `HUMAN-002: Ticket [${params.ticketId}] is not pending review (Current: ${ticket.status})`
      );
    }

    ticket.status = params.decision;
    ticket.reviewerId = params.reviewerId;
    ticket.reviewerRole = params.reviewerRole;
    ticket.reviewerNotes = params.reviewerNotes;

    if (params.decision === 'APPROVED') {
      this.overrideStats.accepted += 1;
    } else if (params.decision === 'MODIFIED') {
      ticket.modifiedParameters = params.modifiedParameters;
      this.overrideStats.modified += 1;
    } else if (params.decision === 'REJECTED') {
      this.overrideStats.rejected += 1;
    }

    this.tickets.set(params.ticketId, ticket);
    this.logger.log(`Ticket [${params.ticketId}] reviewed: ${params.decision} by [${params.reviewerId}]`);
    return ticket;
  }

  // --- 2. Teacher-Governed Autonomy & Override Analytics (Clauses N15.29 - N15.31) ---

  public getTeacherConfig(teacherId: string): TeacherAutonomyConfig {
    const config = this.teacherConfigs.get(teacherId);
    if (!config) {
      return {
        teacherId,
        tenantId: 'tenant-default',
        allowedDifficultyRange: { min: 0.1, max: 0.9 },
        maxAutoInterventionsPerDay: 3,
        autoSpacedReviewAllowed: false,
        allowedContentTags: ['ALL'],
        aiAssistanceLevel: 'RECOMMEND_ONLY',
      };
    }
    return { ...config };
  }

  public updateTeacherConfig(
    teacherId: string,
    updates: Partial<TeacherAutonomyConfig>
  ): TeacherAutonomyConfig {
    const current = this.getTeacherConfig(teacherId);
    const updated = { ...current, ...updates };
    this.teacherConfigs.set(teacherId, updated);
    return updated;
  }

  public getOverrideAnalytics() {
    const total = this.overrideStats.totalRecommendations;
    const rate = total > 0 ? ((this.overrideStats.modified + this.overrideStats.rejected) / total) * 100 : 0;
    return {
      ...this.overrideStats,
      humanOverrideRatePercent: Number(rate.toFixed(1)),
    };
  }

  // --- 3. Granular Emergency Revocation & Kill Switches (Clauses N15.36 - N15.38) ---

  public setGlobalKillSwitch(active: boolean): void {
    this.globalAutonomyKillSwitch = active;
    this.logger.warn(`EMERGENCY: Global Autonomy Kill Switch set to [${active}]`);
  }

  public isGlobalKillSwitchActive(): boolean {
    return this.globalAutonomyKillSwitch;
  }

  public setAgentRevocation(agentId: string, revoked: boolean): void {
    if (revoked) {
      this.disabledAgents.add(agentId);
    } else {
      this.disabledAgents.delete(agentId);
    }
  }

  public isAgentRevoked(agentId: string): boolean {
    return this.disabledAgents.has(agentId);
  }

  public setToolRevocation(toolId: string, revoked: boolean): void {
    if (revoked) {
      this.disabledTools.add(toolId);
    } else {
      this.disabledTools.delete(toolId);
    }
  }

  public isToolRevoked(toolId: string): boolean {
    return this.disabledTools.has(toolId);
  }

  public rollbackTenantAutonomy(tenantId: string): void {
    this.rolledBackTenants.add(tenantId);
    this.logger.warn(`Tenant [${tenantId}] autonomy rolled back to A1_INFORMATIONAL only`);
  }

  public isTenantRolledBack(tenantId: string): boolean {
    return this.rolledBackTenants.has(tenantId);
  }

  public resetAllKillSwitches(): void {
    this.globalAutonomyKillSwitch = false;
    this.disabledAgents.clear();
    this.disabledTools.clear();
    this.rolledBackTenants.clear();
  }
}
