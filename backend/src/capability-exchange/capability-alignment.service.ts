import { Injectable, BadRequestException } from '@nestjs/common';
import {
  Opportunity,
  PassportCapability,
  CapabilityAlignmentResult,
  ProficiencyLevel,
} from './n22-types';

const PROFICIENCY_RANKS: Record<ProficiencyLevel, number> = {
  INTRODUCTORY: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
  EXPERT: 4,
};

@Injectable()
export class CapabilityAlignmentService {
  /**
   * Calculates explainable capability alignment between a learner and an opportunity.
   * Invariant N22.4 & N22.5: Evidence Over Prediction & Boundary Preservation.
   * Predictive employment success scores and ranking are strictly prohibited.
   */
  calculateAlignment(
    learnerId: string,
    learnerCapabilities: PassportCapability[],
    learnerSkills: Array<{ skillId: string; name: string; level: number }>,
    opportunity: Opportunity,
  ): CapabilityAlignmentResult {
    if (!learnerId || !opportunity) {
      throw new BadRequestException('Learner ID and Opportunity must be provided');
    }

    const demonstratedRequirements: string[] = [];
    const evidenceGaps: string[] = [];
    const recommendedPreparation: string[] = [];

    let totalRequirementsCount = 0;
    let satisfiedRequirementsCount = 0;

    // 1. Evaluate Capability Requirements
    for (const capReq of opportunity.capabilityRequirements || []) {
      totalRequirementsCount++;
      const minRank = PROFICIENCY_RANKS[capReq.minimumProficiency] || 1;

      const matchedCap = (learnerCapabilities || []).find(
        (c) =>
          c.capabilityId.toLowerCase() === capReq.capabilityId.toLowerCase() ||
          c.name.toLowerCase() === capReq.name.toLowerCase(),
      );

      if (matchedCap) {
        const learnerRank = PROFICIENCY_RANKS[matchedCap.proficiency] || 1;
        if (learnerRank >= minRank) {
          demonstratedRequirements.push(
            `Capability: ${capReq.name} (Requires ${capReq.minimumProficiency}, Demonstrated: ${matchedCap.proficiency})`,
          );
          satisfiedRequirementsCount++;
        } else {
          evidenceGaps.push(
            `Capability: ${capReq.name} (Demonstrated ${matchedCap.proficiency} is below required ${capReq.minimumProficiency})`,
          );
          recommendedPreparation.push(
            `Advance competency in ${capReq.name} through supervised practice to achieve ${capReq.minimumProficiency} level.`,
          );
        }
      } else {
        evidenceGaps.push(
          `Capability: ${capReq.name} (No validated evidence found for required ${capReq.minimumProficiency})`,
        );
        recommendedPreparation.push(
          `Complete curriculum modules or peer-reviewed projects addressing ${capReq.name}.`,
        );
      }
    }

    // 2. Evaluate Skill Requirements
    for (const skillReq of opportunity.skillRequirements || []) {
      totalRequirementsCount++;
      const matchedSkill = (learnerSkills || []).find(
        (s) =>
          s.skillId.toLowerCase() === skillReq.skillId.toLowerCase() ||
          s.name.toLowerCase() === skillReq.name.toLowerCase(),
      );

      if (matchedSkill) {
        if (matchedSkill.level >= skillReq.level) {
          demonstratedRequirements.push(
            `Skill: ${skillReq.name} (Requires Level ${skillReq.level}, Demonstrated: Level ${matchedSkill.level})`,
          );
          satisfiedRequirementsCount++;
        } else {
          evidenceGaps.push(
            `Skill: ${skillReq.name} (Demonstrated Level ${matchedSkill.level} is below required Level ${skillReq.level})`,
          );
          recommendedPreparation.push(
            `Engage in applied exercises targeting skill '${skillReq.name}' to reach Level ${skillReq.level}.`,
          );
        }
      } else {
        evidenceGaps.push(
          `Skill: ${skillReq.name} (Requires Level ${skillReq.level}, not demonstrated)`,
        );
        recommendedPreparation.push(
          `Acquire foundational proficiency in '${skillReq.name}' via recommended learning pathways.`,
        );
      }
    }

    // Calculate alignment percentage strictly based on empirical criteria
    const alignmentPercentage =
      totalRequirementsCount === 0
        ? 100
        : Math.round((satisfiedRequirementsCount / totalRequirementsCount) * 100);

    // Constitutional Invariant N22.114: Zero Pay-to-Win Matching.
    // Sponsored opportunities do NOT receive an alignment boost.

    const matchingExplanation =
      `Empirical capability alignment: ${satisfiedRequirementsCount} of ${totalRequirementsCount} requirements demonstrated. ` +
      `Consequential employment suitability or success prediction is constitutionally barred under YOUVA-N22-CHARTER-2026.`;

    return {
      opportunityId: opportunity.id,
      learnerId,
      demonstratedRequirements,
      evidenceGaps,
      recommendedPreparation,
      alignmentPercentage,
      consequentialPredictionProhibited: true,
      matchingExplanation,
      evaluatedAt: new Date().toISOString(),
    };
  }
}
