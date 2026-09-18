import { Injectable, Logger } from '@nestjs/common';
import {
  SkillsPassport,
  SkillsPassportItem,
  CredentialRecord,
} from './credential-types';
import { LearningEvidenceService } from './learning-evidence.service';
import { SkillTaxonomyService } from './skill-taxonomy.service';
import { CredentialLifecycleService } from './credential-lifecycle.service';
import { CredentialPolicyService } from './credential-policy.service';

@Injectable()
export class SkillsPassportService {
  private readonly logger = new Logger(SkillsPassportService.name);

  constructor(
    private readonly evidenceService: LearningEvidenceService,
    private readonly taxonomyService: SkillTaxonomyService,
    private readonly lifecycleService: CredentialLifecycleService,
    private readonly policyService: CredentialPolicyService,
  ) {}

  /**
   * Generates a fully transparent, evidence-backed Skills Passport for a learner (Clauses N12.15 - N12.16).
   */
  generatePassport(learnerId: string, tenantId: string = 'default-tenant'): SkillsPassport {
    const allEvidence = this.evidenceService.getLearnerEvidence(learnerId, tenantId);
    const credentials = this.lifecycleService.listLearnerCredentials(learnerId, tenantId);

    // Group evidence by skill
    const skillIds = Array.from(new Set(allEvidence.map(e => e.skillId)));
    const passportItems: SkillsPassportItem[] = [];

    for (const sId of skillIds) {
      const summary = this.evidenceService.aggregateSkillEvidence(learnerId, sId, tenantId);
      let skillName = sId;
      let domain = 'GENERAL';
      let level = 'INTERMEDIATE';

      try {
        const def = this.taxonomyService.getSkill(sId);
        skillName = def.name;
        domain = def.domain;
        level = def.level;
      } catch {
        // Fallback
      }

      // Find credentials that required this skill
      const linkedCredIds = credentials
        .filter(c => {
          try {
            const pol = this.policyService.getPolicy(c.policyId);
            return pol.requiredSkills.includes(sId) && c.status === 'ACTIVE';
          } catch {
            return false;
          }
        })
        .map(c => c.credentialId);

      const latestEvidence = allEvidence
        .filter(e => e.skillId === sId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

      passportItems.push({
        skillId: sId,
        name: skillName,
        domain,
        level,
        masteryScore: summary.averageScore,
        evidenceCount: summary.evidenceCount,
        qualityLevelMax: summary.qualityLevelMax,
        demonstratedAt: latestEvidence ? latestEvidence.createdAt : new Date().toISOString(),
        credentialIds: linkedCredIds,
      });
    }

    const passport: SkillsPassport = {
      learnerId,
      tenantId,
      generatedAt: new Date().toISOString(),
      version: 'v1.0-n12',
      totalSkillsDemonstrated: passportItems.length,
      totalEvidenceItems: allEvidence.length,
      totalCredentialsIssued: credentials.filter(c => c.status === 'ACTIVE').length,
      skills: passportItems,
      credentials: credentials.map(c => {
        let title = c.policyId;
        try {
          title = this.policyService.getPolicy(c.policyId).title;
        } catch {}
        return {
          credentialId: c.credentialId,
          title,
          issuedAt: c.issuedAt || c.createdAt,
          status: c.status,
          policyId: c.policyId,
        };
      }),
    };

    this.logger.log(`Generated Skills Passport for learner ${learnerId} with ${passportItems.length} skills.`);
    return passport;
  }
}
