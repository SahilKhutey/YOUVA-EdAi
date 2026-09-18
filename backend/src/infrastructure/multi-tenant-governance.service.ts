import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import {
  TenantContext,
  TenantLifecycleState,
  TenantPolicyConfig,
  ManagedTenantRecord,
} from './n14-types';
import * as crypto from 'crypto';


@Injectable()
export class MultiTenantGovernanceService {
  private readonly logger = new Logger(MultiTenantGovernanceService.name);
  private tenants: Map<string, ManagedTenantRecord> = new Map();

  constructor() {
    this.seedCanonicalTenants();
  }

  private seedCanonicalTenants() {
    const dpsRkp: ManagedTenantRecord = {
      tenantId: 'tenant-dps-rkp',
      name: 'Delhi Public School R.K. Puram',
      slug: 'dps-rkp',
      lifecycleState: 'ACTIVE',
      adminEmail: 'principal@dpsrkp.edu.in',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      policyConfig: {
        tenantId: 'tenant-dps-rkp',
        allowedAgeBands: ['PRESCHOOL', 'ELEMENTARY', 'MIDDLE', 'HIGH_SCHOOL'],
        aiTutorEnabled: true,
        generativeMultimodalEnabled: true,
        maxDailyScreenMinutes: 45,
        enforceChildSafetyModeration: true,
        autonomousPurchasesAllowed: false,
        dataRetentionDays: 365,
      },
    };

    const modernSchool: ManagedTenantRecord = {
      tenantId: 'tenant-modern-vv',
      name: 'Modern School Vasant Vihar',
      slug: 'modern-vv',
      lifecycleState: 'ACTIVE',
      adminEmail: 'admin@modernschool.edu.in',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      policyConfig: {
        tenantId: 'tenant-modern-vv',
        allowedAgeBands: ['ELEMENTARY', 'MIDDLE', 'HIGH_SCHOOL'],
        aiTutorEnabled: true,
        generativeMultimodalEnabled: false,
        maxDailyScreenMinutes: 30,
        enforceChildSafetyModeration: true,
        autonomousPurchasesAllowed: false,
        dataRetentionDays: 180,
      },
    };

    this.tenants.set(dpsRkp.tenantId, dpsRkp);
    this.tenants.set(modernSchool.tenantId, modernSchool);
  }

  // --- 1. Server-Derived Tenant Context & Isolation Gate (Clauses N14.6 - N14.8) ---

  public createContext(params: {
    tenantId: string;
    actorId: string;
    role: string;
    permissions?: string[];
  }): TenantContext {
    return {
      tenantId: params.tenantId,
      actorId: params.actorId,
      role: params.role,
      permissions: params.permissions || ['READ', 'WRITE'],
      correlationId: `corr-${crypto.randomUUID()}`,
    };
  }

  public assertTenantAccess(context: TenantContext, targetTenantId: string): void {
    if (!context || !context.tenantId) {
      throw new ForbiddenException('MT-001: Missing or unauthenticated tenant context');
    }

    // Platform superadmins can access across tenants with time-limited break-glass
    if (context.role === 'PLATFORM_SUPERADMIN') {
      return;
    }

    if (context.tenantId !== targetTenantId) {
      throw new ForbiddenException(
        `MT-002: Cross-tenant access violation. Actor in tenant [${context.tenantId}] cannot access resource owned by tenant [${targetTenantId}]`
      );
    }

    // Verify tenant is in ACTIVE lifecycle status
    const tenant = this.tenants.get(context.tenantId);
    if (tenant && tenant.lifecycleState !== 'ACTIVE') {
      throw new ForbiddenException(
        `MT-018: Tenant [${context.tenantId}] is in state [${tenant.lifecycleState}]. Access denied.`
      );
    }
  }

  public assertResourceAccess(
    context: TenantContext,
    resourceOwnerTenantId: string,
    resourceType: 'LEARNER' | 'MASTERY' | 'CONTENT' | 'AI_CONTEXT' | 'EXPORT'
  ): void {
    this.assertTenantAccess(context, resourceOwnerTenantId);
  }

  // --- 2. 6-State Tenant Provisioning Lifecycle (Clause N14.11) ---

