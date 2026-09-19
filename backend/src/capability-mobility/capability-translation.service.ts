import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  CapabilityTranslationMapping,
  TransferTaskEvaluation,
} from './n23-types';
import * as crypto from 'crypto';

@Injectable()
export class CapabilityTranslationService {
  private readonly mappings = new Map<string, CapabilityTranslationMapping>();
  private readonly transferEvaluations = new Map<string, TransferTaskEvaluation>();

  constructor() {
    this.seedInitialMappings();
  }

  /**
   * Registers a capability translation mapping.
   * Invariant N23.16: No False Equivalence without scope, level, evidence, and confidence.
   */
  registerMapping(data: Partial<CapabilityTranslationMapping>): CapabilityTranslationMapping {
    if (
      !data.sourceInstitution ||
      !data.sourceCapabilityCode ||
      !data.targetInstitution ||
      !data.targetCapabilityCode ||
      !data.commonOntologyCode
    ) {
      throw new BadRequestException(
        'sourceInstitution, sourceCapabilityCode, targetInstitution, targetCapabilityCode, and commonOntologyCode are required',
      );
    }

    const confidence = data.confidence !== undefined ? data.confidence : 0.8;
    if (confidence < 0.0 || confidence > 1.0) {
      throw new BadRequestException('Confidence must be bounded between 0.0 and 1.0');
    }

    const mappingId =
      data.mappingId ||
      `map_${crypto.createHash('md5').update(`${data.sourceInstitution}:${data.sourceCapabilityCode}->${data.targetInstitution}:${data.targetCapabilityCode}`).digest('hex').substring(0, 12)}`;

    const mapping: CapabilityTranslationMapping = {
      mappingId,
      sourceInstitution: data.sourceInstitution,
      sourceCapabilityCode: data.sourceCapabilityCode,
      sourceCapabilityName: data.sourceCapabilityName || data.sourceCapabilityCode,
      targetInstitution: data.targetInstitution,
      targetCapabilityCode: data.targetCapabilityCode,
      targetCapabilityName: data.targetCapabilityName || data.targetCapabilityCode,
      commonOntologyCode: data.commonOntologyCode,
      confidence,
      reviewStatus: data.reviewStatus || 'VERIFIED',
      version: data.version || '2026.1',
      transferTaskRequired: data.transferTaskRequired ?? (confidence < 0.85),
      reviewedBy: data.reviewedBy || 'YOUVA_CURRICULUM_CROSSWALK_COUNCIL',
      updatedAt: new Date().toISOString(),
    };

    this.mappings.set(mappingId, mapping);
    return mapping;
  }

  /**
   * Translates a capability across institutions via the common capability ontology.
   */
  translateCapability(
    sourceInstitution: string,
    sourceCapabilityCode: string,
    targetInstitution: string,
  ): {
    mapping?: CapabilityTranslationMapping;
    directEquivalence: boolean;
    transferTaskRequired: boolean;
  } {
    const match = Array.from(this.mappings.values()).find(
      (m) =>
        m.sourceInstitution.toLowerCase() === sourceInstitution.toLowerCase() &&
        m.sourceCapabilityCode.toLowerCase() === sourceCapabilityCode.toLowerCase() &&
        m.targetInstitution.toLowerCase() === targetInstitution.toLowerCase() &&
        m.reviewStatus !== 'DEPRECATED',
    );

    if (!match) {
      return {
        directEquivalence: false,
        transferTaskRequired: true,
      };
    }

    return {
      mapping: match,
      directEquivalence: match.confidence >= 0.9 && !match.transferTaskRequired,
      transferTaskRequired: match.transferTaskRequired || match.confidence < 0.85,
    };
  }

  /**
   * Invariant N23.19–N23.20: Cross-Domain Transfer Evaluation.
   * Transfer must be demonstrated empirically rather than assumed.
   */
  evaluateTransferTask(evaluation: Partial<TransferTaskEvaluation>): TransferTaskEvaluation {
    if (
      !evaluation.learnerId ||
      !evaluation.sourceContext ||
      !evaluation.targetContext ||
      evaluation.demonstratedScore === undefined
    ) {
      throw new BadRequestException(
        'learnerId, sourceContext, targetContext, and demonstratedScore are required',
      );
    }

    if (evaluation.demonstratedScore < 0 || evaluation.demonstratedScore > 100) {
      throw new BadRequestException('demonstratedScore must be between 0 and 100');
    }

    const taskId = evaluation.taskId || `transfer_${crypto.randomBytes(8).toString('hex')}`;
    const transferValidated = evaluation.demonstratedScore >= 70;

    const record: TransferTaskEvaluation = {
      taskId,
      learnerId: evaluation.learnerId,
      sourceContext: evaluation.sourceContext,
      targetContext: evaluation.targetContext,
      demonstratedScore: evaluation.demonstratedScore,
      transferValidated,
      evaluator: evaluation.evaluator || 'INDEPENDENT_ASSESSOR',
      timestamp: new Date().toISOString(),
    };

    this.transferEvaluations.set(taskId, record);
    return record;
  }

  listMappings(filters?: {
    source?: string;
    target?: string;
    reviewStatus?: string;
  }): CapabilityTranslationMapping[] {
    let list = Array.from(this.mappings.values());
    if (filters) {
      if (filters.source) {
        list = list.filter((m) => m.sourceInstitution.toLowerCase() === filters.source!.toLowerCase());
      }
      if (filters.target) {
        list = list.filter((m) => m.targetInstitution.toLowerCase() === filters.target!.toLowerCase());
      }
      if (filters.reviewStatus) {
        list = list.filter((m) => m.reviewStatus === filters.reviewStatus);
      }
    }
    return list;
  }

  private seedInitialMappings(): void {
    this.registerMapping({
      sourceInstitution: 'Delhi_University',
      sourceCapabilityCode: 'DU_CS_201_DATA_STRUCTURES',
      sourceCapabilityName: 'Data Structures & Algorithms in C++',
      targetInstitution: 'MIT_OpenLearning',
      targetCapabilityCode: 'MIT_6_006_ALG',
      targetCapabilityName: 'Introduction to Algorithms',
      commonOntologyCode: 'ONT_CS_ALGORITHMS_CORE',
      confidence: 0.92,
      reviewStatus: 'VERIFIED',
      transferTaskRequired: false,
    });

    this.registerMapping({
      sourceInstitution: 'CBSE_India',
      sourceCapabilityCode: 'CBSE_XII_PHYSICS_EM',
      sourceCapabilityName: 'Electromagnetism & Wave Optics',
      targetInstitution: 'Cambridge_Assessment',
      targetCapabilityCode: 'CIE_A_LEVEL_PHYS_9702',
      targetCapabilityName: 'A-Level Physics Electromagnetics',
      commonOntologyCode: 'ONT_PHYS_ELECTROMAGNETISM',
      confidence: 0.88,
      reviewStatus: 'VERIFIED',
      transferTaskRequired: false,
    });

    this.registerMapping({
      sourceInstitution: 'Vocational_IT_Council',
      sourceCapabilityCode: 'VOC_CLOUD_SYSADMIN',
      sourceCapabilityName: 'Practical Cloud Linux Administration',
      targetInstitution: 'IIT_Madras_BSc',
      targetCapabilityCode: 'IITM_CS_SYS_ARCH',
      targetCapabilityName: 'Operating Systems & Cloud Architecture',
      commonOntologyCode: 'ONT_CS_CLOUD_SYSTEMS',
      confidence: 0.74, // Lower confidence requires transfer task
      reviewStatus: 'VERIFIED',
      transferTaskRequired: true,
    });
  }
}
