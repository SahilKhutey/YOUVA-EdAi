import { Injectable, Logger, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  EnterpriseRole,
  InstitutionalPolicy,
  InstitutionalTenantScope,
  EffectivePolicy,
} from './n16-types';

@Injectable()
export class InstitutionalPolicyEngineService {
  private readonly logger = new Logger(InstitutionalPolicyEngineService.name);

  private readonly policies = new Map<string, InstitutionalPolicy>();
  private readonly userRoleAssignments = new Map<string, { role: EnterpriseRole; scope: InstitutionalTenantScope }>();

  constructor() {
    this.seedPlatformBaselinePolicy();
  }

  private seedPlatformBaselinePolicy(): void {
    const platformPolicy: InstitutionalPolicy = {
      policyId: 'pol-platform-baseline',
      scopeLevel: 'PLATFORM',
      targetId: 'platform-global',
      aiUsageRules: {
        maxAutonomyClass: 'A4_CONDITIONAL_AUTONOMOUS',
        allowedTools: ['tool-curriculum-search', 'tool-practice-generator', 'tool-voice-synthesis'],
        reauthorizationDays: 90,
      },
      childSafetyRules: {
        enforceChildSafety: true,
        autoEscalationSeconds: 120,
      },
      contentRules: {
        requireSmeReview: true,
        allowGenerativeAssets: true,
      },
      assessmentRules: {
        lockSummativeDuringExam: true,
        proctoringLevel: 'BROWSER_LOCK',
      },
      dataRetentionRules: {
        learnerDataMonths: 84, // 7 years
        auditLogYears: 10,
      },
      freezeActive: false,
      version: '1.0.0',
      updatedAt: new Date().toISOString(),
    };

    this.policies.set(platformPolicy.policyId, platformPolicy);
    this.policies.set('PLATFORM', platformPolicy);
  }

  // --- 1. Institutional Tenant Policy Registration & Configuration (Clause N16.10) ---

  public configurePolicy(policy: InstitutionalPolicy): InstitutionalPolicy {
    // Invariant N16.10 & N16.11: Safety Minimum Check
    if (policy.childSafetyRules.enforceChildSafety === false) {
      throw new ForbiddenException(
        'POL-001: Platform Safety Floor Violation. Child safety moderation cannot be disabled at any institutional tier.'
      );
    }

    if (policy.childSafetyRules.autoEscalationSeconds > 300) {
      throw new BadRequestException(
        'POL-002: Safety Escalation Threshold Exceeded. Escalation window cannot exceed 300 seconds.'
      );
    }

    this.policies.set(policy.policyId, { ...policy, updatedAt: new Date().toISOString() });
    this.policies.set(`${policy.scopeLevel}:${policy.targetId}`, { ...policy, updatedAt: new Date().toISOString() });
    this.logger.log(`Configured InstitutionalPolicy [${policy.policyId}] for scope [${policy.scopeLevel}:${policy.targetId}]`);
    return policy;
  }

  public getPolicy(policyId: string): InstitutionalPolicy {
    const p = this.policies.get(policyId);
    if (!p) {
      throw new NotFoundException(`POL-003: Policy [${policyId}] not found`);
    }
    return p;
  }

  // --- 2. Hierarchical Policy Inheritance Resolver (Clause N16.11) ---

  public resolveEffectivePolicy(scope: InstitutionalTenantScope, jurisdictionId?: string): EffectivePolicy {
    const inheritanceChain: string[] = ['PLATFORM:platform-global'];
    const platformPolicy = this.policies.get('PLATFORM')!;

    // Baseline values from Platform
    let maxAutonomyClass = platformPolicy.aiUsageRules.maxAutonomyClass;
    let allowedTools = [...platformPolicy.aiUsageRules.allowedTools];
    let enforceChildSafety = platformPolicy.childSafetyRules.enforceChildSafety;
    let autoEscalationSeconds = platformPolicy.childSafetyRules.autoEscalationSeconds;
    let requireSmeReview = platformPolicy.contentRules.requireSmeReview;
    let allowGenerativeAssets = platformPolicy.contentRules.allowGenerativeAssets;
    let lockSummativeDuringExam = platformPolicy.assessmentRules.lockSummativeDuringExam;
    let proctoringLevel = platformPolicy.assessmentRules.proctoringLevel;
    let learnerDataMonths = platformPolicy.dataRetentionRules.learnerDataMonths;
    let auditLogYears = platformPolicy.dataRetentionRules.auditLogYears;
    let freezeActive = platformPolicy.freezeActive;
    let freezeReason = platformPolicy.freezeReason;

    // 1. Jurisdiction tier
    if (jurisdictionId) {
      const jurKey = `JURISDICTION:${jurisdictionId}`;
      const jurPolicy = this.policies.get(jurKey);
      if (jurPolicy) {
        inheritanceChain.push(jurKey);
        freezeActive = freezeActive || jurPolicy.freezeActive;
        if (jurPolicy.freezeActive) freezeReason = jurPolicy.freezeReason;
      }
    }

    // 2. Organization tier
    if (scope.organizationId) {
      const orgKey = `ORGANIZATION:${scope.organizationId}`;
      const orgPolicy = this.policies.get(orgKey);
      if (orgPolicy) {
        inheritanceChain.push(orgKey);
        freezeActive = freezeActive || orgPolicy.freezeActive;
        if (orgPolicy.freezeActive) freezeReason = orgPolicy.freezeReason;
        requireSmeReview = requireSmeReview || orgPolicy.contentRules.requireSmeReview;
      }
    }

    // 3. Institution tier
    if (scope.institutionId) {
      const instKey = `INSTITUTION:${scope.institutionId}`;
      const instPolicy = this.policies.get(instKey);
      if (instPolicy) {
        inheritanceChain.push(instKey);
        freezeActive = freezeActive || instPolicy.freezeActive;
        if (instPolicy.freezeActive) freezeReason = instPolicy.freezeReason;
        proctoringLevel = instPolicy.assessmentRules.proctoringLevel;
        lockSummativeDuringExam = lockSummativeDuringExam || instPolicy.assessmentRules.lockSummativeDuringExam;
      }
    }

    // 4. Class tier
    if (scope.classId) {
      const classKey = `CLASS:${scope.classId}`;
      const classPolicy = this.policies.get(classKey);
      if (classPolicy) {
        inheritanceChain.push(classKey);
        freezeActive = freezeActive || classPolicy.freezeActive;
        if (classPolicy.freezeActive) freezeReason = classPolicy.freezeReason;
      }
    }

    return {
      resolvedScope: scope,
      maxAutonomyClass,
      allowedTools,
      enforceChildSafety, // Never weakened
      autoEscalationSeconds,
      requireSmeReview,
      allowGenerativeAssets,
      lockSummativeDuringExam,
      proctoringLevel,
      learnerDataMonths,
      auditLogYears,
      freezeActive,
      freezeReason,
      inheritanceChain,
    };
  }

