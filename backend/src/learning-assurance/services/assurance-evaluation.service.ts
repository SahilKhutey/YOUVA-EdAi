import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AssuranceDomain,
  AssuranceEvaluationDto,
  EvaluateTargetDto,
  EvaluationStatus,
  QualityCheckResult,
} from '../domain/assurance.types';
import { AIAssuranceEvaluator } from '../rules/evaluators/ai-assurance.evaluator';
import { AssessmentAssuranceEvaluator } from '../rules/evaluators/assessment-assurance.evaluator';
import { DataAssuranceEvaluator } from '../rules/evaluators/data-assurance.evaluator';
import { KnowledgeAssuranceEvaluator } from '../rules/evaluators/knowledge-assurance.evaluator';
import { LearningAssuranceEvaluator } from '../rules/evaluators/learning-assurance.evaluator';
import { OperationsAssuranceEvaluator } from '../rules/evaluators/operations-assurance.evaluator';
import { OrchestrationAssuranceEvaluator } from '../rules/evaluators/orchestration-assurance.evaluator';
import { PersonalizationAssuranceEvaluator } from '../rules/evaluators/personalization-assurance.evaluator';
import { SecurityAssuranceEvaluator } from '../rules/evaluators/security-assurance.evaluator';
import { FindingService } from './finding.service';

@Injectable()
export class AssuranceEvaluationService {
  private readonly logger = new Logger(AssuranceEvaluationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly findingService: FindingService,
    private readonly knowledgeEvaluator: KnowledgeAssuranceEvaluator,
    private readonly learningEvaluator: LearningAssuranceEvaluator,
    private readonly assessmentEvaluator: AssessmentAssuranceEvaluator,
    private readonly aiEvaluator: AIAssuranceEvaluator,
    private readonly personalizationEvaluator: PersonalizationAssuranceEvaluator,
    private readonly orchestrationEvaluator: OrchestrationAssuranceEvaluator,
    private readonly dataEvaluator: DataAssuranceEvaluator,
    private readonly securityEvaluator: SecurityAssuranceEvaluator,
    private readonly operationsEvaluator: OperationsAssuranceEvaluator,
  ) {}

