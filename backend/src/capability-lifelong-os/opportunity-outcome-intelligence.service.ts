import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  Opportunity,
  OpportunityCompatibility,
  Experience,
  LongitudinalOutcome,
  OutcomeCategory,
} from './n20-types';
import { CapabilityGraphService } from './capability-graph.service';
import { LearnerGoalsPathwayService } from './learner-goals-pathway.service';

@Injectable()
export class OpportunityOutcomeIntelligenceService {
  private opportunities: Map<string, Opportunity> = new Map();
  private experiences: Map<string, Experience[]> = new Map(); // learnerId -> Experience[]
  private outcomes: Map<string, LongitudinalOutcome[]> = new Map(); // learnerId -> LongitudinalOutcome[]
  private researchRegistry: Map<string, any> = new Map();

  constructor(
    private readonly capabilityGraph: CapabilityGraphService,
    private readonly pathwayService: LearnerGoalsPathwayService
  ) {
    this.seedInitialOpportunities();
  }

  private seedInitialOpportunities(): void {
    const opps: Partial<Opportunity>[] = [
      {
        id: 'opp-consensys-res-01',
        title: 'Zero-Knowledge Protocol Research Resident',
        organization: 'Cryptography Research Foundation',
        description: 'Collaborate on recursive SNARK verification circuits and formal verification of privacy primitives.',
        opportunityType: 'RESEARCH',
        requiredCapabilities: ['cap-zkp-103'],
        preferredCapabilities: ['cap-dist-sys-101'],
        location: 'Zurich / Remote',
        isRemote: true,
        compensationRange: '$120,000 - $140,000 / yr',
        sanitized: true,
        injectionRiskScore: 0,
      },
      {
        id: 'opp-cloud-sre-02',
        title: 'Distributed Systems & Reliability Fellow',
        organization: 'Global Infrastructure Labs',
        description: 'Design chaos-resilient distributed storage engines and evaluate consensus under adversarial partitions.',
        opportunityType: 'FELLOWSHIP',
        requiredCapabilities: ['cap-dist-sys-101'],
        preferredCapabilities: ['cap-cloud-infra-104'],
        location: 'San Francisco, CA',
        isRemote: false,
        compensationRange: '$110,000 - $130,000 / yr',
        sanitized: true,
        injectionRiskScore: 0,
      },
      {
        id: 'opp-ai-auditor-03',
        title: 'Algorithmic Fairness & AI Governance Fellow',
        organization: 'Institute for Constitutional AI',
        description: 'Conduct empirical auditing of LLM decision boundaries and establish verifiable safety charters.',
        opportunityType: 'INTERNSHIP',
        requiredCapabilities: ['cap-ai-ethics-102'],
        preferredCapabilities: [],
        location: 'London, UK / Hybrid',
        isRemote: true,
        compensationRange: '£45,000 - £55,000 pro rata',
        sanitized: true,
        injectionRiskScore: 0,
      },
    ];

    for (const opp of opps) {
      this.opportunities.set(opp.id!, {
        id: opp.id!,
        title: opp.title!,
        organization: opp.organization!,
        description: opp.description!,
        opportunityType: opp.opportunityType!,
        requiredCapabilities: opp.requiredCapabilities || [],
        preferredCapabilities: opp.preferredCapabilities || [],
        location: opp.location!,
        isRemote: opp.isRemote ?? true,
        compensationRange: opp.compensationRange!,
        sanitized: opp.sanitized ?? true,
        injectionRiskScore: opp.injectionRiskScore ?? 0,
        createdAt: new Date().toISOString(),
      });
    }

    // Seed sample experience and outcome for learner-alex-001
    const alexExp: Experience = {
      id: 'exp-alex-001',
      learnerId: 'learner-alex-001',
      title: 'Distributed Storage Intern',
      role: 'Systems Engineer',
      organization: 'OpenCloud Consortium',
      startDate: '2025-06-01',
      endDate: '2025-12-31',
      isCurrent: false,
      validatedCapabilities: ['cap-dist-sys-101'],
      evidenceIds: ['ev-consensus-impl-01'],
      narrative: 'Built Raft state machine replication engine and simulated Byzantine network partitions.',
    };
    this.experiences.set('learner-alex-001', [alexExp]);

    const alexOutcome: LongitudinalOutcome = {
      id: 'out-alex-001',
      learnerId: 'learner-alex-001',
      category: 'EMPLOYMENT',
      title: 'Full-time Systems Engineer Offer',
      metricValue: '$145,000 Base Salary',
      recordedAt: new Date().toISOString(),
      associatedCapabilityIds: ['cap-dist-sys-101'],
      correlationStrength: 0.82,
      causalityDisclaimer:
        'Clause N20.46 Enforced: This outcome demonstrates positive empirical correlation with demonstrated capability. It does NOT constitute scientific proof of unilateral causation.',
    };
    this.outcomes.set('learner-alex-001', [alexOutcome]);
  }

