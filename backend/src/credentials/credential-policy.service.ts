import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { CredentialPolicy, LearningEvidenceType, EvidenceQualityLevel } from './credential-types';
import { LearningEvidenceService } from './learning-evidence.service';

export interface EligibilityResult {
  policyId: string;
  policyVersion: string;
  learnerId: string;
  isEligible: boolean;
  requiresTeacherApproval: boolean;
  reasons: string[];
  missingSkills: string[];
  evidenceQualityMet: boolean;
  evidenceCountMet: boolean;
  masteryMet: boolean;
  eligibleEvidenceIds: string[];
}

@Injectable()
export class CredentialPolicyService {
  private readonly logger = new Logger(CredentialPolicyService.name);
  private readonly policies = new Map<string, CredentialPolicy>();

  constructor(private readonly evidenceService: LearningEvidenceService) {
    this.seedDefaultPolicies();
  }

  private seedDefaultPolicies(): void {
    const defaultPolicies: CredentialPolicy[] = [
      {
        credentialId: 'CRED-HS-CS-01',
        title: 'High-School Computational Thinking & Systems',
        description: 'Demonstrated mastery in computational decomposition, abstraction, and fault-tolerant debugging.',
        domain: 'COMPUTATIONAL_THINKING',
        requiredSkills: ['CT-DECOMP', 'CT-ABSTRACTION', 'CT-DEBUG'],
        minimumMastery: 0.75,
        minimumEvidenceCount: 3,
        requiredEvidenceTypes: ['ASSESSMENT', 'PROJECT', 'TEACHER_REVIEW'],
        minimumQualityLevel: 3,
        teacherApprovalRequired: true,
        policyVersion: 'v1.0.0',
        validityDays: 730, // 2 years
      },
      {
        credentialId: 'CRED-HS-AI-01',
        title: 'Applied AI Literacy & Responsible Use',
        description: 'Demonstrated ability to calibrate AI hallucinations, engineer verified prompts, and detect algorithmic bias.',
        domain: 'AI_LITERACY',
        requiredSkills: ['AI-FOUNDATIONS', 'AI-LIMITS-HALLUCINATION', 'AI-PROMPT-VERIFY', 'AI-ETHICS-BIAS'],
        minimumMastery: 0.80,
        minimumEvidenceCount: 4,
        requiredEvidenceTypes: ['ASSESSMENT', 'PROJECT', 'TEACHER_REVIEW'],
        minimumQualityLevel: 3,
        teacherApprovalRequired: true,
        policyVersion: 'v1.0.0',
        validityDays: 730,
      },
      {
        credentialId: 'CRED-HS-DS-01',
        title: 'Data Science & Statistical Inference',
        description: 'Demonstrated capability in data cleaning, exploratory data analysis, and statistical hypothesis testing.',
        domain: 'DATA_SCIENCE',
        requiredSkills: ['DS-DATA-CLEANING', 'DS-EXPLORATORY-ANALYSIS', 'DS-STATS-INFERENCE'],
        minimumMastery: 0.75,
        minimumEvidenceCount: 3,
        requiredEvidenceTypes: ['ASSESSMENT', 'PROJECT'],
        minimumQualityLevel: 2,
        teacherApprovalRequired: false,
        policyVersion: 'v1.0.0',
        validityDays: 730,
      },
      {
        credentialId: 'CRED-HS-CAPSTONE',
        title: 'Senior High-School Engineering Capstone',
        description: 'End-to-end verified design, implementation, testing, and teacher defense of a substantial software system.',
        domain: 'SOFTWARE_ENGINEERING',
        requiredSkills: ['CT-DECOMP', 'CT-ALGO', 'SE-MODULAR-DESIGN', 'SE-SECURE-CODING'],
        minimumMastery: 0.85,
        minimumEvidenceCount: 5,
        requiredEvidenceTypes: ['ASSESSMENT', 'PROJECT', 'TEACHER_REVIEW', 'PERFORMANCE'],
        minimumQualityLevel: 4,
        teacherApprovalRequired: true,
        policyVersion: 'v1.0.0',
        validityDays: 1095, // 3 years
      },
    ];

    for (const policy of defaultPolicies) {
      this.policies.set(policy.credentialId, policy);
    }
    this.logger.log(`Initialized Credential Policies with ${this.policies.size} curricula.`);
  }

