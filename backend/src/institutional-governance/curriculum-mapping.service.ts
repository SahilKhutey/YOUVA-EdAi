import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  CurriculumStandard,
  CurriculumMapping,
} from './n16-types';

@Injectable()
export class CurriculumMappingService {
  private readonly logger = new Logger(CurriculumMappingService.name);

  private readonly standards = new Map<string, CurriculumStandard>();
  private readonly mappings = new Map<string, CurriculumMapping>();
  private readonly contentProvenanceLedger = new Map<
    string,
    {
      contentId: string;
      title: string;
      conceptId: string;
      smeReviewerId: string;
      generatingModelVersion?: string;
      status: 'DRAFT' | 'SME_APPROVED' | 'DEPLOYED';
      approvedAt: string;
    }
  >();

  constructor() {
    this.seedDefaultStandardsAndMappings();
  }

  private seedDefaultStandardsAndMappings(): void {
    // Standards
    const ncert10: CurriculumStandard = {
      standardId: 'std-ncert-class10',
      name: 'NCERT Mathematics Class 10',
      authority: 'NCERT',
      jurisdictionId: 'IN-DL',
      version: '2024-2025',
    };

    const cambridgeIgcse: CurriculumStandard = {
      standardId: 'std-cambridge-igcse-0580',
      name: 'Cambridge IGCSE Mathematics 0580',
      authority: 'CAMBRIDGE_ASSESSMENT',
      jurisdictionId: 'UK-ENG',
      version: '2025-2027',
    };

    const commonCoreCa: CurriculumStandard = {
      standardId: 'std-common-core-ca',
      name: 'California Common Core State Standards for Mathematics (CCSSM)',
      authority: 'CALIFORNIA_DOE',
      jurisdictionId: 'US-CA',
      version: 'v4.1',
    };

    this.standards.set(ncert10.standardId, ncert10);
    this.standards.set(cambridgeIgcse.standardId, cambridgeIgcse);
    this.standards.set(commonCoreCa.standardId, commonCoreCa);

    // Mappings for core concept: MATH-QUAD-01 (Quadratic Equations)
    const mappingNcert: CurriculumMapping = {
      mappingId: 'map-quad-ncert',
      youvaConceptId: 'MATH-QUAD-01',
      standardId: ncert10.standardId,
      externalStandardCode: 'NCERT-G10-CH4',
      learningObjective: 'Solve quadratic equations by factorization and completing the square',
      competencyTier: 3,
      evidenceCriteria: ['DIAGNOSTIC_QUIZ_SCORE_80', 'WORD_PROBLEM_APPLICATION'],
      status: 'VERIFIED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mappingCambridge: CurriculumMapping = {
      mappingId: 'map-quad-cambridge',
      youvaConceptId: 'MATH-QUAD-01',
      standardId: cambridgeIgcse.standardId,
      externalStandardCode: 'CIE-0580-E2.5',
      learningObjective: 'Rearrange and solve quadratic equations algebraically and graphically',
      competencyTier: 3,
      evidenceCriteria: ['STRUCTURED_PROOF_ACCURACY', 'EXAM_STYLE_SUBMISSION'],
      status: 'VERIFIED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mappingCommonCore: CurriculumMapping = {
      mappingId: 'map-quad-ccss',
      youvaConceptId: 'MATH-QUAD-01',
      standardId: commonCoreCa.standardId,
      externalStandardCode: 'HSA-REI.B.4',
      learningObjective: 'Solve quadratic equations in one variable using factoring and quadratic formula',
      competencyTier: 3,
      evidenceCriteria: ['GRAPHICAL_REPRESENTATION', 'ALGEBRAIC_DERIVATION'],
      status: 'VERIFIED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.mappings.set(mappingNcert.mappingId, mappingNcert);
    this.mappings.set(mappingCambridge.mappingId, mappingCambridge);
    this.mappings.set(mappingCommonCore.mappingId, mappingCommonCore);
  }

  // --- 1. Curriculum Standard & Mapping Registry (Clauses N16.19 - N16.20) ---

  public registerStandard(standard: CurriculumStandard): CurriculumStandard {
    if (this.standards.has(standard.standardId)) {
      throw new BadRequestException(`CURR-001: Standard [${standard.standardId}] already registered`);
    }
    this.standards.set(standard.standardId, standard);
    this.logger.log(`Registered CurriculumStandard [${standard.standardId}]: ${standard.name}`);
    return standard;
  }

  public registerMapping(mapping: Omit<CurriculumMapping, 'mappingId' | 'createdAt' | 'updatedAt' | 'status'>): CurriculumMapping {
    const mappingId = `map-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newMapping: CurriculumMapping = {
      ...mapping,
      mappingId,
      status: 'VERIFIED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.mappings.set(mappingId, newMapping);
    this.logger.log(
      `Mapped YOUVA concept [${newMapping.youvaConceptId}] to [${newMapping.externalStandardCode}] (Standard: ${newMapping.standardId})`
    );
    return newMapping;
  }

  public getMappingsForConcept(youvaConceptId: string): CurriculumMapping[] {
    return Array.from(this.mappings.values()).filter((m) => m.youvaConceptId === youvaConceptId);
  }

  public getMappingsForStandard(standardId: string): CurriculumMapping[] {
    return Array.from(this.mappings.values()).filter((m) => m.standardId === standardId);
  }

  // --- 2. Localization & Cultural Adaptation (Clause N16.18) ---

  public resolveLocalizedMetadata(params: {
    youvaConceptId: string;
    locale: string;
  }): {
    localizedTitle: string;
    dateFormat: string;
    numberFormat: string;
    readingDirection: 'ltr' | 'rtl';
    accessibilitySupport: string[];
  } {
    const isRtl = params.locale.startsWith('ar') || params.locale.startsWith('he') || params.locale.startsWith('ur');
    const isIndia = params.locale.includes('IN') || params.locale.startsWith('hi');

    return {
      localizedTitle: `Concept [${params.youvaConceptId}] for locale [${params.locale}]`,
      dateFormat: isIndia ? 'DD/MM/YYYY' : params.locale.includes('US') ? 'MM/DD/YYYY' : 'YYYY-MM-DD',
      numberFormat: isIndia ? 'en-IN' : 'en-US',
      readingDirection: isRtl ? 'rtl' : 'ltr',
      accessibilitySupport: ['SCREEN_READER_ARIA', 'KEYBOARD_NAVIGATION', 'HIGH_CONTRAST', 'SPEECH_CAPTIONS'],
    };
  }

  // --- 3. Content Provenance & Academic Integrity (Clauses N16.140 - N16.142) ---

  public recordContentProvenance(params: {
    contentId: string;
    title: string;
    conceptId: string;
    smeReviewerId: string;
    generatingModelVersion?: string;
  }): void {
    this.contentProvenanceLedger.set(params.contentId, {
      ...params,
      status: 'SME_APPROVED',
      approvedAt: new Date().toISOString(),
    });
    this.logger.log(`Approved content provenance for [${params.contentId}] by SME [${params.smeReviewerId}]`);
  }

  public assertContentApproved(contentId: string): boolean {
    const record = this.contentProvenanceLedger.get(contentId);
    if (!record || record.status !== 'SME_APPROVED') {
      throw new BadRequestException(
        `INTEG-001: Content [${contentId}] lacks verified Subject Matter Expert (SME) approval. Cannot deploy to learners.`
      );
    }
    return true;
  }
}
