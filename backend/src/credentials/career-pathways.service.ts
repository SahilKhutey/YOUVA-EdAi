import { Injectable, Logger } from '@nestjs/common';
import { CareerSkillMapping } from './credential-types';
import { LearningEvidenceService } from './learning-evidence.service';

@Injectable()
export class CareerPathwaysService {
  private readonly logger = new Logger(CareerPathwaysService.name);

  private readonly careerProfiles: CareerSkillMapping[] = [
    {
      careerId: 'CAR-AI-ENG',
      title: 'Applied AI & Machine Learning Engineer',
      description: 'Designing, evaluating, and deploying trustworthy AI systems with strong epistemic calibration.',
      requiredSkills: [
        'AI-FOUNDATIONS',
        'AI-LIMITS-HALLUCINATION',
        'AI-PROMPT-VERIFY',
        'AI-ETHICS-BIAS',
        'SE-MODULAR-DESIGN',
      ],
      recommendedProjects: [
        'LLM Hallucination Auditing Benchmark',
        'Multi-Agent Collaborative Reasoning Sandbox',
      ],
      overlapPercentage: 0,
      skillGaps: [],
    },
    {
      careerId: 'CAR-DATA-SCI',
      title: 'Quantitative Data Scientist',
      description: 'Uncovering statistical insights from empirical datasets and communicating visual findings.',
      requiredSkills: [
        'DS-DATA-CLEANING',
        'DS-EXPLORATORY-ANALYSIS',
        'DS-STATS-INFERENCE',
        'CT-DECOMP',
      ],
      recommendedProjects: [
        'Epidemiological Trend Statistical Modeling',
        'Algorithmic Fairness Data Distribution Audit',
      ],
      overlapPercentage: 0,
      skillGaps: [],
    },
    {
      careerId: 'CAR-SEC-ENG',
      title: 'Systems & Cybersecurity Architect',
      description: 'Building secure, resilient software architectures resistant to injection, replay, and timing attacks.',
      requiredSkills: [
        'CT-DECOMP',
        'CT-ALGO',
        'CT-DEBUG',
        'SE-MODULAR-DESIGN',
        'SE-SECURE-CODING',
      ],
      recommendedProjects: [
        'Zero-Trust Cryptographic Key Rotation Engine',
        'Deterministic State Machine Fault Injection Harness',
      ],
      overlapPercentage: 0,
      skillGaps: [],
    },
  ];

  constructor(private readonly evidenceService: LearningEvidenceService) {}

  /**
   * Generates exploratory, non-deterministic career alignment mappings (Clauses N12.37 - N12.39).
   * Strictly avoids prescriptive declarations like "You should become X".
   */
  explorePathways(learnerId: string, tenantId?: string): CareerSkillMapping[] {
    const learnerEvidence = this.evidenceService.getLearnerEvidence(learnerId, tenantId);
    const demonstratedSkillIds = new Set(learnerEvidence.map(e => e.skillId));

    return this.careerProfiles.map(profile => {
      const matched = profile.requiredSkills.filter(s => demonstratedSkillIds.has(s));
      const gaps = profile.requiredSkills.filter(s => !demonstratedSkillIds.has(s));
      const overlapPercentage = Math.round((matched.length / profile.requiredSkills.length) * 100);

      return {
        ...profile,
        overlapPercentage,
        skillGaps: gaps,
      };
    });
  }
}
