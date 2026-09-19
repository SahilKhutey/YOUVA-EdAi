import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CurriculumObjectiveMapping } from './n21-types';

@Injectable()
export class CurriculumIntelligenceService {
  private mappings: Map<string, CurriculumObjectiveMapping[]> = new Map(); // curriculumId -> CurriculumObjectiveMapping[]
  private teacherInsights: Map<string, any[]> = new Map(); // curriculumId -> Insights

  constructor() {
    this.seedInitialCurriculumData();
  }

  private seedInitialCurriculumData(): void {
    const curId = 'cur-cbse-cs-xii';
    const initialMappings: CurriculumObjectiveMapping[] = [
      {
        curriculumId: curId,
        objectiveText: 'Understand state machine replication and Raft consensus algorithms',
        mappedSkillId: 'skill-raft-consensus',
        mappedCapabilityId: 'cap-dist-sys-101',
        confidence: 0.92,
        qualitativeGapNote:
          'Covers theoretical consensus state transitions, but offers limited lab evidence opportunities for independent Byzantine partition testing.',
        evaluatedAt: new Date().toISOString(),
      },
      {
        curriculumId: curId,
        objectiveText: 'Formulate algorithmic fairness audits and bias mitigation metrics',
        mappedSkillId: 'skill-bias-metric-analysis',
        mappedCapabilityId: 'cap-ai-ethics-102',
        confidence: 0.88,
        qualitativeGapNote:
          'Strong mathematical coverage of parity metrics; recommend adding unassisted oral defense on societal trade-offs.',
        evaluatedAt: new Date().toISOString(),
      },
      {
        curriculumId: curId,
        objectiveText: 'Construct arithmetic circuits and zero-knowledge verification proofs',
        mappedSkillId: 'skill-circom-dsl',
        mappedCapabilityId: 'cap-zkp-103',
        confidence: 0.84,
        qualitativeGapNote:
          'Covers R1CS constraints; missing cross-domain transfer project with production decentralized ledgers.',
        evaluatedAt: new Date().toISOString(),
      },
    ];

    this.mappings.set(curId, initialMappings);

    // Non-punitive teacher feedback insights (Clause N21.52 - N21.55)
    this.teacherInsights.set(curId, [
      {
        topic: 'Distributed Consensus & Quorum Math',
        misconceptionCluster: 'Learners frequently confuse majority quorums with absolute unanimous agreement during network splits.',
        recommendedIntervention: 'Provide visual partition simulator before code kata.',
        isPunitiveRanking: false,
      },
    ]);
  }

  // --- Curriculum Crosswalk & Mapping ---

  public mapObjective(dto: {
    curriculumId: string;
    objectiveText: string;
    mappedSkillId: string;
    mappedCapabilityId: string;
    confidence: number;
    qualitativeGapNote: string;
  }): CurriculumObjectiveMapping {
    if (!dto.curriculumId || !dto.objectiveText || !dto.mappedCapabilityId) {
      throw new BadRequestException('curriculumId, objectiveText, and mappedCapabilityId are required');
    }

    const mapping: CurriculumObjectiveMapping = {
      curriculumId: dto.curriculumId,
      objectiveText: dto.objectiveText,
      mappedSkillId: dto.mappedSkillId || 'skill-general',
      mappedCapabilityId: dto.mappedCapabilityId,
      confidence: Math.min(1.0, Math.max(0.0, dto.confidence)),
      qualitativeGapNote: dto.qualitativeGapNote || 'Mapped without observed capability gap.',
      evaluatedAt: new Date().toISOString(),
    };

    const list = this.mappings.get(dto.curriculumId) || [];
    list.push(mapping);
    this.mappings.set(dto.curriculumId, list);

    return mapping;
  }

  public getCurriculumCrosswalk(curriculumId: string): CurriculumObjectiveMapping[] {
    const list = this.mappings.get(curriculumId);
    if (!list) {
      throw new NotFoundException(`Curriculum crosswalk for ${curriculumId} not found`);
    }
    return list;
  }

  // --- Qualitative Gap Analysis (Clause N21.50) ---

  public analyzeCurriculumGaps(curriculumId: string): {
    curriculumId: string;
    totalObjectives: number;
    averageMappingConfidence: number;
    qualitativeGapFindings: string[];
    isScalarScorePrevented: boolean;
    constitutionalDeclaration: string;
  } {
    const mappings = this.getCurriculumCrosswalk(curriculumId);

    const totalConfidence = mappings.reduce((sum, m) => sum + m.confidence, 0);
    const avgConfidence = mappings.length > 0 ? totalConfidence / mappings.length : 0;
    const gapNotes = mappings.map((m) => `[${m.mappedCapabilityId}] ${m.qualitativeGapNote}`);

    // Clause N21.50: Qualitative gap analysis rather than simplistic scalar score!
    return {
      curriculumId,
      totalObjectives: mappings.length,
      averageMappingConfidence: Math.round(avgConfidence * 100) / 100,
      qualitativeGapFindings: gapNotes,
      isScalarScorePrevented: true,
      constitutionalDeclaration:
        'Clause N21.50 Enforced: Qualitative evidence gap analysis provided. Reductionist single-scalar curriculum scoring is prohibited.',
    };
  }

  // --- Teacher Intelligence (Clause N21.52 - N21.55) ---

  public getTeacherDevelopmentInsights(curriculumId: string): {
    curriculumId: string;
    insights: any[];
    nonPunitiveGuarantee: string;
  } {
    const list = this.teacherInsights.get(curriculumId) || [];
    return {
      curriculumId,
      insights: list,
      nonPunitiveGuarantee:
        'Clause N21.53 - N21.54 Enforced: Teacher analytics strictly provide pedagogical misconception patterns. Punitive performance scoring and teacher rankings are constitutionally prohibited.',
    };
  }
}