  getPolicy(policyId: string): CredentialPolicy {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new NotFoundException(`Credential policy '${policyId}' not found.`);
    }
    return policy;
  }

  listPolicies(): CredentialPolicy[] {
    return Array.from(this.policies.values());
  }

  registerPolicy(policy: CredentialPolicy): CredentialPolicy {
    if (!policy.credentialId || !policy.policyVersion || !policy.requiredSkills) {
      throw new BadRequestException('Invalid policy definition: missing credentialId, policyVersion, or requiredSkills.');
    }
    this.policies.set(policy.credentialId, policy);
    return policy;
  }

  /**
   * Evaluates credential eligibility deterministically against validated evidence (Clauses N12.11 - N12.12).
   */
  evaluateEligibility(policyId: string, learnerId: string, tenantId?: string): EligibilityResult {
    const policy = this.getPolicy(policyId);
    const reasons: string[] = [];
    const missingSkills: string[] = [];
    const eligibleEvidenceIds: string[] = [];

    const allLearnerEvidence = this.evidenceService.getLearnerEvidence(learnerId, tenantId);

    // 1. Check required skills coverage
    for (const skillId of policy.requiredSkills) {
      const skillSummary = this.evidenceService.aggregateSkillEvidence(learnerId, skillId, tenantId);
      if (skillSummary.evidenceCount === 0 || skillSummary.averageScore < policy.minimumMastery) {
        missingSkills.push(skillId);
      }
    }

    if (missingSkills.length > 0) {
      reasons.push(`Missing required skill mastery for: ${missingSkills.join(', ')}`);
    }

    // 2. Check total evidence count across required skills
    const relevantEvidence = allLearnerEvidence.filter(e => policy.requiredSkills.includes(e.skillId));
    relevantEvidence.forEach(e => eligibleEvidenceIds.push(e.evidenceId));

    const evidenceCountMet = relevantEvidence.length >= policy.minimumEvidenceCount;
    if (!evidenceCountMet) {
      reasons.push(`Insufficient evidence count: found ${relevantEvidence.length}, required ${policy.minimumEvidenceCount}`);
    }

    // 3. Check minimum quality level
    const maxQualityFound = relevantEvidence.reduce((max, e) => Math.max(max, e.qualityLevel), 1 as EvidenceQualityLevel);
    const evidenceQualityMet = maxQualityFound >= policy.minimumQualityLevel;
    if (!evidenceQualityMet) {
      reasons.push(`Evidence quality tier insufficient: highest found Level ${maxQualityFound}, required Level ${policy.minimumQualityLevel}`);
    }

    // 4. Check required evidence types
    const typesPresent = new Set(relevantEvidence.map(e => e.evidenceType));
    const missingTypes = policy.requiredEvidenceTypes.filter(t => !typesPresent.has(t));
    if (missingTypes.length > 0) {
      reasons.push(`Missing mandatory evidence types: ${missingTypes.join(', ')}`);
    }

    // 5. Check average mastery across relevant evidence
    const scoredEvidence = relevantEvidence.filter(e => e.score !== undefined);
    const avgScore = scoredEvidence.length > 0
      ? scoredEvidence.reduce((acc, e) => acc + (e.score || 0), 0) / scoredEvidence.length
      : 0;
    const masteryMet = avgScore >= policy.minimumMastery;
    if (!masteryMet) {
      reasons.push(`Average mastery ${avgScore.toFixed(2)} is below required threshold ${policy.minimumMastery}`);
    }

    const isEligible = missingSkills.length === 0 && evidenceCountMet && evidenceQualityMet && missingTypes.length === 0 && masteryMet;

    return {
      policyId: policy.credentialId,
      policyVersion: policy.policyVersion,
      learnerId,
      isEligible,
      requiresTeacherApproval: policy.teacherApprovalRequired,
      reasons,
      missingSkills,
      evidenceQualityMet,
      evidenceCountMet,
      masteryMet,
      eligibleEvidenceIds,
    };
  }
}
