import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
} from '@nestjs/common';
import { DemandCapacityService } from './demand-capacity.service';
import { MultiTenantGovernanceService } from './multi-tenant-governance.service';
import { CommercialBillingService } from './commercial-billing.service';
import { AiFinOpsService } from './ai-finops.service';
import { DisasterRecoveryOrchestratorService } from './disaster-recovery-orchestrator.service';
import { OperationalResilienceService } from './operational-resilience.service';
import {
  DemandClass,
  TenantPolicyConfig,
  IncidentSeverity,
  IncidentLifecycleState,
} from './n14-types';

@Controller('api/v1/infrastructure')
export class InfrastructureController {
  constructor(
    private readonly demandCapacityService: DemandCapacityService,
    private readonly multiTenantService: MultiTenantGovernanceService,
    private readonly billingService: CommercialBillingService,
    private readonly aiFinOpsService: AiFinOpsService,
    private readonly drService: DisasterRecoveryOrchestratorService,
    private readonly resilienceService: OperationalResilienceService
  ) {}

  // --- Demand & Capacity ---
  @Get('capacity/profile')
  getCapacityProfile(@Query('demandClass') demandClass?: string) {
    return this.demandCapacityService.getCapacityProfile(demandClass as DemandClass);
  }

  @Post('capacity/evaluate')
  evaluateCapacity(
    @Body() body: { concurrentLearners: number; requestsPerMinute: number }
  ) {
    return this.demandCapacityService.evaluateWorkloadDemand(
      body.concurrentLearners,
      body.requestsPerMinute
    );
  }

  // --- Multi-Tenant Governance ---
  @Get('tenants')
  listTenants() {
    return this.multiTenantService.listTenants();
  }

  @Post('tenants/request')
  requestTenant(
    @Body() body: { name: string; slug: string; adminEmail: string }
  ) {
    return this.multiTenantService.requestTenantProvisioning(
      body.name,
      body.slug,
      body.adminEmail
    );
  }

  @Post('tenants/:id/review')
  reviewTenant(
    @Param('id') tenantId: string,
    @Body() body: { approved: boolean }
  ) {
    return this.multiTenantService.reviewTenantRequest(tenantId, body.approved);
  }

  @Post('tenants/:id/activate')
  activateTenant(@Param('id') tenantId: string) {
    return this.multiTenantService.activateTenant(tenantId);
  }

  @Post('tenants/:id/suspend')
  suspendTenant(
    @Param('id') tenantId: string,
    @Body() body: { reason: string }
  ) {
    return this.multiTenantService.suspendTenant(tenantId, body.reason);
  }

  @Post('tenants/:id/policy')
  updateTenantPolicy(
    @Param('id') tenantId: string,
    @Body() body: Partial<TenantPolicyConfig>
  ) {
    return this.multiTenantService.updateTenantPolicy(tenantId, body);
  }

  // --- Commercial Billing ---
  @Post('billing/webhook')
  handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Headers('stripe-timestamp') timestamp: string,
    @Body() body: { rawPayload: string; eventId: string; eventType: string; eventData: any }
  ) {
    return this.billingService.verifyAndProcessWebhook({
      rawPayload: body.rawPayload,
      signatureHeader: signature,
      timestampHeader: parseInt(timestamp, 10),
      eventId: body.eventId,
      eventType: body.eventType,
      eventData: body.eventData,
    });
  }

  @Get('billing/entitlements/:tenantId')
  getEntitlements(@Param('tenantId') tenantId: string) {
    return this.billingService.getEntitlements(tenantId);
  }

  @Post('billing/enroll-seat')
  enrollSeat(@Body() body: { tenantId: string }) {
    return this.billingService.enrollLearnerInSeat(body.tenantId);
  }

  // --- AI FinOps & Kill Switches ---
  @Get('ai/budget/:tenantId')
  getAiBudget(@Param('tenantId') tenantId: string) {
    return this.aiFinOpsService.getBudget(tenantId);
  }

  @Post('ai/kill-switch')
  setKillSwitch(
    @Body()
    body: {
      target: 'GLOBAL' | 'CHILD_VOICE' | 'GENERATIVE_MEDIA' | 'TENANT';
      active: boolean;
      tenantId?: string;
    }
  ) {
    this.aiFinOpsService.setKillSwitch(body.target, body.active, body.tenantId);
    return { success: true, target: body.target, active: body.active };
  }

  // --- Disaster Recovery ---
  @Post('dr/drill/run')
  runDrDrill(@Body() body?: { drillId?: string }) {
    return this.drService.executeDrill(body?.drillId);
  }

  @Get('dr/drill/latest')
  getLatestDrill() {
    return this.drService.getLatestDrill();
  }

  // --- Health & Incidents ---
  @Get('health')
  getHealth() {
    return this.resilienceService.evaluateProductionHealth();
  }

  @Get('incidents')
  listIncidents() {
    return this.resilienceService.listIncidents();
  }

  @Post('incidents/declare')
  declareIncident(
    @Body()
    body: {
      title: string;
      severity: IncidentSeverity;
      isChildSafetyRelated: boolean;
      isCrossTenantRelated: boolean;
      commander: string;
      tenantId?: string;
    }
  ) {
    return this.resilienceService.declareIncident(body);
  }

  @Post('incidents/:id/transition')
  transitionIncident(
    @Param('id') incidentId: string,
    @Body()
    body: {
      toStatus: IncidentLifecycleState;
      actor: string;
      notes: string;
    }
  ) {
    return this.resilienceService.transitionIncidentStatus(
      incidentId,
      body.toStatus,
      body.actor,
      body.notes
    );
  }
}
