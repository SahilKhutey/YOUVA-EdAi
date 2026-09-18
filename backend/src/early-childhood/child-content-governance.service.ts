import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ContentRiskAssessment } from './early-childhood-types';
import * as crypto from 'crypto';

@Injectable()
export class ChildContentGovernanceService {
  private assessments: Map<string, ContentRiskAssessment> = new Map();
  private vettedHashes: Set<string> = new Set();

  constructor() {
    // Seed vetted content
    this.seedVettedContent();
  }

  private seedVettedContent() {
    const defaultLowRisk: ContentRiskAssessment = {
      contentId: 'phonics-safari-asset-01',
      riskTier: 'LOW',
      requiresHumanReview: false,
      isApproved: true,
      reviewedBy: 'SYSTEM_CURATED_PRESET',
    };
    this.assessments.set(defaultLowRisk.contentId, defaultLowRisk);

    const defaultHighRisk: ContentRiskAssessment = {
      contentId: 'generative-story-ai-variant-99',
      riskTier: 'HIGH',
      requiresHumanReview: true,
      isApproved: false,
    };
    this.assessments.set(defaultHighRisk.contentId, defaultHighRisk);
  }

  public assessContentRisk(
    contentId: string,
    contentType: 'STATIC_ASSET' | 'TEMPLATE_ADAPTIVE' | 'GENERATIVE_MULTIMODAL',
    metadata: {
      isGenerative?: boolean;
      containsExternalLinks?: boolean;
      flashFrequencyHz?: number;
      audioDecibelPeak?: number;
    }
  ): ContentRiskAssessment {
    if (!contentId) {
      throw new BadRequestException('ContentId is required');
    }

    // Safety checks against prohibited young child hazards
    if (metadata.containsExternalLinks) {
      const assessment: ContentRiskAssessment = {
        contentId,
        riskTier: 'HIGH',
        requiresHumanReview: true,
        isApproved: false,
        rejectionReason: 'CHILD-SEC-012: External hyperlinks strictly banned in early childhood content',
      };
      this.assessments.set(contentId, assessment);
      return assessment;
    }

    if (metadata.flashFrequencyHz && metadata.flashFrequencyHz >= 3.0) {
      const assessment: ContentRiskAssessment = {
        contentId,
        riskTier: 'HIGH',
        requiresHumanReview: true,
        isApproved: false,
        rejectionReason: 'CHILD-SAFE-015: Visual flicker >= 3Hz violates photosensitive seizure prevention standards',
      };
      this.assessments.set(contentId, assessment);
      return assessment;
    }

    let riskTier: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    let requiresHumanReview = false;
    let isApproved = false;

    if (contentType === 'GENERATIVE_MULTIMODAL' || metadata.isGenerative) {
      riskTier = 'HIGH';
      requiresHumanReview = true;
      isApproved = false; // Never auto-approve generative media for early childhood
    } else if (contentType === 'TEMPLATE_ADAPTIVE') {
      riskTier = 'MEDIUM';
      requiresHumanReview = false;
      isApproved = true; // Auto-approved with automated heuristic audit
    } else {
      riskTier = 'LOW';
      requiresHumanReview = false;
      isApproved = true; // Static vetted curriculum
    }

    const assessment: ContentRiskAssessment = {
      contentId,
      riskTier,
      requiresHumanReview,
      isApproved,
    };

    this.assessments.set(contentId, assessment);
    return assessment;
  }

  public approveContent(contentId: string, reviewerId: string, reviewerRole: string): ContentRiskAssessment {
    if (!reviewerId || !reviewerRole) {
      throw new BadRequestException('Reviewer ID and role required');
    }

    const allowedRoles = ['EDUCATOR', 'SAFEGUARDING_OFFICER', 'ADMIN', 'PEDAGOGICAL_LEAD'];
    if (!allowedRoles.includes(reviewerRole)) {
      throw new ForbiddenException(
        `CHILD-SEC-013: Unauthorized role ${reviewerRole}. Only certified educators or safeguarding officers may approve early childhood content`
      );
    }

    let assessment = this.assessments.get(contentId);
    if (!assessment) {
      assessment = {
        contentId,
        riskTier: 'MEDIUM',
        requiresHumanReview: false,
        isApproved: true,
      };
    }

    assessment.isApproved = true;
    assessment.reviewedBy = reviewerId;
    delete assessment.rejectionReason;

    this.assessments.set(contentId, assessment);
    return assessment;
  }

  public rejectContent(contentId: string, reviewerId: string, reason: string): ContentRiskAssessment {
    let assessment = this.assessments.get(contentId);
    if (!assessment) {
      assessment = {
        contentId,
        riskTier: 'HIGH',
        requiresHumanReview: true,
        isApproved: false,
      };
    }

    assessment.isApproved = false;
    assessment.reviewedBy = reviewerId;
    assessment.rejectionReason = reason;

    this.assessments.set(contentId, assessment);
    return assessment;
  }

  public isContentPlayableForChild(contentId: string): boolean {
    const assessment = this.assessments.get(contentId);
    if (!assessment) {
      // Unknown content default-denies
      return false;
    }
    return assessment.isApproved === true;
  }

  public getAssessment(contentId: string): ContentRiskAssessment | undefined {
    return this.assessments.get(contentId);
  }

  public registerVettedMediaHash(hash: string): void {
    this.vettedHashes.add(hash);
  }

  public verifyMediaHash(buffer: Buffer, expectedHash: string): boolean {
    const computed = crypto.createHash('sha256').update(buffer).digest('hex');
    const bufA = Buffer.from(computed, 'hex');
    const bufB = Buffer.from(expectedHash, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }
}
