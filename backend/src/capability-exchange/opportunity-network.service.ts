import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  Opportunity,
  OpportunityType,
  OpportunityStatus,
} from './n22-types';
import * as crypto from 'crypto';

@Injectable()
export class OpportunityNetworkService {
  private readonly opportunities = new Map<string, Opportunity>();

  constructor() {
    this.seedInitialOpportunities();
  }

  /**
   * Registers a new opportunity in the global network.
   */
  registerOpportunity(data: Partial<Opportunity>): Opportunity {
    if (!data.providerId || !data.title || !data.type) {
      throw new BadRequestException('providerId, title, and type are required');
    }

    const id = data.id || `opp_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date().toISOString();

    const opportunity: Opportunity = {
      id,
      providerId: data.providerId,
      providerName: data.providerName || 'Universal Partner',
      title: data.title,
      description: data.description || '',
      type: data.type,
      status: data.status || 'OPEN',
      capabilityRequirements: data.capabilityRequirements || [],
      skillRequirements: data.skillRequirements || [],
      location: data.location || { type: 'REMOTE' },
      compensation: data.compensation || { type: 'STIPEND', disclosed: true },
      isMinorEligible: data.isMinorEligible ?? true,
      requiresParentalConsent: data.requiresParentalConsent ?? false,
      isSponsored: data.isSponsored ?? false,
      freshnessScore: 1.0,
      version: 1,
      createdAt: now,
      updatedAt: now,
      expiresAt: data.expiresAt,
    };

    this.opportunities.set(id, opportunity);
    return opportunity;
  }

  /**
   * Updates an existing opportunity, bumping version and freshness.
   */
  updateOpportunity(oppId: string, patch: Partial<Opportunity>): Opportunity {
    const opp = this.opportunities.get(oppId);
    if (!opp) {
      throw new NotFoundException(`Opportunity ${oppId} not found`);
    }

    const updated: Opportunity = {
      ...opp,
      ...patch,
      id: opp.id, // Immutable
      version: opp.version + 1,
      freshnessScore: 1.0,
      updatedAt: new Date().toISOString(),
    };

    this.opportunities.set(oppId, updated);
    return updated;
  }

  getOpportunity(oppId: string): Opportunity | undefined {
    return this.opportunities.get(oppId);
  }

  /**
   * Lists opportunities with optional filters.
   */
  listOpportunities(filters?: {
    type?: OpportunityType;
    isMinorEligible?: boolean;
    providerId?: string;
    status?: OpportunityStatus;
    minFreshness?: number;
    isSponsored?: boolean;
  }): Opportunity[] {
    let result = Array.from(this.opportunities.values());

    if (filters) {
      if (filters.type) {
        result = result.filter((o) => o.type === filters.type);
      }
      if (filters.isMinorEligible !== undefined) {
        result = result.filter((o) => o.isMinorEligible === filters.isMinorEligible);
      }
      if (filters.providerId) {
        result = result.filter((o) => o.providerId === filters.providerId);
      }
      if (filters.status) {
        result = result.filter((o) => o.status === filters.status);
      }
      if (filters.minFreshness !== undefined) {
        result = result.filter((o) => o.freshnessScore >= filters.minFreshness!);
      }
      if (filters.isSponsored !== undefined) {
        result = result.filter((o) => o.isSponsored === filters.isSponsored);
      }
    }

    return result;
  }

  /**
   * Invariant N22.65–N22.70: Minor Safeguards & Vulnerable Learner Protections.
   */
  filterForMinor(
    opportunities: Opportunity[],
    isMinor: boolean,
    hasParentalConsent: boolean = false,
  ): Opportunity[] {
    if (!isMinor) {
      return opportunities;
    }

    return opportunities.filter((o) => {
      if (!o.isMinorEligible) {
        return false;
      }
      if (o.requiresParentalConsent && !hasParentalConsent) {
        return false;
      }
      return true;
    });
  }

  /**
   * Computes freshness score based on age in days.
   */
  calculateFreshnessScore(opp: Opportunity): number {
    const ageMs = Date.now() - new Date(opp.updatedAt).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    if (ageDays <= 7) return 1.0;
    if (ageDays <= 30) return 0.8;
    if (ageDays <= 90) return 0.5;
    return 0.2;
  }

  private seedInitialOpportunities(): void {
    const samples: Partial<Opportunity>[] = [
      {
        id: 'opp_ml_fellowship_001',
        providerId: 'prov_deepmind_edu',
        providerName: 'DeepMind Educational Initiative',
        title: 'Open Learning Research Fellowship in AI Safety',
        description: 'Guided research residency focusing on mechanistic interpretability and learning science.',
        type: 'FELLOWSHIP',
        status: 'OPEN',
        isMinorEligible: true,
        requiresParentalConsent: false,
        isSponsored: false,
        location: { type: 'REMOTE' },
        compensation: { type: 'GRANT', currency: 'USD', range: '5000-8000', disclosed: true },
        capabilityRequirements: [
          {
            capabilityId: 'cap_python_science',
            name: 'Python for Scientific Computing',
            minimumProficiency: 'ADVANCED',
            requiredEvidenceTypes: ['CODE_REPO', 'NOTEBOOK'],
            isMandatory: true,
          },
          {
            capabilityId: 'cap_research_synthesis',
            name: 'Scholarly Research Synthesis',
            minimumProficiency: 'INTERMEDIATE',
            requiredEvidenceTypes: ['PEER_REVIEWED_SUMMARY'],
            isMandatory: true,
          },
        ],
        skillRequirements: [
          { skillId: 'skill_numpy', name: 'NumPy & PyTorch', level: 4, isMandatory: true },
          { skillId: 'skill_git', name: 'Git Version Control', level: 3, isMandatory: true },
        ],
      },
      {
        id: 'opp_frontend_apprenticeship_002',
        providerId: 'prov_youva_foundation',
        providerName: 'YOUVA Open Source Foundation',
        title: 'Junior Web Accessibility & UI Apprenticeship',
        description: 'Hands-on guided apprenticeship building WCAG AAA accessible user interfaces.',
        type: 'APPRENTICESHIP',
        status: 'OPEN',
        isMinorEligible: true,
        requiresParentalConsent: true,
        isSponsored: false,
        location: { type: 'HYBRID', city: 'Bangalore', country: 'India' },
        compensation: { type: 'STIPEND', currency: 'INR', range: '25000-35000/mo', disclosed: true },
        capabilityRequirements: [
          {
            capabilityId: 'cap_frontend_dev',
            name: 'Frontend Web Development',
            minimumProficiency: 'INTERMEDIATE',
            requiredEvidenceTypes: ['WEB_APPLICATION', 'DESIGN_SYSTEM'],
            isMandatory: true,
          },
        ],
        skillRequirements: [
          { skillId: 'skill_react', name: 'React / Next.js', level: 3, isMandatory: true },
          { skillId: 'skill_a11y', name: 'Web Accessibility (ARIA)', level: 2, isMandatory: false },
        ],
      },
      {
        id: 'opp_data_reskilling_003',
        providerId: 'prov_global_skills_alliance',
        providerName: 'Global Skills Alliance',
        title: 'Cloud Data Engineering Reskilling Program',
        description: 'Structured intensive cohort for mid-career professionals transitioning into data engineering.',
        type: 'RESKILLING',
        status: 'OPEN',
        isMinorEligible: false,
        requiresParentalConsent: false,
        isSponsored: true, // Sponsored placement
        location: { type: 'REMOTE' },
        compensation: { type: 'BOUNTY', disclosed: true },
        capabilityRequirements: [
          {
            capabilityId: 'cap_sql_data_modeling',
            name: 'SQL & Data Modeling',
            minimumProficiency: 'INTERMEDIATE',
            requiredEvidenceTypes: ['DATABASE_SCHEMA', 'QUERY_BENCHMARK'],
            isMandatory: true,
          },
        ],
        skillRequirements: [
          { skillId: 'skill_sql', name: 'PostgreSQL', level: 3, isMandatory: true },
        ],
      },
    ];

    for (const sample of samples) {
      this.registerOpportunity(sample);
    }
  }
}
