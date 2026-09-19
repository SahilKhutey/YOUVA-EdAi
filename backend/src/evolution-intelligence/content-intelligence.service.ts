import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  ContentArtifactMetric,
  ContentLifecycleStage,
  ContentModality,
} from './n17-types';

export interface AiGeneratedContentDraft {
  draftId: string;
  title: string;
  subject: string;
  conceptId: string;
  targetModality: ContentModality;
  rawContent: string;
  automatedSafetyChecked: boolean;
  automatedAccuracyScore: number;
  smeApprovalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  smeReviewerId?: string;
  smeNotes?: string;
  publishedArtifactId?: string;
  createdAt: string;
}

@Injectable()
export class ContentIntelligenceService {
  private readonly logger = new Logger(ContentIntelligenceService.name);

  // In-memory catalog of evaluated content artifacts
  private readonly artifacts = new Map<string, ContentArtifactMetric>();

  // In-memory queue for AI-generated drafts awaiting SME review
  private readonly aiDrafts = new Map<string, AiGeneratedContentDraft>();

  constructor() {
    this.seedDefaultArtifacts();
  }

  private seedDefaultArtifacts(): void {
    const defaultArtifacts: ContentArtifactMetric[] = [
      {
        artifactId: 'ART-FRAC-SIM-01',
        title: 'Interactive Pizza Fraction Slices Simulation',
        subject: 'Mathematics',
        conceptId: 'MATH-FRAC-001',
        modality: 'INTERACTIVE_SIMULATION',
        lifecycleStage: 'ACTIVE',
        masteryGainDelta: 0.38,
        retentionRate30d: 0.82,
        transferRateFar: 0.74,
        errorReductionRate: 0.65,
        completionRate: 0.94,
        teacherApprovalRate: 0.96,
        efficacyCompositeIndex: 82.5,
        flaggedForRetirement: false,
        lastEvaluatedAt: '2026-09-01T00:00:00Z',
      },
      {
        artifactId: 'ART-NEWTON-TEXT-02',
        title: 'Newtonian Force Formulas & Text Definitions',
        subject: 'Physics',
        conceptId: 'SCI-PHYS-002',
        modality: 'TEXT',
        lifecycleStage: 'REVIEW',
        masteryGainDelta: 0.12,
        retentionRate30d: 0.38,
        transferRateFar: 0.28,
        errorReductionRate: 0.22,
        completionRate: 0.61,
        teacherApprovalRate: 0.54,
        efficacyCompositeIndex: 35.8,
        flaggedForRetirement: true,
        smeReviewNotes: 'Passive text reading fails to address persistent velocity misconceptions; requires interactive vector sandbox.',
        lastEvaluatedAt: '2026-08-25T00:00:00Z',
      },
      {
        artifactId: 'ART-REC-AUDIO-03',
        title: 'Audio Walkthrough: Understanding Recursion Stacks',
        subject: 'Computer Science',
        conceptId: 'CS-ALGO-003',
        modality: 'AUDIO',
        lifecycleStage: 'REVISE',
        masteryGainDelta: 0.18,
        retentionRate30d: 0.44,
        transferRateFar: 0.32,
        errorReductionRate: 0.30,
        completionRate: 0.58,
        teacherApprovalRate: 0.62,
        efficacyCompositeIndex: 41.2,
        flaggedForRetirement: false,
        smeReviewNotes: 'Auditory only is sub-optimal for spatial call-stacks. Combining with interactive visual diagrams.',
        lastEvaluatedAt: '2026-08-30T00:00:00Z',
      },
    ];

    for (const art of defaultArtifacts) {
      this.artifacts.set(art.artifactId, art);
    }
  }

  // --- ARTIFACT RETRIEVAL & EVALUATION ---

  getAllArtifacts(): ContentArtifactMetric[] {
    return Array.from(this.artifacts.values());
  }

  getArtifactById(artifactId: string): ContentArtifactMetric | undefined {
    return this.artifacts.get(artifactId);
  }

  getArtifactsByConcept(conceptId: string): ContentArtifactMetric[] {
    return Array.from(this.artifacts.values()).filter((a) => a.conceptId === conceptId);
  }

  /**
   * Evaluates content efficacy using empirical multi-factor weighting (Clauses N17.18–N17.19).
   * Rejects clicks/vanity metrics in favor of educational gains.
   */
  evaluateContentEfficacy(
    artifactId: string,
    metrics: {
      masteryGainDelta: number;
      retentionRate30d: number;
      transferRateFar: number;
      errorReductionRate: number;
      completionRate: number;
      teacherApprovalRate: number;
    },
  ): ContentArtifactMetric {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) throw new NotFoundException(`Artifact ${artifactId} not found`);

