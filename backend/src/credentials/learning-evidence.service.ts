import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { LearningEvidence, EvidenceQualityLevel, LearningEvidenceType } from './credential-types';

export interface SkillEvidenceSummary {
  skillId: string;
  learnerId: string;
  evidenceCount: number;
  qualityLevelMax: EvidenceQualityLevel;
  averageScore: number;
  distinctEvidenceTypes: LearningEvidenceType[];
  hasTeacherReview: boolean;
  hasProjectArtifact: boolean;
  hasAssessment: boolean;
  isEligibleForCredentialing: boolean;
}

@Injectable()
export class LearningEvidenceService {
  private readonly logger = new Logger(LearningEvidenceService.name);
  private readonly evidenceStore = new Map<string, LearningEvidence>();

  recordEvidence(params: {
    learnerId: string;
    tenantId: string;
    skillId: string;
    evidenceType: LearningEvidenceType;
    qualityLevel: EvidenceQualityLevel;
    score?: number;
    rubricVersion?: string;
    sourceActivityId?: string;
    verifiedBy?: string;
    metadata?: Record<string, any>;
    authenticityScore?: number;
  }): LearningEvidence {
    if (!params.learnerId || !params.tenantId || !params.skillId) {
      throw new BadRequestException('learnerId, tenantId, and skillId are required.');
    }
    if (params.qualityLevel < 1 || params.qualityLevel > 5) {
      throw new BadRequestException('Evidence qualityLevel must be between 1 and 5.');
    }
    if (params.score !== undefined && (params.score < 0 || params.score > 1.0)) {
      throw new BadRequestException('Evidence score must be normalized between 0.0 and 1.0.');
    }

    const evidenceId = `evid-${crypto.randomUUID()}`;
    const evidence: LearningEvidence = {
      evidenceId,
      learnerId: params.learnerId,
      tenantId: params.tenantId,
      skillId: params.skillId,
      evidenceType: params.evidenceType,
      qualityLevel: params.qualityLevel,
      score: params.score !== undefined ? Math.round(params.score * 100) / 100 : undefined,
      rubricVersion: params.rubricVersion,
      sourceActivityId: params.sourceActivityId,
      verifiedBy: params.verifiedBy || 'SYSTEM',
      createdAt: new Date().toISOString(),
      metadata: params.metadata || {},
      authenticityScore: params.authenticityScore,
      isRetracted: false,
    };

    this.evidenceStore.set(evidenceId, evidence);
    this.logger.log(`Recorded evidence ${evidenceId} for learner ${params.learnerId}, skill ${params.skillId} (Level ${params.qualityLevel})`);
    return evidence;
  }

  getEvidence(evidenceId: string): LearningEvidence {
    const ev = this.evidenceStore.get(evidenceId);
    if (!ev || ev.isRetracted) {
      throw new NotFoundException(`Evidence '${evidenceId}' not found or retracted.`);
    }
    return ev;
  }

  getLearnerEvidence(learnerId: string, tenantId?: string): LearningEvidence[] {
    let list = Array.from(this.evidenceStore.values()).filter(
      ev => ev.learnerId === learnerId && !ev.isRetracted
    );
    if (tenantId) {
      list = list.filter(ev => ev.tenantId === tenantId);
    }
    return list;
  }

  getLearnerSkillEvidence(learnerId: string, skillId: string, tenantId?: string): LearningEvidence[] {
    return this.getLearnerEvidence(learnerId, tenantId).filter(ev => ev.skillId === skillId);
  }

  /**
   * Multi-source evidence aggregation (N12.10)
   * Aggregates multiple evidence instances into a robust skill profile.
   */
  aggregateSkillEvidence(learnerId: string, skillId: string, tenantId?: string): SkillEvidenceSummary {
    const evidences = this.getLearnerSkillEvidence(learnerId, skillId, tenantId);
    if (evidences.length === 0) {
      return {
        skillId,
        learnerId,
        evidenceCount: 0,
        qualityLevelMax: 1,
        averageScore: 0,
        distinctEvidenceTypes: [],
        hasTeacherReview: false,
        hasProjectArtifact: false,
        hasAssessment: false,
        isEligibleForCredentialing: false,
      };
    }

    const distinctTypes = Array.from(new Set(evidences.map(e => e.evidenceType)));
    let maxQuality: EvidenceQualityLevel = 1;
    let totalScore = 0;
    let scoredCount = 0;

    for (const ev of evidences) {
      if (ev.qualityLevel > maxQuality) {
        maxQuality = ev.qualityLevel;
      }
      if (ev.score !== undefined) {
        totalScore += ev.score;
        scoredCount++;
      }
    }

    const averageScore = scoredCount > 0 ? Math.round((totalScore / scoredCount) * 100) / 100 : 0;
    const hasTeacherReview = distinctTypes.includes('TEACHER_REVIEW') || evidences.some(e => e.qualityLevel >= 4);
    const hasProjectArtifact = distinctTypes.includes('PROJECT') || distinctTypes.includes('PORTFOLIO');
    const hasAssessment = distinctTypes.includes('ASSESSMENT');

    // Rule: Credential eligibility requires at least 2 distinct evidence types and max quality >= 2
    const isEligibleForCredentialing = distinctTypes.length >= 2 && maxQuality >= 2 && averageScore >= 0.70;

    return {
      skillId,
      learnerId,
      evidenceCount: evidences.length,
      qualityLevelMax: maxQuality,
      averageScore,
      distinctEvidenceTypes: distinctTypes,
      hasTeacherReview,
      hasProjectArtifact,
      hasAssessment,
      isEligibleForCredentialing,
    };
  }

  /**
   * Retracts evidence in case of academic misconduct or administrative error (N12.26).
   */
  retractEvidence(evidenceId: string, reason: string): boolean {
    const ev = this.evidenceStore.get(evidenceId);
    if (!ev) {
      throw new NotFoundException(`Evidence '${evidenceId}' not found.`);
    }
    ev.isRetracted = true;
    ev.metadata = {
      ...ev.metadata,
      retractedAt: new Date().toISOString(),
      retractionReason: reason,
    };
    this.logger.warn(`Retracted evidence ${evidenceId}: ${reason}`);
    return true;
  }
}
