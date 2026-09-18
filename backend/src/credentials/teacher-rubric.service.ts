import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  RubricEvaluation,
  RubricTier,
  RubricCriterionScore,
  HighSchoolProjectSubmission,
} from './credential-types';
import { LearningEvidenceService } from './learning-evidence.service';
import { ProjectAssessmentService } from './project-assessment.service';

@Injectable()
export class TeacherRubricService {
  private readonly logger = new Logger(TeacherRubricService.name);
  private readonly evaluationStore = new Map<string, RubricEvaluation>();

  constructor(
    private readonly evidenceService: LearningEvidenceService,
    private readonly projectService: ProjectAssessmentService,
  ) {}

  /**
   * Generates a non-authoritative AI rubric suggestion (Clause N12.34).
   * AI can assist with draft feedback and rubric suggestions, but this does NOT constitute an authoritative grade.
   */
  generateAiRubricSuggestion(project: HighSchoolProjectSubmission): RubricEvaluation {
    const auth = project.authenticityScore;
    let baseTier: RubricTier = 'DEVELOPING';
    let basePoints = 2;

    if (auth >= 0.85) {
      baseTier = 'ADVANCED';
      basePoints = 4;
    } else if (auth >= 0.70) {
      baseTier = 'PROFICIENT';
      basePoints = 3;
    }

    const criteriaScores: RubricCriterionScore[] = [
      {
        criterionId: 'ARCH_DECOMP',
        tier: baseTier,
        points: basePoints,
        feedback: `AI Suggestion: Clear modular breakdown observed in ${project.title}.`,
      },
      {
        criterionId: 'CODE_QUALITY',
        tier: baseTier,
        points: basePoints,
        feedback: 'AI Suggestion: Clean code formatting and reasonable exception handling.',
      },
      {
        criterionId: 'TEST_RIGOR',
        tier: project.aiDisclosure.humanContributions.testingAndVerification ? baseTier : 'DEVELOPING',
        points: project.aiDisclosure.humanContributions.testingAndVerification ? basePoints : 2,
        feedback: project.aiDisclosure.humanContributions.testingAndVerification
          ? 'AI Suggestion: Human verification declared and supported.'
          : 'AI Suggestion: Verification gaps detected; student should provide test logs.',
      },
      {
        criterionId: 'REFLECTION',
        tier: project.aiDisclosure.humanContributions.personalReflection ? baseTier : 'BEGINNING',
        points: project.aiDisclosure.humanContributions.personalReflection ? basePoints : 1,
        feedback: 'AI Suggestion: Reflection depth evaluates intellectual ownership.',
      },
    ];

    const totalScore = criteriaScores.reduce((acc, c) => acc + c.points, 0);
    const maxScore = criteriaScores.length * 4;

    return {
      evaluationId: `ai-sugg-${crypto.randomUUID()}`,
      projectId: project.projectId,
      learnerId: project.learnerId,
      evaluatorId: 'AI_ASSISTANT',
      isAiAssistedSuggestion: true, // Non-authoritative flag (N12.34)
      rubricVersion: 'v1.0-standard',
      criteriaScores,
      totalScore,
      maxScore,
      overallComments: 'Draft AI suggestion for educator review. Not an authoritative grade.',
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * Authoritative teacher rubric evaluation (Clause N12.35).
   * Teacher reviews submission, evaluates rubric, sets official scores, and creates Level 4 learning evidence.
   */
  evaluateProject(params: {
    projectId: string;
    evaluatorId: string;
    criteriaScores: RubricCriterionScore[];
    overallComments: string;
    associatedSkillId: string;
  }): RubricEvaluation {
    const project = this.projectService.getProject(params.projectId);
    if (!project) {
      throw new NotFoundException(`Project ${params.projectId} not found.`);
    }

    if (!params.criteriaScores || params.criteriaScores.length === 0) {
      throw new BadRequestException('At least one rubric criterion score is required.');
    }

    const totalScore = params.criteriaScores.reduce((acc, c) => acc + c.points, 0);
    const maxScore = params.criteriaScores.length * 4;
    const normalizedScore = Math.round((totalScore / maxScore) * 100) / 100;

    const evaluationId = `eval-${crypto.randomUUID()}`;
    const evaluation: RubricEvaluation = {
      evaluationId,
      projectId: project.projectId,
      learnerId: project.learnerId,
      evaluatorId: params.evaluatorId,
      isAiAssistedSuggestion: false, // Authoritative human assessment
      rubricVersion: 'v1.0-standard',
      criteriaScores: params.criteriaScores,
      totalScore,
      maxScore,
      overallComments: params.overallComments,
      evaluatedAt: new Date().toISOString(),
    };

    this.evaluationStore.set(evaluationId, evaluation);
    project.rubricEvaluation = evaluation;
    project.status = 'EVALUATED';

    // Automatically record Level 4 Teacher-Reviewed evidence (N12.8 - N12.9)
    this.evidenceService.recordEvidence({
      learnerId: project.learnerId,
      tenantId: project.tenantId,
      skillId: params.associatedSkillId,
      evidenceType: 'TEACHER_REVIEW',
      qualityLevel: 4,
      score: normalizedScore,
      rubricVersion: 'v1.0-standard',
      sourceActivityId: project.projectId,
      verifiedBy: params.evaluatorId,
      metadata: {
        evaluationId,
        projectTitle: project.title,
        authenticityScore: project.authenticityScore,
      },
    });

    this.logger.log(`Teacher ${params.evaluatorId} evaluated project ${params.projectId} (Score: ${totalScore}/${maxScore})`);
    return evaluation;
  }

  getEvaluation(evaluationId: string): RubricEvaluation {
    const ev = this.evaluationStore.get(evaluationId);
    if (!ev) {
      throw new NotFoundException(`Evaluation '${evaluationId}' not found.`);
    }
    return ev;
  }
}
