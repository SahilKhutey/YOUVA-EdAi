import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  LearningPolicyContext,
  PolicyDecision,
} from './policy.types';

/**
 * Enforces consent requirement before any data processing or personalization occurs.
 */
export function denyIfConsentMissing(
  consentGranted: boolean,
  policyVersion: string,
): PolicyDecision {
  if (!consentGranted) {
    return {
      allowed: false,
      requiresHumanApproval: false,
      reasonCode: 'CONSENT_REQUIRED',
      policyVersion,
    };
  }

  return {
    allowed: true,
    requiresHumanApproval: false,
    reasonCode: 'ALLOWED',
    policyVersion,
  };
}

/**
 * Calculates absolute demographic or subgroup fairness discrepancy.
 */
export function fairnessGap(groupA: number, groupB: number): number {
  return Math.abs(groupA - groupB);
}

/**
 * Computes individual prediction calibration error.
 */
export function absolutePredictionError(predicted: number, actual: number): number {
  return Math.abs(predicted - actual);
}

@Injectable()
export class PolicyService {
  public static readonly DEFAULT_VERSION = '1.0.0';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registers a versioned learning policy artifact for long-term auditable compliance.
   */
  async createPolicyVersion(policyKey: string, version: string, definition: string) {
    const prismaClient = this.prisma as any;
    return prismaClient.policyVersion.upsert({
      where: {
        policyKey_version: { policyKey, version },
      },
      create: {
        policyKey,
        version,
        definition,
        status: 'DRAFT',
      },
      update: {
        definition,
      },
    });
  }

  /**
   * Approves a policy version for authoritative evaluation.
   */
  async approvePolicyVersion(id: string, approvedBy: string) {
    const prismaClient = this.prisma as any;
    const policy = await prismaClient.policyVersion.findUnique({ where: { id } });
    if (!policy) {
      throw new NotFoundException(`Policy version '${id}' not found`);
    }

    return prismaClient.policyVersion.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date(),
      },
    });
  }

  /**
   * Retrieves the currently active/approved policy version for a key.
   */
  async getActivePolicy(policyKey: string) {
    const prismaClient = this.prisma as any;
    const policy = await prismaClient.policyVersion.findFirst({
      where: {
        policyKey,
        status: 'APPROVED',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!policy) {
      return {
        policyKey,
        version: PolicyService.DEFAULT_VERSION,
        definition: JSON.stringify({ defaultConsentRequired: true }),
        status: 'APPROVED',
      };
    }
    return policy;
  }

  /**
   * Evaluates comprehensive educational policy over contextual learner request.
   */
  async evaluateContext(context: LearningPolicyContext): Promise<PolicyDecision> {
    const activePolicy = await this.getActivePolicy('GLOBAL_LEARNING_POLICY');
    const consentGranted = Boolean(context.consent?.personalization !== false);

    const consentDecision = denyIfConsentMissing(consentGranted, activePolicy.version);
    if (!consentDecision.allowed) {
      return consentDecision;
    }

    // Invariant: Institutional authority actions cannot be executed autonomously
    const prohibited = [
      'MODIFY_MASTERY',
      'MODIFY_CONSENT',
      'MODIFY_ROLE',
      'CLOSE_SAFETY_CASE',
      'DELETE_LEARNER',
      'CHANGE_BILLING',
    ];
    if (prohibited.includes(context.action)) {
      return {
        allowed: false,
        requiresHumanApproval: false,
        reasonCode: 'PROHIBITED_AUTHORITY_ACTION',
        policyVersion: activePolicy.version,
      };
    }

    return {
      allowed: true,
      requiresHumanApproval: false,
      reasonCode: 'ALLOWED',
      policyVersion: activePolicy.version,
    };
  }
}