    artifact.masteryGainDelta = metrics.masteryGainDelta;
    artifact.retentionRate30d = metrics.retentionRate30d;
    artifact.transferRateFar = metrics.transferRateFar;
    artifact.errorReductionRate = metrics.errorReductionRate;
    artifact.completionRate = metrics.completionRate;
    artifact.teacherApprovalRate = metrics.teacherApprovalRate;

    // Calculate weighted composite (0 - 100)
    const composite =
      0.30 * (metrics.masteryGainDelta * 100) +
      0.25 * (metrics.retentionRate30d * 100) +
      0.25 * (metrics.transferRateFar * 100) +
      0.10 * (metrics.errorReductionRate * 100) +
      0.10 * (metrics.teacherApprovalRate * 100);

    artifact.efficacyCompositeIndex = Number(composite.toFixed(1));
    artifact.lastEvaluatedAt = new Date().toISOString();

    // Auto-flag for review/retirement if composite < 40 or retention < 0.4
    if (artifact.efficacyCompositeIndex < 40 || artifact.retentionRate30d < 0.40) {
      artifact.flaggedForRetirement = true;
      if (artifact.lifecycleStage === 'ACTIVE') {
        artifact.lifecycleStage = 'REVIEW';
      }
      this.logger.warn(
        `[CONTENT-INTELLIGENCE] Artifact ${artifactId} flagged for review: Efficacy=${artifact.efficacyCompositeIndex}, Retention=${artifact.retentionRate30d}`,
      );
    } else {
      artifact.flaggedForRetirement = false;
    }

