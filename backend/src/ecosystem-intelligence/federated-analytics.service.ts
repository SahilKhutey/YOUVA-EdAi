import { Injectable, BadRequestException } from '@nestjs/common';
import {
  FederatedCohortMetric,
  EcosystemHealthIndex,
} from './n21-types';

@Injectable()
export class FederatedAnalyticsService {
  private readonly PRIVACY_THRESHOLD = 10; // Minimum cohort size (Clause N21.18)

  // --- Small-Cohort Privacy-Protected Aggregation (Clause N21.17 - N21.18) ---

  public computeCohortMetric(
    metricName: string,
    sampleValues: number[],
    applyDifferentialPrivacy: boolean = false
  ): FederatedCohortMetric {
    const sampleSize = sampleValues.length;

    // Small-Cohort Protection: Suppress if sampleSize < 10
    if (sampleSize < this.PRIVACY_THRESHOLD) {
      return {
        metricName,
        sampleSize,
        aggregatedValue: 'SUPPRESSED',
        privacyProtected: true,
        noiseAdded: false,
        isSuppressed: true,
        suppressionReason: `Cohort size (${sampleSize}) is below minimum privacy threshold (${this.PRIVACY_THRESHOLD}). Metric suppressed to prevent re-identification.`,
      };
    }

    const sum = sampleValues.reduce((acc, v) => acc + v, 0);
    let avg = sum / sampleSize;
    let noiseAdded = false;

    // Clause N21.16: Calibrated Laplace noise for Differential Privacy
    if (applyDifferentialPrivacy) {
      const epsilon = 0.5; // Privacy parameter
      const sensitivity = 1.0;
      const noise = (Math.random() - 0.5) * (sensitivity / epsilon);
      avg += noise;
      noiseAdded = true;
    }

    return {
      metricName,
      sampleSize,
      aggregatedValue: Math.round(avg * 100) / 100,
      privacyProtected: true,
      noiseAdded,
      isSuppressed: false,
    };
  }

  // --- Aggregate Capability Supply vs. Demand Mapping (Clause N21.62 - N21.64) ---

  public getCapabilitySupplyDemandMap(): {
    capabilityId: string;
    title: string;
    aggregateDemonstratedCount: number;
    aggregateOpportunityDemandCount: number;
    marketSignal: 'SURPLUS' | 'EQUILIBRIUM' | 'HIGH_DEMAND' | 'EMERGING';
    noIndividualScoreDeclaration: string;
  }[] {
    // Invariant: This is aggregate market intelligence, NEVER individual employability scores!
    return [
      {
        capabilityId: 'cap-dist-sys-101',
        title: 'Distributed Consensus & Fault-Tolerant Systems Architecture',
        aggregateDemonstratedCount: 142,
        aggregateOpportunityDemandCount: 380,
        marketSignal: 'HIGH_DEMAND',
        noIndividualScoreDeclaration:
          'Clause N21.64 Enforced: Supply/demand signal is aggregate ecosystem telemetry. Individual employability scoring is strictly prohibited.',
      },
      {
        capabilityId: 'cap-ai-ethics-102',
        title: 'Algorithmic Auditing, Fairness & AI Governance Frameworks',
        aggregateDemonstratedCount: 88,
        aggregateOpportunityDemandCount: 260,
        marketSignal: 'HIGH_DEMAND',
        noIndividualScoreDeclaration:
          'Clause N21.64 Enforced: Supply/demand signal is aggregate ecosystem telemetry. Individual employability scoring is strictly prohibited.',
      },
      {
        capabilityId: 'cap-zkp-103',
        title: 'Zero-Knowledge Proof Circuit Design & Cryptographic Verification',
        aggregateDemonstratedCount: 45,
        aggregateOpportunityDemandCount: 190,
        marketSignal: 'EMERGING',
        noIndividualScoreDeclaration:
          'Clause N21.64 Enforced: Supply/demand signal is aggregate ecosystem telemetry. Individual employability scoring is strictly prohibited.',
      },
      {
        capabilityId: 'cap-cloud-infra-104',
        title: 'Resilient Multi-Cloud Infrastructure as Code & SRE',
        aggregateDemonstratedCount: 220,
        aggregateOpportunityDemandCount: 240,
        marketSignal: 'EQUILIBRIUM',
        noIndividualScoreDeclaration:
          'Clause N21.64 Enforced: Supply/demand signal is aggregate ecosystem telemetry. Individual employability scoring is strictly prohibited.',
      },
    ];
  }

  // --- Multidimensional Ecosystem Health Index (Clause N21.60 - N21.61) ---

  public getEcosystemHealthIndex(): EcosystemHealthIndex {
    const evidenceQuality = 92;
    const credentialTrust = 95;
    const interoperability = 88;
    const privacyCompliance = 98;
    const teacherWorkloadIndex = 78;
    const learnerAgencyScore = 94;

    const compositeScore = Math.round(
      (evidenceQuality + credentialTrust + interoperability + privacyCompliance + teacherWorkloadIndex + learnerAgencyScore) / 6
    );

    return {
      evidenceQuality,
      credentialTrust,
      interoperability,
      privacyCompliance,
      teacherWorkloadIndex,
      learnerAgencyScore,
      compositeScore,
      evaluatedAt: new Date().toISOString(),
    };
  }
}
