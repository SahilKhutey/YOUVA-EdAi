import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  HumanCapabilityPassport,
  PassportCapability,
  PassportExperience,
  SelectiveDisclosureToken,
  ExperienceEvidence,
} from './n22-types';
import * as crypto from 'crypto';

@Injectable()
export class CapabilityPassportService {
  private readonly passports = new Map<string, HumanCapabilityPassport>();
  private readonly evidenceRecords = new Map<string, ExperienceEvidence>();

  /**
   * Retrieves or initializes a sovereign Human Capability Passport.
   */
  getOrCreatePassport(
    learnerId: string,
    ownerPublicKey?: string,
  ): HumanCapabilityPassport {
    if (!learnerId) {
      throw new BadRequestException('Learner ID is required');
    }

    let passport = this.passports.get(learnerId);
    if (!passport) {
      passport = {
        passportId: `passport_${learnerId}_${Date.now()}`,
        learnerId,
        ownerPublicKey: ownerPublicKey || `pubkey_${crypto.randomBytes(8).toString('hex')}`,
        disclosedSections: ['CAPABILITIES', 'EXPERIENCES'],
        capabilities: [],
        experiences: [],
        activeDisclosures: [],
        updatedAt: new Date().toISOString(),
      };
      this.passports.set(learnerId, passport);
    }
    return passport;
  }

  getLearnerPassport(learnerId: string): HumanCapabilityPassport | undefined {
    return this.passports.get(learnerId);
  }

  /**
   * Adds a validated capability to the learner's passport.
   */
  addCapability(
    learnerId: string,
    capability: PassportCapability,
  ): HumanCapabilityPassport {
    const passport = this.getOrCreatePassport(learnerId);
    const existingIndex = passport.capabilities.findIndex(
      (c) => c.capabilityId === capability.capabilityId,
    );

    if (existingIndex >= 0) {
      passport.capabilities[existingIndex] = {
        ...capability,
        validatedAt: new Date().toISOString(),
      };
    } else {
      passport.capabilities.push({
        ...capability,
        validatedAt: capability.validatedAt || new Date().toISOString(),
      });
    }

    passport.updatedAt = new Date().toISOString();
    return passport;
  }

  /**
   * Adds an experience record to the learner's passport.
   */
  addExperience(
    learnerId: string,
    experience: PassportExperience,
  ): HumanCapabilityPassport {
    const passport = this.getOrCreatePassport(learnerId);
    passport.experiences.push(experience);
    passport.updatedAt = new Date().toISOString();
    return passport;
  }

  /**
   * Invariant N22.33–N22.37: Sovereign Selective Disclosure.
   * Generates a purpose-bound, expiring disclosure token for specific capabilities only.
   */
  createSelectiveDisclosure(
    learnerId: string,
    recipientId: string,
    purpose: string,
    capabilityIds: string[],
    ttlMinutes: number = 1440, // 24 hours default
  ): SelectiveDisclosureToken {
    const passport = this.getOrCreatePassport(learnerId);
    if (!recipientId || !purpose) {
      throw new BadRequestException('Recipient ID and purpose are required');
    }

    const token = `sdt_${crypto.randomBytes(16).toString('hex')}`;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();

    const disclosureToken: SelectiveDisclosureToken = {
      token,
      recipientId,
      purpose,
      disclosedCapabilityIds: capabilityIds,
      expiresAt,
      revoked: false,
    };

    passport.activeDisclosures.push(disclosureToken);
    passport.updatedAt = new Date().toISOString();
    return disclosureToken;
  }

  /**
   * Verifies a selective disclosure token for a given recipient.
   */
  verifyDisclosureToken(
    token: string,
    recipientId: string,
  ): {
    valid: boolean;
    disclosedCapabilities?: PassportCapability[];
    reason?: string;
  } {
    for (const passport of this.passports.values()) {
      const match = passport.activeDisclosures.find((d) => d.token === token);
      if (match) {
        if (match.revoked) {
          return { valid: false, reason: 'Token has been revoked by the learner' };
        }
        if (new Date(match.expiresAt).getTime() < Date.now()) {
          return { valid: false, reason: 'Token has expired' };
        }
        if (match.recipientId !== recipientId && match.recipientId !== '*') {
          return { valid: false, reason: 'Token is not authorized for this recipient' };
        }

        // Return only the explicitly disclosed capabilities
        const capabilities = passport.capabilities.filter((c) =>
          match.disclosedCapabilityIds.includes(c.capabilityId),
        );

        return { valid: true, disclosedCapabilities: capabilities };
      }
    }
    return { valid: false, reason: 'Token not found' };
  }

  /**
   * Revokes an active selective disclosure token immediately.
   */
  revokeDisclosure(learnerId: string, token: string): boolean {
    const passport = this.passports.get(learnerId);
    if (!passport) {
      throw new NotFoundException(`Passport for learner ${learnerId} not found`);
    }

    const disclosure = passport.activeDisclosures.find((d) => d.token === token);
    if (!disclosure) {
      return false;
    }

    disclosure.revoked = true;
    passport.updatedAt = new Date().toISOString();
    return true;
  }

  /**
   * Invariant N22.26–N22.28: Disclosed AI Assistance & No Fabricated Evidence.
   * Submits experience evidence ensuring transparent AI assistance declarations.
   */
  submitExperienceEvidence(evidence: Partial<ExperienceEvidence>): ExperienceEvidence {
    if (!evidence.learnerId || !evidence.experienceId || !evidence.artifactUri) {
      throw new BadRequestException(
        'learnerId, experienceId, and artifactUri are required',
      );
    }

    if (evidence.aiAssistanceDisclosed && !evidence.aiAssistanceDetails) {
      throw new BadRequestException(
        'AI assistance was declared but details of AI contributions were omitted',
      );
    }

    const record: ExperienceEvidence = {
      id: evidence.id || `ev_${crypto.randomBytes(8).toString('hex')}`,
      learnerId: evidence.learnerId,
      experienceId: evidence.experienceId,
      artifactUri: evidence.artifactUri,
      aiAssistanceDisclosed: !!evidence.aiAssistanceDisclosed,
      aiAssistanceDetails: evidence.aiAssistanceDetails,
      validationStatus: evidence.validationStatus || 'PENDING',
      validatorAuthority: evidence.validatorAuthority || 'YOUVA_EVIDENCE_ENGINE',
      submittedAt: new Date().toISOString(),
    };

    this.evidenceRecords.set(record.id, record);
    return record;
  }

  validateExperienceEvidence(
    evidenceId: string,
    status: 'VALIDATED' | 'DISPUTED' | 'REJECTED',
    validatorAuthority: string,
  ): ExperienceEvidence {
    const record = this.evidenceRecords.get(evidenceId);
    if (!record) {
      throw new NotFoundException(`Evidence ${evidenceId} not found`);
    }

    record.validationStatus = status;
    record.validatorAuthority = validatorAuthority;
    return record;
  }

  getEvidence(evidenceId: string): ExperienceEvidence | undefined {
    return this.evidenceRecords.get(evidenceId);
  }
}