  public requestTenantProvisioning(name: string, slug: string, adminEmail: string): ManagedTenantRecord {
    if (!name || !slug || !adminEmail) {
      throw new BadRequestException('All fields required for tenant provisioning');
    }

    const tenantId = `tenant-${slug.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    if (this.tenants.has(tenantId)) {
      throw new BadRequestException(`Tenant with slug '${slug}' already exists`);
    }

    const tenant: ManagedTenantRecord = {
      tenantId,
      name,
      slug,
      lifecycleState: 'REQUESTED',
      adminEmail,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      policyConfig: {
        tenantId,
        allowedAgeBands: ['PRESCHOOL', 'ELEMENTARY'],
        aiTutorEnabled: true,
        generativeMultimodalEnabled: false,
        maxDailyScreenMinutes: 30,
        enforceChildSafetyModeration: true,
        autonomousPurchasesAllowed: false,
        dataRetentionDays: 90,
      },
    };

    this.tenants.set(tenantId, tenant);
    this.logger.log(`Tenant ${tenantId} created in state REQUESTED`);
    return tenant;
  }

  public reviewTenantRequest(tenantId: string, approved: boolean): ManagedTenantRecord {
    const tenant = this.getTenant(tenantId);
    if (tenant.lifecycleState !== 'REQUESTED') {
      throw new BadRequestException(`Cannot review tenant in status [${tenant.lifecycleState}]`);
    }

    tenant.lifecycleState = approved ? 'REVIEWED' : 'DEACTIVATED';
    tenant.updatedAt = new Date().toISOString();
    return tenant;
  }

  public activateTenant(tenantId: string): ManagedTenantRecord {
    const tenant = this.getTenant(tenantId);
    if (tenant.lifecycleState !== 'REVIEWED' && tenant.lifecycleState !== 'PROVISIONING') {
      throw new BadRequestException(`Cannot activate tenant from status [${tenant.lifecycleState}]`);
    }

    tenant.lifecycleState = 'ACTIVE';
    tenant.updatedAt = new Date().toISOString();
    delete tenant.suspensionReason;
    this.logger.log(`Tenant ${tenantId} activated`);
    return tenant;
  }

  public suspendTenant(tenantId: string, reason: string): ManagedTenantRecord {
    const tenant = this.getTenant(tenantId);
    if (tenant.lifecycleState !== 'ACTIVE') {
      throw new BadRequestException(`Cannot suspend tenant from status [${tenant.lifecycleState}]`);
    }

    tenant.lifecycleState = 'SUSPENDED';
    tenant.suspensionReason = reason;
    tenant.updatedAt = new Date().toISOString();
    this.logger.warn(`Tenant ${tenantId} SUSPENDED: ${reason}`);
    return tenant;
  }

  public reactivateTenant(tenantId: string): ManagedTenantRecord {
    const tenant = this.getTenant(tenantId);
    if (tenant.lifecycleState !== 'SUSPENDED') {
      throw new BadRequestException(`Cannot reactivate tenant from status [${tenant.lifecycleState}]`);
    }

    tenant.lifecycleState = 'ACTIVE';
    delete tenant.suspensionReason;
    tenant.updatedAt = new Date().toISOString();
    return tenant;
  }

  public deactivateTenant(tenantId: string): ManagedTenantRecord {
    const tenant = this.getTenant(tenantId);
    tenant.lifecycleState = 'DEACTIVATED';
    tenant.updatedAt = new Date().toISOString();
    return tenant;
  }

  // --- 3. Platform vs. Tenant Policy Hierarchy (Clause N14.13) ---

  public updateTenantPolicy(tenantId: string, proposed: Partial<TenantPolicyConfig>): TenantPolicyConfig {
    const tenant = this.getTenant(tenantId);

    // Hard Safety Invariant: Tenant admins cannot disable safety moderation
    if (proposed.enforceChildSafetyModeration === false) {
      throw new ForbiddenException(
        'POLICY-HIERARCHY-VIOLATION: Lower-level tenant policy cannot weaken Platform Safety Policy. Safety moderation cannot be disabled.'
      );
    }

    // Hard Commercial Invariant: Minors cannot have autonomous purchase privileges
    if (proposed.autonomousPurchasesAllowed === true) {
      throw new ForbiddenException(
        'POLICY-HIERARCHY-VIOLATION: Invariant N13.73 forbids autonomous purchases by minors.'
      );
    }

    tenant.policyConfig = {
      ...tenant.policyConfig,
      ...proposed,
      enforceChildSafetyModeration: true, // Server-enforced lock
      autonomousPurchasesAllowed: false, // Server-enforced lock
    };

    tenant.updatedAt = new Date().toISOString();
    return tenant.policyConfig;
  }

  public getTenant(tenantId: string): ManagedTenantRecord {
    const t = this.tenants.get(tenantId);
    if (!t) {
      throw new NotFoundException(`Tenant [${tenantId}] not found`);
    }
    return t;
  }

  public listTenants(): ManagedTenantRecord[] {
    return Array.from(this.tenants.values());
  }
}
