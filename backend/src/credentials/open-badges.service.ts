import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { OpenBadgeAssertion, CredentialRecord, CredentialPolicy } from './credential-types';
import { SkillTaxonomyService } from './skill-taxonomy.service';

@Injectable()
export class OpenBadgesService {
  private readonly logger = new Logger(OpenBadgesService.name);

  constructor(private readonly taxonomyService: SkillTaxonomyService) {}

  generateBadgeAssertion(
    credential: CredentialRecord,
    policy: CredentialPolicy,
    options?: { salt?: string; recipientEmail?: string }
  ): OpenBadgeAssertion {
    const salt = options?.salt || 'youva-badge-salt-2026';
    const rawRecipient = options?.recipientEmail || credential.learnerId;
    const recipientHash = 'sha256$' + crypto.createHash('sha256').update(rawRecipient + salt).digest('hex');

    const alignments = policy.requiredSkills.map(skillId => {
      try {
        const skill = this.taxonomyService.getSkill(skillId);
        return {
          targetName: skill.name,
          targetUrl: `https://youva.ed.ai/skills/${skillId}`,
          targetDescription: skill.description,
        };
      } catch {
        return {
          targetName: skillId,
          targetUrl: `https://youva.ed.ai/skills/${skillId}`,
        };
      }
    });

    const assertion: OpenBadgeAssertion = {
      '@context': 'https://w3id.org/openbadges/v2',
      id: `https://youva.ed.ai/badges/assertions/${credential.credentialId}`,
      type: 'Assertion',
      recipient: {
        type: 'email',
        hashed: true,
        identity: recipientHash,
        salt,
      },
      badge: {
        id: `https://youva.ed.ai/badges/classes/${policy.credentialId}`,
        type: 'BadgeClass',
        name: policy.title,
        description: policy.description,
        image: `https://assets.youva.ed.ai/badges/${policy.credentialId}.png`,
        criteria: {
          narrative: `Earned by demonstrating verifiable evidence in ${policy.domain} according to policy ${policy.policyVersion}.`,
        },
        issuer: {
          id: 'https://youva.ed.ai/issuer',
          type: 'Issuer',
          name: 'YOUVA-EdAI Accredited Issuer',
          url: 'https://youva.ed.ai',
        },
        alignment: alignments,
      },
      issuedOn: credential.issuedAt || new Date().toISOString(),
      expires: credential.expiresAt,
      evidence: credential.evidenceIds.map(id => ({
        id: `https://youva.ed.ai/evidence/${id}`,
        type: 'LearningEvidence',
        narrative: `Verified learner evidence artifact ${id}`,
      })),
      verification: {
        type: 'hosted',
        verificationProperty: `https://youva.ed.ai/verify/${credential.credentialId}`,
      },
    };

    return assertion;
  }
}
