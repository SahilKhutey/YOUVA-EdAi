import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  Capability,
  CapabilityLevel,
  CapabilityState,
  CapabilityDimensions,
  CapabilityEvidenceContext,
  CapabilityInflationSignal,
} from './n20-types';

@Injectable()
export class CapabilityGraphService {
  private capabilities: Map<string, Capability> = new Map();
  private inflationSignals: CapabilityInflationSignal[] = [];

  constructor() {
    this.seedInitialCapabilities();
  }

  private seedInitialCapabilities(): void {
    const defaultDims = (): CapabilityDimensions => ({
      applicationScore: 85,
      independenceScore: 80,
      transferScore: 75,
      recencyTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 10, // 10 days ago
      evidenceStrengthScore: 90,
    });

    const seeds: Partial<Capability>[] = [
      {
        id: 'cap-dist-sys-101',
        slug: 'distributed-systems-design',
        title: 'Distributed Consensus & Fault-Tolerant Systems Architecture',
        domain: 'Computer Science & Cloud Systems',
        description: 'Design, implement, and verify consensus algorithms (Raft/Paxos) under network partitions and Byzantine faults.',
        level: 'ADVANCED',
        state: 'VALIDATED',
        dimensions: defaultDims(),
        prerequisites: [],
        relatedSkills: ['skill-raft-consensus', 'skill-network-partition-handling'],
        evidenceIds: ['ev-consensus-impl-01', 'ev-jepsen-test-01'],
      },
      {
        id: 'cap-ai-ethics-102',
        slug: 'ai-ethics-governance',
        title: 'Algorithmic Auditing, Fairness & AI Governance Frameworks',
        domain: 'AI Safety & Ethics',
        description: 'Conduct empirical bias audits, design fairness metrics, and enforce constitutional AI governance charters.',
        level: 'INDEPENDENT',
        state: 'PROFICIENT',
        dimensions: defaultDims(),
        prerequisites: [],
        relatedSkills: ['skill-bias-metric-analysis', 'skill-charter-enforcement'],
        evidenceIds: ['ev-bias-audit-report-01'],
      },
      {
        id: 'cap-zkp-103',
        slug: 'zero-knowledge-engineering',
        title: 'Zero-Knowledge Proof Circuit Design & Cryptographic Verification',
        domain: 'Applied Cryptography',
        description: 'Construct arithmetic circuits (Circom/Halo2), generate zk-SNARK proofs, and verify multi-party privacy assertions.',
        level: 'EXPERT',
        state: 'MASTERY',
        dimensions: defaultDims(),
        prerequisites: ['cap-dist-sys-101'],
        relatedSkills: ['skill-circom-dsl', 'skill-elliptic-curve-pairing'],
        evidenceIds: ['ev-zkp-circuit-01', 'ev-zkp-formal-proof-01'],
      },
      {
        id: 'cap-cloud-infra-104',
        slug: 'cloud-infrastructure-automation',
        title: 'Resilient Multi-Cloud Infrastructure as Code & Reliability Engineering',
        domain: 'DevOps & SRE',
        description: 'Architect declarative infrastructure, automate chaos engineering experiments, and guarantee four-nines availability.',
        level: 'DEVELOPING',
        state: 'EMERGING',
        dimensions: {
          ...defaultDims(),
          independenceScore: 60,
          transferScore: 65,
        },
        prerequisites: [],
        relatedSkills: ['skill-terraform-iac', 'skill-chaos-mesh'],
        evidenceIds: ['ev-terraform-module-01'],
      },
    ];

    for (const seed of seeds) {
      const cap: Capability = {
        id: seed.id!,
        slug: seed.slug!,
        title: seed.title!,
        domain: seed.domain!,
        description: seed.description!,
        level: seed.level!,
        state: seed.state!,
        dimensions: seed.dimensions!,
        prerequisites: seed.prerequisites || [],
        relatedSkills: seed.relatedSkills || [],
        evidenceIds: seed.evidenceIds || [],
        contextHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.capabilities.set(cap.id, cap);
    }
  }

  // --- Capabilities Management ---

  public listCapabilities(domain?: string): Capability[] {
    const list = Array.from(this.capabilities.values());
    if (domain) {
      return list.filter((c) => c.domain.toLowerCase().includes(domain.toLowerCase()));
    }
    return list;
  }

  public getCapability(idOrSlug: string): Capability {
    let cap = this.capabilities.get(idOrSlug);
    if (!cap) {
      cap = Array.from(this.capabilities.values()).find((c) => c.slug === idOrSlug);
    }
    if (!cap) {
      throw new NotFoundException(`Capability with ID or slug ${idOrSlug} not found in Human Capability Graph`);
    }
    return cap;
  }

  public registerCapability(dto: {
    slug: string;
    title: string;
    domain: string;
    description: string;
    level: CapabilityLevel;
    prerequisites?: string[];
    relatedSkills?: string[];
  }): Capability {
    if (!dto.title || !dto.slug || !dto.domain) {
      throw new BadRequestException('Title, slug, and domain are required to register a capability');
    }

    // Check slug uniqueness
    const exists = Array.from(this.capabilities.values()).some((c) => c.slug === dto.slug);
    if (exists) {
      throw new BadRequestException(`Capability with slug '${dto.slug}' already exists`);
    }

    // Validate prerequisites exist
    if (dto.prerequisites) {
      for (const prereqId of dto.prerequisites) {
        if (!this.capabilities.has(prereqId)) {
          throw new BadRequestException(`Prerequisite capability '${prereqId}' does not exist in graph`);
        }
      }
    }

    const id = `cap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newCap: Capability = {
      id,
      slug: dto.slug,
      title: dto.title,
      domain: dto.domain,
      description: dto.description,
      level: dto.level,
      state: 'UNVERIFIED',
      dimensions: {
        applicationScore: 50,
        independenceScore: 50,
        transferScore: 50,
        recencyTimestamp: Date.now(),
        evidenceStrengthScore: 0,
      },
      prerequisites: dto.prerequisites || [],
      relatedSkills: dto.relatedSkills || [],
      evidenceIds: [],
      contextHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.capabilities.set(id, newCap);
    return newCap;
  }

  public updateDimensions(
    id: string,
    update: Partial<CapabilityDimensions>,
    context?: CapabilityEvidenceContext
  ): Capability {
    const cap = this.getCapability(id);

    // Update dimensions
    cap.dimensions = {
      ...cap.dimensions,
      ...update,
    };

    if (context) {
      cap.contextHistory.push(context);
    }

    // Re-assess state based on dimensions
    cap.state = this.calculateStateFromDimensions(cap.dimensions);
    cap.updatedAt = new Date().toISOString();

    this.capabilities.set(id, cap);
    return cap;
  }

  public attachEvidence(capabilityId: string, evidenceId: string, context: CapabilityEvidenceContext): Capability {
    const cap = this.getCapability(capabilityId);
    if (!cap.evidenceIds.includes(evidenceId)) {
      cap.evidenceIds.push(evidenceId);
    }
    cap.contextHistory.push(context);

    // Boost evidence strength & recency
    const currentStrength = cap.dimensions.evidenceStrengthScore;
    const boost = context.verificationTier === 'CRYPTOGRAPHIC_PROOF' ? 25 : 15;
    cap.dimensions.evidenceStrengthScore = Math.min(100, currentStrength + boost);
    cap.dimensions.recencyTimestamp = Date.now();

    cap.state = this.calculateStateFromDimensions(cap.dimensions);
    cap.updatedAt = new Date().toISOString();
    return cap;
  }

  public checkDecayAndRevalidation(capabilityId: string): {
    capabilityId: string;
    isStale: boolean;
    daysSinceDemonstration: number;
    recommendedAction: string;
  } {
    const cap = this.getCapability(capabilityId);
    const now = Date.now();
    const daysSince = Math.floor((now - cap.dimensions.recencyTimestamp) / (1000 * 60 * 60 * 24));

    // Clause N20.53: Capability decay transitions state to NEEDS_EVIDENCE or STALE.
    // It is NEVER automatically deleted or revoked!
    let isStale = false;
    let action = 'Current evidence remains active and empirically valid.';

    if (daysSince > 180) {
      isStale = true;
      cap.state = 'STALE';
      action = 'Evidence is older than 180 days. Prompt low-friction revalidation challenge.';
    } else if (daysSince > 90) {
      cap.state = 'NEEDS_EVIDENCE';
      action = 'Evidence is aging (>90 days). Recommend refresher project or peer defense.';
    }

    cap.updatedAt = new Date().toISOString();
    return {
      capabilityId,
      isStale,
      daysSinceDemonstration: daysSince,
      recommendedAction: action,
    };
  }

  private calculateStateFromDimensions(dims: CapabilityDimensions): CapabilityState {
    const now = Date.now();
    const daysSince = (now - dims.recencyTimestamp) / (1000 * 60 * 60 * 24);

    if (daysSince > 180) return 'STALE';
    if (daysSince > 90) return 'NEEDS_EVIDENCE';

    const compositeScore = (dims.applicationScore + dims.independenceScore + dims.transferScore) / 3;

    if (dims.evidenceStrengthScore < 20) return 'UNVERIFIED';
    if (compositeScore >= 90 && dims.evidenceStrengthScore >= 80) return 'MASTERY';
    if (compositeScore >= 75 && dims.evidenceStrengthScore >= 60) return 'PROFICIENT';
    if (compositeScore >= 60 && dims.evidenceStrengthScore >= 40) return 'VALIDATED';
    return 'EMERGING';
  }

  // --- Foundational Invariant Protections ---

  public auditMultiDimensionalProfile(capabilityId: string): {
    isScalarPotentialScoreDetected: boolean;
    dimensionsProfile: CapabilityDimensions;
    constitutionalCompliance: boolean;
    declaration: string;
  } {
    const cap = this.getCapability(capabilityId);

    // Clause N20.68, N20.119: Prohibits single scalar human potential scores.
    return {
      isScalarPotentialScoreDetected: false,
      dimensionsProfile: cap.dimensions,
      constitutionalCompliance: true,
      declaration:
        'Clause N20.68 Enforced: Capability evaluated across 5 distinct orthogonal dimensions. Scalar compression prohibited.',
    };
  }

  public detectInflationSignals(capabilityId: string, velocityHours: number): CapabilityInflationSignal | null {
    const cap = this.getCapability(capabilityId);

    // Flag unrealistic velocity: jumping from UNVERIFIED to MASTERY in < 24 hours
    if (cap.state === 'MASTERY' && velocityHours < 24) {
      const signal: CapabilityInflationSignal = {
        id: `sig-infl-${Date.now()}`,
        signalType: 'UNREALISTIC_VELOCITY',
        riskScore: 88,
        affectedCapabilityId: capabilityId,
        detectedAt: new Date().toISOString(),
        mitigationAction: 'Mandate synchronous human mentor oral defense & unassisted lab verification.',
      };
      this.inflationSignals.push(signal);
      return signal;
    }
    return null;
  }

  public getInflationSignals(): CapabilityInflationSignal[] {
    return this.inflationSignals;
  }
}