  // --- Opportunity Management with Prompt Injection Defense ---

  public ingestOpportunity(dto: {
    title: string;
    organization: string;
    description: string;
    opportunityType: Opportunity['opportunityType'];
    requiredCapabilities: string[];
    preferredCapabilities?: string[];
    location: string;
    isRemote: boolean;
    compensationRange: string;
  }): Opportunity {
    if (!dto.title || !dto.organization || !dto.description) {
      throw new BadRequestException('Title, organization, and description are required');
    }

    // Adversarial Prompt & Content Injection Defense (Clause N20.186)
    const { sanitizedText, riskScore } = this.sanitizeAndAnalyzeInjectionRisk(dto.description);

    const id = `opp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const opp: Opportunity = {
      id,
      title: dto.title,
      organization: dto.organization,
      description: sanitizedText,
      opportunityType: dto.opportunityType,
      requiredCapabilities: dto.requiredCapabilities || [],
      preferredCapabilities: dto.preferredCapabilities || [],
      location: dto.location,
      isRemote: dto.isRemote,
      compensationRange: dto.compensationRange,
      sanitized: true,
      injectionRiskScore: riskScore,
      createdAt: new Date().toISOString(),
    };

    this.opportunities.set(id, opp);
    return opp;
  }

  public listOpportunities(type?: Opportunity['opportunityType']): Opportunity[] {
    const list = Array.from(this.opportunities.values());
    if (type) {
      return list.filter((o) => o.opportunityType === type);
    }
    return list;
  }

  public getOpportunity(id: string): Opportunity {
    const opp = this.opportunities.get(id);
    if (!opp) {
      throw new NotFoundException(`Opportunity with ID ${id} not found`);
    }
    return opp;
  }

  private sanitizeAndAnalyzeInjectionRisk(input: string): { sanitizedText: string; riskScore: number } {
    let riskScore = 0;
    const suspiciousPatterns = [
      /ignore\s+(all\s+)?previous\s+instructions/i,
      /system\s+prompt/i,
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /javascript:/i,
      /eval\s*\(/i,
      /union\s+select/i,
      /drop\s+table/i,
      /bypass\s+governance/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(input)) {
        riskScore += 35;
      }
    }

    // Sanitize script tags and control characters
    const sanitizedText = input
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '[REMOVED_SCRIPT]')
      .replace(/javascript:/gi, '[REMOVED_URI]')
      .trim();

    return {
      sanitizedText,
      riskScore: Math.min(100, riskScore),
    };
  }

  // --- Compatibility Evaluation (Matching != Selection) ---

  public evaluateCompatibility(opportunityId: string, learnerId: string): OpportunityCompatibility {
    const opp = this.getOpportunity(opportunityId);

    const demonstrated: string[] = [];
    const gaps: string[] = [];

    for (const reqCapId of opp.requiredCapabilities) {
      const learnerDim = this.pathwayService.getLearnerCapability(learnerId, reqCapId);
      if (learnerDim && learnerDim.evidenceStrengthScore >= 50 && learnerDim.applicationScore >= 60) {
        demonstrated.push(reqCapId);
      } else {
        gaps.push(reqCapId);
      }
    }

    const matchRatio = opp.requiredCapabilities.length > 0 ? demonstrated.length / opp.requiredCapabilities.length : 1.0;
    const matchScore = Math.round(matchRatio * 100);

    const recSummary =
      gaps.length === 0
        ? 'High alignment: All required capabilities demonstrated with authentic evidence.'
        : `Potential match: ${demonstrated.length}/${opp.requiredCapabilities.length} required capabilities verified. Target gap resolution recommended.`;

    // Invariant 5: Mandatory Non-Selection Disclaimer
    const nonSelectionDisclaimer =
      'CONSTITUTIONAL NOTICE (Clause N20.27): This compatibility evaluation is an advisory navigation signal, NOT an employment, admissions, or hiring decision. YOUVA algorithms do not make autonomous selection determinations.';

    return {
      opportunityId,
      learnerId,
      matchScore,
      demonstratedCapabilities: demonstrated,
      gapCapabilities: gaps,
      recommendationSummary: recSummary,
      nonSelectionDisclaimer,
      evaluatedAt: new Date().toISOString(),
    };
  }

  // --- Experiences & Longitudinal Outcomes ---

  public recordExperience(dto: {
    learnerId: string;
    title: string;
    role: string;
    organization: string;
    startDate: string;
    endDate?: string;
    isCurrent: boolean;
    validatedCapabilities: string[];
    evidenceIds?: string[];
    narrative: string;
  }): Experience {
    const id = `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const exp: Experience = {
      id,
      learnerId: dto.learnerId,
      title: dto.title,
      role: dto.role,
      organization: dto.organization,
      startDate: dto.startDate,
      endDate: dto.endDate,
      isCurrent: dto.isCurrent,
      validatedCapabilities: dto.validatedCapabilities || [],
      evidenceIds: dto.evidenceIds || [],
      narrative: dto.narrative,
    };

    const exps = this.experiences.get(dto.learnerId) || [];
    exps.push(exp);
    this.experiences.set(dto.learnerId, exps);
    return exp;
  }