  async evaluateTarget(dto: EvaluateTargetDto): Promise<AssuranceEvaluationDto> {
    const tenantId = dto.tenantId ?? 'default-tenant';
    const checks: QualityCheckResult[] = [];
    const payload = dto.payload ?? {};

    // 1. Knowledge Evaluation
    if (!dto.domains || dto.domains.includes('KNOWLEDGE')) {
      if (dto.targetType === 'KNOWLEDGE_OBJECT' || dto.targetType === 'LESSON') {
        const kChecks = this.knowledgeEvaluator.evaluate({
          id: dto.targetId,
          tenantId,
          title: payload.title,
          objectives: payload.objectives,
          isPublished: payload.isPublished,
          modifyingPublished: payload.modifyingPublished,
          targetTenantId: payload.targetTenantId,
          hasOrphanRef: payload.hasOrphanRef,
        });
        checks.push(...kChecks);
      }
    }

    // 2. Assessment Evaluation
    if (!dto.domains || dto.domains.includes('ASSESSMENT')) {
      if (dto.targetType === 'ASSESSMENT_QUESTION' || dto.targetType === 'QUIZ') {
        const aChecks = this.assessmentEvaluator.evaluate({
          id: dto.targetId,
          objectiveId: payload.objectiveId,
          lessonObjectiveIds: payload.lessonObjectiveIds,
          correctAnswersCount: payload.correctAnswersCount ?? 1,
          difficultyMetadata: payload.difficultyMetadata,
        });
        checks.push(...aChecks);
      }
    }

    // 3. AI Evaluation
    if (!dto.domains || dto.domains.includes('AI')) {
      if (dto.targetType === 'AI_OUTPUT' || payload.isAiGenerated) {
        const aiRecord = this.aiEvaluator.evaluate({
          generationId: dto.targetId,
          provider: payload.provider ?? 'internal-ai',
          model: payload.model ?? 'gemini-1.5-pro',
          inputReferences: payload.inputReferences ?? [],
          outputHash: payload.outputHash,
          unsupportedClaimsCount: payload.unsupportedClaimsCount,
          partiallyGroundedClaimsCount: payload.partiallyGroundedClaimsCount,
          attemptingToPublishDirectly: payload.attemptingToPublishDirectly,
          humanApproved: payload.humanApproved,
        });

        if (aiRecord.policyStatus === 'BLOCK') {
          checks.push({
            checkId: 'AI-002',
            category: 'AI_SAFETY_GATE',
            status: 'FAIL',
            message: aiRecord.violations?.join('; ') ?? 'AI Output validation failed.',
            evidenceIds: [dto.targetId],
            severity: 'CRITICAL',
          });
        } else if (aiRecord.policyStatus === 'WARNING') {
          checks.push({
            checkId: 'AI-001',
            category: 'AI_GROUNDING',
            status: 'WARNING',
            message: aiRecord.violations?.join('; ') ?? 'AI Output partial grounding detected.',
            evidenceIds: [dto.targetId],
            severity: 'HIGH',
          });
        }
      }
    }

    // 4. Personalization Evaluation
    if (!dto.domains || dto.domains.includes('PERSONALIZATION')) {
      if (dto.targetType === 'PERSONALIZATION_RECOMMENDATION') {
        const pChecks = this.personalizationEvaluator.evaluate({
          learnerId: payload.learnerId ?? dto.targetId,
          consecutiveSameRecommendationCount: payload.consecutiveSameRecommendationCount ?? 0,
          prerequisiteBypassed: payload.prerequisiteBypassed,
          activeAssignmentConflict: payload.activeAssignmentConflict,
        });
        checks.push(...pChecks);
      }
    }

    // 5. Security Evaluation
    if (!dto.domains || dto.domains.includes('SECURITY')) {
      if (payload.actorTenantId || payload.isSensitiveAction) {
        const sChecks = this.securityEvaluator.evaluate({
          targetId: dto.targetId,
          actorTenantId: payload.actorTenantId ?? tenantId,
          targetTenantId: payload.targetTenantId ?? tenantId,
          actorRole: payload.actorRole ?? 'TEACHER',
          requiredRole: payload.requiredRole,
          isSensitiveAction: payload.isSensitiveAction,
          hasAuditRecord: payload.hasAuditRecord ?? true,
        });
        checks.push(...sChecks);
      }
    }

    // 6. Data Evaluation
    if (!dto.domains || dto.domains.includes('DATA')) {
      if (payload.hasDuplicateEvents || payload.hasOrphanRecord || payload.isHistoricalEvidence) {
        const dChecks = this.dataEvaluator.evaluate({
          targetId: dto.targetId,
          hasDuplicateEvents: payload.hasDuplicateEvents,
          hasOrphanRecord: payload.hasOrphanRecord,
          isHistoricalEvidence: payload.isHistoricalEvidence,
          evidenceVersion: payload.evidenceVersion,
          currentVersion: payload.currentVersion,
        });
        checks.push(...dChecks);
      }
    }

    // Determine overall status
    let status: EvaluationStatus = 'PASS';
    const hasCriticalFail = checks.some((c) => c.status === 'FAIL' && c.severity === 'CRITICAL');
    const hasFail = checks.some((c) => c.status === 'FAIL');
    const hasWarning = checks.some((c) => c.status === 'WARNING');

    if (hasCriticalFail) {
      status = 'BLOCKED';
    } else if (hasFail) {
      status = 'FAIL';
    } else if (hasWarning) {
      status = 'WARNING';
    }

    // Register findings for warnings & failures
    for (const check of checks) {
      if (check.status === 'FAIL' || check.status === 'WARNING') {
        const domain = (check.checkId.split('-')[0] as string) || 'KNOWLEDGE';
        const domainMap: Record<string, AssuranceDomain> = {
          KNOW: 'KNOWLEDGE',
          LEARN: 'LEARNING',
          ASSESS: 'ASSESSMENT',
          AI: 'AI',
          PERS: 'PERSONALIZATION',
          ORCH: 'ORCHESTRATION',
          DATA: 'DATA',
          SEC: 'SECURITY',
          OPS: 'OPERATIONS',
        };

        await this.findingService.createOrUpdateFinding({
          tenantId,
          domain: domainMap[domain] ?? 'KNOWLEDGE',
          targetType: dto.targetType,
          targetId: dto.targetId,
          ruleId: check.checkId,
          severity: check.severity,
          message: check.message,
          evidenceIds: check.evidenceIds,
        });
      }
    }

    // Store evaluation in DB
    const evaluation = await this.prisma.assuranceEvaluation.create({
      data: {
        tenantId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        methodologyVersion: '1.0.0',
        status,
        result: { checks } as any,
      },
    });

    return {
      id: evaluation.id,
      tenantId: evaluation.tenantId,
      targetType: evaluation.targetType,
      targetId: evaluation.targetId,
      methodologyVersion: evaluation.methodologyVersion,
      status: evaluation.status as EvaluationStatus,
      result: evaluation.result as Record<string, any>,
      createdAt: evaluation.createdAt,
    };
  }
}