  // --- 3. Institutional Change Freeze Controller (Clause N16.108) ---

  public setPolicyFreeze(params: {
    scopeLevel: 'PLATFORM' | 'JURISDICTION' | 'ORGANIZATION' | 'INSTITUTION' | 'CLASS';
    targetId: string;
    active: boolean;
    reason: string;
    operatorId: string;
  }): boolean {
    const key = `${params.scopeLevel}:${params.targetId}`;
    let p = this.policies.get(key);

    if (!p) {
      p = {
        policyId: `freeze-${params.scopeLevel.toLowerCase()}-${params.targetId}`,
        scopeLevel: params.scopeLevel,
        targetId: params.targetId,
        aiUsageRules: {
          maxAutonomyClass: 'A2_RECOMMENDATION',
          allowedTools: [],
          reauthorizationDays: 30,
        },
        childSafetyRules: {
          enforceChildSafety: true,
          autoEscalationSeconds: 120,
        },
        contentRules: {
          requireSmeReview: true,
          allowGenerativeAssets: false,
        },
        assessmentRules: {
          lockSummativeDuringExam: true,
          proctoringLevel: 'BROWSER_LOCK',
        },
        dataRetentionRules: {
          learnerDataMonths: 84,
          auditLogYears: 10,
        },
        freezeActive: params.active,
        freezeReason: params.reason,
        version: '1.0.0',
        updatedAt: new Date().toISOString(),
      };
    } else {
      p.freezeActive = params.active;
      p.freezeReason = params.active ? params.reason : undefined;
      p.updatedAt = new Date().toISOString();
    }

    this.policies.set(key, p);
    this.policies.set(p.policyId, p);
    this.logger.warn(
      `Institutional Change Freeze for [${key}] set to [${params.active}] by [${params.operatorId}]. Reason: ${params.reason}`
    );
    return params.active;
  }

  // --- 4. Enterprise RBAC & Scope Authorization (Clauses N16.8 - N16.9) ---

  public assignUserRole(userId: string, role: EnterpriseRole, scope: InstitutionalTenantScope): void {
    this.userRoleAssignments.set(userId, { role, scope });
    this.logger.log(`Assigned EnterpriseRole [${role}] to user [${userId}] with scope [${JSON.stringify(scope)}]`);
  }

  public assertRoleScope(userId: string, targetScope: InstitutionalTenantScope, requiredRole?: EnterpriseRole): boolean {
    const assignment = this.userRoleAssignments.get(userId);
    if (!assignment) {
      throw new ForbiddenException(`RBAC-001: User [${userId}] has no assigned enterprise role`);
    }

    // Role verification
    if (requiredRole && assignment.role !== requiredRole && assignment.role !== 'PLATFORM_ADMIN') {
      throw new ForbiddenException(
        `RBAC-002: Insufficient privileges. Required role [${requiredRole}], user possesses [${assignment.role}]`
      );
    }

    // Scope verification
    if (assignment.role === 'PLATFORM_ADMIN') {
      return true; // Global scope
    }

    if (assignment.role === 'ORGANIZATION_ADMIN') {
      if (assignment.scope.organizationId !== targetScope.organizationId) {
        throw new ForbiddenException('RBAC-003: Tenant scope mismatch. Cannot manage outside assigned Organization.');
      }
      return true;
    }

    if (assignment.scope.institutionId !== targetScope.institutionId) {
      throw new ForbiddenException('RBAC-004: Tenant scope mismatch. Cannot operate outside assigned Institution.');
    }

    return true;
  }
}
