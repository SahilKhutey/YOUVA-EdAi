import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { FindingSeverity, WaiveFindingDto } from '../domain/assurance.types';

export interface WaiverValidationResult {
  allowed: boolean;
  reason: string;
}

@Injectable()
export class WaiverPolicy {
  private readonly logger = new Logger(WaiverPolicy.name);
  public static readonly MAX_WAIVER_DAYS = 90;

  validateWaiver(
    severity: FindingSeverity,
    domain: string,
    dto: WaiveFindingDto,
  ): WaiverValidationResult {
    if (!dto.waivedBy || !dto.reason || !dto.policy || !dto.expiry) {
      throw new BadRequestException('Waiver must declare waivedBy, reason, policy, and expiry date.');
    }

    const expiryDate = new Date(dto.expiry);
    const now = new Date();

    if (isNaN(expiryDate.getTime()) || expiryDate <= now) {
      return {
        allowed: false,
        reason: 'Waiver expiry date must be in the future.',
      };
    }

    const maxExpiry = new Date(now.getTime() + WaiverPolicy.MAX_WAIVER_DAYS * 24 * 60 * 60 * 1000);
    if (expiryDate > maxExpiry) {
      return {
        allowed: false,
        reason: `Waiver duration cannot exceed ${WaiverPolicy.MAX_WAIVER_DAYS} days. Permanent waivers are prohibited.`,
      };
    }

    // Critical security findings require explicit governance approval
    if (domain === 'SECURITY' && severity === 'CRITICAL') {
      if (!dto.scope || !dto.scope.includes('SECURITY_GOVERNANCE_OVERRIDE')) {
        return {
          allowed: false,
          reason: 'Critical security findings cannot be waived without explicit SECURITY_GOVERNANCE_OVERRIDE scope.',
        };
      }
    }

    return {
      allowed: true,
      reason: `Waiver granted until ${expiryDate.toISOString()} under policy '${dto.policy}'.`,
    };
  }
}