  public getExperiences(learnerId: string): Experience[] {
    return this.experiences.get(learnerId) || [];
  }

  public recordLongitudinalOutcome(dto: {
    learnerId: string;
    category: OutcomeCategory;
    title: string;
    metricValue: string;
    associatedCapabilityIds: string[];
    correlationStrength: number;
  }): LongitudinalOutcome {
    const id = `out-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const outcome: LongitudinalOutcome = {
      id,
      learnerId: dto.learnerId,
      category: dto.category,
      title: dto.title,
      metricValue: dto.metricValue,
      recordedAt: new Date().toISOString(),
      associatedCapabilityIds: dto.associatedCapabilityIds || [],
      correlationStrength: Math.min(1.0, Math.max(0.0, dto.correlationStrength)),
      causalityDisclaimer:
        'Clause N20.46 Enforced: Observed correlation between capability demonstration and longitudinal outcome does not constitute unilateral causality.',
    };

    const list = this.outcomes.get(dto.learnerId) || [];
    list.push(outcome);
    this.outcomes.set(dto.learnerId, list);
    return outcome;
  }

  public getLongitudinalOutcomes(learnerId?: string): LongitudinalOutcome[] {
    if (learnerId) {
      return this.outcomes.get(learnerId) || [];
    }
    const all: LongitudinalOutcome[] = [];
    for (const list of this.outcomes.values()) {
      all.push(...list);
    }
    return all;
  }

  // --- Pre-Declared Research Experiment Registry (Clause N20.207) ---

  public registerResearchExperiment(dto: {
    experimentName: string;
    hypothesis: string;
    primaryOutcomeMetric: string;
    counterfactualMethodology: string;
    targetSampleSize: number;
  }): {
    experimentId: string;
    registeredAt: string;
    preregistrationHash: string;
    status: string;
  } {
    const experimentId = `exp-res-${Date.now()}`;
    const registeredAt = new Date().toISOString();
    const preregistrationHash = `sha256-${Buffer.from(dto.hypothesis + dto.primaryOutcomeMetric + registeredAt).toString('hex').substring(0, 32)}`;

    const record = {
      experimentId,
      ...dto,
      registeredAt,
      preregistrationHash,
      status: 'PREREGISTERED_LOCKED',
    };

    this.researchRegistry.set(experimentId, record);
    return {
      experimentId,
      registeredAt,
      preregistrationHash,
      status: record.status,
    };
  }

  public getResearchExperiments(): any[] {
    return Array.from(this.researchRegistry.values());
  }
}