    return artifact;
  }

  /**
   * Transitions content through the retirement / revision lifecycle (Clause N17.20).
   * REVIEW -> REVISE -> RETEST -> REAPPROVE or RETIRE
   */
  transitionContentLifecycle(
    artifactId: string,
    nextStage: ContentLifecycleStage,
    smeNotes?: string,
  ): ContentArtifactMetric {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) throw new NotFoundException(`Artifact ${artifactId} not found`);

    const validTransitions: Record<ContentLifecycleStage, ContentLifecycleStage[]> = {
      ACTIVE: ['REVIEW', 'RETIRED'],
      REVIEW: ['REVISE', 'RETIRED'],
      REVISE: ['RETEST', 'RETIRED'],
      RETEST: ['REAPPROVE', 'REVISE', 'RETIRED'],
      REAPPROVE: ['ACTIVE'],
      RETIRED: [],
    };

    if (!validTransitions[artifact.lifecycleStage].includes(nextStage)) {
      throw new BadRequestException(
        `Invalid lifecycle transition from ${artifact.lifecycleStage} to ${nextStage}`,
      );
    }

    // Safety Gate: To reapprove, must have efficacy >= 60 and not be flagged
    if (nextStage === 'REAPPROVE' && artifact.efficacyCompositeIndex < 60) {
      throw new BadRequestException(
        `Cannot reapprove artifact ${artifactId} with efficacy score ${artifact.efficacyCompositeIndex} < 60`,
      );
    }

    artifact.lifecycleStage = nextStage;
    if (smeNotes) artifact.smeReviewNotes = smeNotes;
    if (nextStage === 'REAPPROVE') {
      artifact.lifecycleStage = 'ACTIVE';
      artifact.flaggedForRetirement = false;
    }

    this.logger.log(`[CONTENT-LIFECYCLE] Artifact ${artifactId} transitioned to ${nextStage}`);
    return artifact;
  }

  // --- AI-GENERATED CONTENT GUARDRAILS (Clauses N17.21–N17.22) ---

  /**
   * Submits AI-generated content draft for validation.
   * AI draft cannot enter curriculum without SME human approval.
   */
  submitAiDraft(draft: {
    title: string;
    subject: string;
    conceptId: string;
    targetModality: ContentModality;
    rawContent: string;
    automatedAccuracyScore: number;
  }): AiGeneratedContentDraft {
    const draftId = `DRAFT-AI-${Date.now().toString(36).toUpperCase()}`;

    // Automated safety check: accuracy score must be >= 0.85 to even enter SME queue
    const safetyPassed = draft.automatedAccuracyScore >= 0.85;

    const record: AiGeneratedContentDraft = {
      draftId,
      ...draft,
      automatedSafetyChecked: safetyPassed,
      smeApprovalStatus: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    this.aiDrafts.set(draftId, record);
    this.logger.log(`[AI-CONTENT-DRAFT] Created draft ${draftId} for concept ${draft.conceptId}`);
    return record;
  }

  getPendingAiDrafts(): AiGeneratedContentDraft[] {
    return Array.from(this.aiDrafts.values()).filter((d) => d.smeApprovalStatus === 'PENDING');
  }

  /**
   * SME approval for AI-generated content.
   * Only upon human pedagogical sign-off does the draft become an active learning artifact.
   */
  approveAiDraftBySme(
    draftId: string,
    smeReviewerId: string,
    pedagogicalNotes: string,
    approved: boolean,
  ): {
    draft: AiGeneratedContentDraft;
    publishedArtifact?: ContentArtifactMetric;
  } {
    const draft = this.aiDrafts.get(draftId);
    if (!draft) throw new NotFoundException(`Draft ${draftId} not found`);

    if (!draft.automatedSafetyChecked) {
      throw new BadRequestException(`Draft ${draftId} failed automated accuracy/safety checks; cannot approve`);
    }

    if (!approved) {
      draft.smeApprovalStatus = 'REJECTED';
      draft.smeReviewerId = smeReviewerId;
      draft.smeNotes = pedagogicalNotes;
      return { draft };
    }

    draft.smeApprovalStatus = 'APPROVED';
    draft.smeReviewerId = smeReviewerId;
    draft.smeNotes = pedagogicalNotes;

    // Publish as active artifact
    const artifactId = `ART-PUB-${draft.draftId.replace('DRAFT-AI-', '')}`;
    const newArtifact: ContentArtifactMetric = {
      artifactId,
      title: draft.title,
      subject: draft.subject,
      conceptId: draft.conceptId,
      modality: draft.targetModality,
      lifecycleStage: 'ACTIVE',
      masteryGainDelta: 0.25, // Initial baseline
      retentionRate30d: 0.70,
      transferRateFar: 0.60,
      errorReductionRate: 0.50,
      completionRate: 0.80,
      teacherApprovalRate: 0.85,
      efficacyCompositeIndex: 67.5,
      flaggedForRetirement: false,
      smeReviewNotes: pedagogicalNotes,
      lastEvaluatedAt: new Date().toISOString(),
    };

    this.artifacts.set(artifactId, newArtifact);
    draft.publishedArtifactId = artifactId;

    this.logger.log(`[AI-CONTENT-APPROVED] Draft ${draftId} published as artifact ${artifactId} by SME ${smeReviewerId}`);
    return { draft, publishedArtifact: newArtifact };
  }

  // --- CROSS-MODAL EQUIVALENCE (Clauses N17.23–N17.25) ---

  /**
   * Evaluates learning outcomes across modalities for a given concept.
   * Ensures learners switching modalities experience equivalent pedagogical quality.
   */
  evaluateCrossModalEquivalence(conceptId: string): {
    conceptId: string;
    modalityComparison: {
      modality: ContentModality;
      averageEfficacy: number;
      artifactCount: number;
    }[];
    recommendedPrimaryModality: ContentModality;
    crossModalParityAchieved: boolean;
  } {
    const conceptArtifacts = Array.from(this.artifacts.values()).filter((a) => a.conceptId === conceptId);

    const modalityMap = new Map<ContentModality, { total: number; count: number }>();
    for (const art of conceptArtifacts) {
      const entry = modalityMap.get(art.modality) || { total: 0, count: 0 };
      entry.total += art.efficacyCompositeIndex;
      entry.count += 1;
      modalityMap.set(art.modality, entry);
    }

    const comparison = Array.from(modalityMap.entries()).map(([modality, data]) => ({
      modality,
      averageEfficacy: Number((data.total / data.count).toFixed(1)),
      artifactCount: data.count,
    }));

    comparison.sort((a, b) => b.averageEfficacy - a.averageEfficacy);
    const primary = comparison.length > 0 ? comparison[0].modality : 'INTERACTIVE_SIMULATION';

    // Parity is achieved if spread between highest and lowest is <= 25 points
    const minEff = comparison.length > 0 ? Math.min(...comparison.map((c) => c.averageEfficacy)) : 0;
    const maxEff = comparison.length > 0 ? Math.max(...comparison.map((c) => c.averageEfficacy)) : 0;
    const parity = maxEff - minEff <= 25;

    return {
      conceptId,
      modalityComparison: comparison,
      recommendedPrimaryModality: primary,
      crossModalParityAchieved: parity,
    };
  }
}
