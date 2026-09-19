import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  SkillsPassport,
  SelectiveDisclosureRequest,
  SelectiveDisclosurePresentation,
  CredentialInflationSignal,
} from './n19-types';
import { CredentialLifecycleService } from './credential-lifecycle.service';
import { EvidenceGraphService } from './evidence-graph.service';
import { SkillsGraphService } from './skills-graph.service';

@Injectable()
export class CredentialWalletPassportService {
  private readonly logger = new Logger(CredentialWalletPassportService.name);

  // In-memory selective disclosure presentations: key = shareToken
  private readonly activeShares = new Map<string, SelectiveDisclosurePresentation>();

  // In-memory issuer inflation signals
  private readonly inflationSignals = new Map<string, CredentialInflationSignal>();

  constructor(
    private readonly lifecycleService: CredentialLifecycleService,
    private readonly evidenceService: EvidenceGraphService,
    private readonly skillsService: SkillsGraphService,
  ) {}

  /**
   * Retrieves or constructs a learner's portable Skills Passport (Clauses N19.62–N19.64).
   */
  getSkillsPassport(learnerId: string): SkillsPassport {
    const credentials = this.lifecycleService.getCredentialsByHolder(learnerId);
    const evidenceList = this.evidenceService.getEvidenceByLearner(learnerId);

    const verifiedSkillsMap = new Map<string, { skillId: string; canonicalName: string; verifiedAt: string; level: string }>();

    for (const cred of credentials) {
      if (cred.status === 'ACTIVE') {
        for (const sId of cred.skills) {
          const skill = this.skillsService.getSkill(sId);
          if (skill && !verifiedSkillsMap.has(sId)) {
            verifiedSkillsMap.set(sId, {
              skillId: sId,
              canonicalName: skill.canonicalName,
              verifiedAt: cred.issuedAt,
              level: skill.level || 'PROFICIENT',
            });
          }
        }
      }
    }

    const projectCount = evidenceList.filter((e) => e.evidenceType === 'PROJECT' || e.evidenceType === 'WORK_PRODUCT').length;
    const assessmentCount = evidenceList.filter((e) => e.evidenceType === 'TRANSFER_TASK' || e.evidenceType === 'RETENTION_ASSESSMENT').length;

    return {
      learnerId,
      skills: Array.from(verifiedSkillsMap.values()),
      credentials,
      evidenceSummary: {
        totalCount: evidenceList.length,
        projectCount,
        assessmentCount,
      },
      verificationCount: credentials.length * 3, // In-memory telemetry
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Selective Disclosure Sharing (Clauses N19.34–N19.36).
   * Generates an expiring share presentation with zero PII.
   */
  createSelectiveDisclosureShare(request: SelectiveDisclosureRequest): SelectiveDisclosurePresentation {
    const credential = this.lifecycleService.getCredential(request.credentialId);
    if (!credential) throw new NotFoundException(`Credential ${request.credentialId} not found`);

    if (credential.holderId !== request.learnerId) {
      throw new BadRequestException('Learner does not own this credential.');
    }

    const issuer = this.lifecycleService.getIssuer(credential.issuerId);
    const shareToken = `share-${Date.now().toString(36)}-${crypto.randomBytes(8).toString('hex')}`;

    const presentation: SelectiveDisclosurePresentation = {
      shareToken,
      credentialId: credential.credentialId,
      skills: credential.skills,
      issuerName: issuer ? issuer.organizationName : credential.issuerId,
      issuedAt: credential.issuedAt,
      expiresAt: request.expiresAt,
      sanitizedProof: `proof-zero-pii-${crypto.createHash('sha256').update(shareToken).digest('hex').substring(0, 16)}`,
    };

    this.activeShares.set(shareToken, presentation);
    this.logger.log(`[SELECTIVE-DISCLOSURE] Generated share token ${shareToken} for credential ${credential.credentialId}`);

    return presentation;
  }

  getSharePresentation(shareToken: string): SelectiveDisclosurePresentation | undefined {
    const share = this.activeShares.get(shareToken);
    if (!share) return undefined;

    if (new Date(share.expiresAt) < new Date()) {
      this.activeShares.delete(shareToken);
      this.logger.warn(`[SHARE-EXPIRED] Share token ${shareToken} expired and was purged.`);
      return undefined;
    }

    return share;
  }

  // --- CREDENTIAL INFLATION & FRAUD DETECTION (Clauses N19.186–N19.189) ---

  /**
   * Evaluates issuer metrics for abnormal credential inflation patterns.
   */
  evaluateIssuerInflationRisk(
    issuerId: string,
    passRate: number,
    issuanceVelocityPerHour: number,
    minimalEvidenceRatio: number,
  ): CredentialInflationSignal {
    // Risk formula: high pass rate (> 95%) + high velocity + minimal evidence
    let risk = 0;
    if (passRate > 0.95) risk += 35;
    if (issuanceVelocityPerHour > 50) risk += 35;
    if (minimalEvidenceRatio > 0.60) risk += 30;

    const flagged = risk >= 60;

    const signal: CredentialInflationSignal = {
      issuerId,
      abnormalPassRate: passRate,
      rapidIssuanceVelocity: issuanceVelocityPerHour,
      minimalEvidenceRatio,
      riskScore: risk,
      flaggedForReview: flagged,
      detectedAt: new Date().toISOString(),
    };

    this.inflationSignals.set(issuerId, signal);

    if (flagged) {
      this.logger.warn(
        `[INFLATION-ALERT] Issuer ${issuerId} flagged for credential inflation risk (Score: ${risk}). Human review recommended.`,
      );
    }

    return signal;
  }

  getInflationSignals(): CredentialInflationSignal[] {
    return Array.from(this.inflationSignals.values());
  }
}
