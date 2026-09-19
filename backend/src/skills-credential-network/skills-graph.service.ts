import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  Skill,
  SkillStatus,
  SkillEquivalenceResult,
  EquivalenceLevel,
} from './n19-types';

@Injectable()
export class SkillsGraphService {
  private readonly logger = new Logger(SkillsGraphService.name);

  // In-memory catalog of canonical skills: key = skillId
  private readonly skills = new Map<string, Skill>();

  // In-memory crosswalk mappings: key = `${sourceTaxonomy}:${sourceSkillId}->${targetTaxonomy}:${targetSkillId}`
  private readonly crosswalks = new Map<string, SkillEquivalenceResult>();

  constructor() {
    this.seedDefaultSkills();
    this.seedDefaultCrosswalks();
  }

  private seedDefaultSkills(): void {
    const defaults: Skill[] = [
      {
        skillId: 'SKILL-MATH-CALC-DIFF',
        canonicalName: 'Differential Calculus & Chain Rule',
        description: 'Demonstrated mastery of finding derivatives of composite functions using the chain rule.',
        domain: 'Mathematics',
        level: 'ADVANCED',
        evidenceRequirements: ['min_3_transfer_problems_correct', 'explain_inner_outer_derivatives'],
        status: 'ACTIVE',
        version: '1.2.0',
        reviewDate: '2026-09-01',
        changeHistory: [
          { version: '1.0.0', changedAt: '2026-01-10T00:00:00Z', description: 'Initial creation' },
          { version: '1.2.0', changedAt: '2026-06-15T00:00:00Z', description: 'Added multi-variable extension' },
        ],
      },
      {
        skillId: 'SKILL-CS-ALGO-RECUR',
        canonicalName: 'Recursive Algorithms & Call Stack Reasoning',
        description: 'Formulating recursive solutions, verifying base cases, and tracing stack frame allocations.',
        domain: 'Computer Science',
        level: 'INTERMEDIATE',
        evidenceRequirements: ['pass_recursive_unit_tests', 'stack_overflow_prevention_audit'],
        status: 'ACTIVE',
        version: '1.0.0',
        reviewDate: '2026-08-15',
        changeHistory: [
          { version: '1.0.0', changedAt: '2026-02-01T00:00:00Z', description: 'Initial creation' },
        ],
      },
      {
        skillId: 'SKILL-PHYS-NEWTON-DYN',
        canonicalName: 'Newtonian Dynamics & Free Body Analysis',
        description: 'Constructing free-body diagrams, applying Newton’s laws to coupled systems, and resolving force vectors.',
        domain: 'Physics',
        level: 'INTERMEDIATE',
        evidenceRequirements: ['vector_decomposition_accuracy_ge_85', 'friction_normal_force_transfer'],
        status: 'ACTIVE',
        version: '1.1.0',
        reviewDate: '2026-07-20',
        changeHistory: [
          { version: '1.0.0', changedAt: '2026-01-20T00:00:00Z', description: 'Initial creation' },
          { version: '1.1.0', changedAt: '2026-07-20T00:00:00Z', description: 'Enhanced frictional constraints' },
        ],
      },
      {
        skillId: 'SKILL-MATH-CALC-INT',
        canonicalName: 'Integral Calculus & Fundamental Theorem',
        description: 'Evaluating definite and indefinite integrals, integration by parts, and accumulation problems.',
        parentSkillId: 'SKILL-MATH-CALC-DIFF',
        domain: 'Mathematics',
        level: 'ADVANCED',
        prerequisites: ['SKILL-MATH-CALC-DIFF'],
        evidenceRequirements: ['definite_integral_riemann_sum_demonstration'],
        status: 'ACTIVE',
        version: '1.0.0',
        reviewDate: '2026-09-05',
        changeHistory: [
          { version: '1.0.0', changedAt: '2026-03-01T00:00:00Z', description: 'Initial creation' },
        ],
      },
    ];

    for (const s of defaults) {
      this.skills.set(s.skillId, s);
    }
  }

  private seedDefaultCrosswalks(): void {
    const defaults: SkillEquivalenceResult[] = [
      {
        sourceSkillId: 'EXT-CBSE-MATH-XII-DIFF',
        targetSkillId: 'SKILL-MATH-CALC-DIFF',
        sourceTaxonomy: 'CBSE-XII-2026',
        targetTaxonomy: 'YOUVA-CANONICAL',
        equivalenceLevel: 'STRONG_MATCH',
        confidenceScore: 0.94,
        mappingRationale: 'Identical syllabus coverage on composite function derivatives and chain rule.',
      },
      {
        sourceSkillId: 'EXT-AP-CS-A-RECURSION',
        targetSkillId: 'SKILL-CS-ALGO-RECUR',
        sourceTaxonomy: 'COLLEGE-BOARD-AP-CSA',
        targetTaxonomy: 'YOUVA-CANONICAL',
        equivalenceLevel: 'STRONG_MATCH',
        confidenceScore: 0.96,
        mappingRationale: 'Direct match for AP CS A Unit 10 Recursion learning objectives.',
      },
      {
        sourceSkillId: 'EXT-IB-HL-PHYSICS-FORCES',
        targetSkillId: 'SKILL-PHYS-NEWTON-DYN',
        sourceTaxonomy: 'IB-DP-HL-PHYSICS',
        targetTaxonomy: 'YOUVA-CANONICAL',
        equivalenceLevel: 'PARTIAL_MATCH',
        confidenceScore: 0.78,
        mappingRationale: 'Covers Newton dynamics but IB HL requires rotational inertia which is in subskill.',
      },
    ];

    for (const c of defaults) {
      const key = `${c.sourceTaxonomy}:${c.sourceSkillId}->${c.targetTaxonomy}:${c.targetSkillId}`;
      this.crosswalks.set(key, c);
    }
  }

  // --- SKILLS GRAPH API ---

  getSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  getSkill(skillId: string): Skill | undefined {
    return this.skills.get(skillId);
  }

  registerSkill(skill: Skill): Skill {
    if (this.skills.has(skill.skillId)) {
      throw new BadRequestException(`Skill with ID ${skill.skillId} already exists`);
    }

    this.skills.set(skill.skillId, skill);
    this.logger.log(`[SKILL-REGISTERED] Registered canonical skill ${skill.skillId}: ${skill.canonicalName}`);
    return skill;
  }

  /**
   * Skill Versioning (Clause N19.8).
   * Upgrades a skill to a new version without invalidating historical evidence.
   */
  upgradeSkillVersion(
    skillId: string,
    newVersion: string,
    descriptionOfChange: string,
    updatedRequirements?: string[],
  ): Skill {
    const skill = this.skills.get(skillId);
    if (!skill) throw new NotFoundException(`Skill ${skillId} not found`);

    skill.changeHistory = skill.changeHistory || [];
    skill.changeHistory.push({
      version: skill.version,
      changedAt: new Date().toISOString(),
      description: descriptionOfChange,
    });

    skill.version = newVersion;
    if (updatedRequirements) {
      skill.evidenceRequirements = updatedRequirements;
    }
    skill.reviewDate = new Date().toISOString().split('T')[0];

    this.logger.log(`[SKILL-VERSIONED] Upgraded skill ${skillId} to version ${newVersion}`);
    return skill;
  }

  setSkillStatus(skillId: string, status: SkillStatus): Skill {
    const skill = this.skills.get(skillId);
    if (!skill) throw new NotFoundException(`Skill ${skillId} not found`);

    skill.status = status;
    return skill;
  }

  // --- SKILL EQUIVALENCE & CROSSWALK API (Clauses N19.9–N19.11, N19.54–N19.55) ---

  evaluateSkillEquivalence(
    sourceSkillId: string,
    targetSkillId: string,
    sourceTaxonomy: string = 'EXTERNAL',
    targetTaxonomy: string = 'YOUVA-CANONICAL',
    semanticSimilarityHint?: number,
  ): SkillEquivalenceResult {
    const key = `${sourceTaxonomy}:${sourceSkillId}->${targetTaxonomy}:${targetSkillId}`;
    const existing = this.crosswalks.get(key);
    if (existing) return existing;

    const similarity = semanticSimilarityHint !== undefined ? semanticSimilarityHint : 0.75;
    let level: EquivalenceLevel = 'PARTIAL_MATCH';
    let rationale = 'Automated semantic crosswalk mapping based on curriculum objective overlap.';

    if (similarity >= 0.90) {
      level = 'STRONG_MATCH';
      rationale = 'High confidence isomorphic curriculum match across core competencies and rubrics.';
    } else if (similarity >= 0.60) {
      level = 'PARTIAL_MATCH';
      rationale = 'Moderate conceptual overlap; prerequisite subskills differ slightly.';
    } else if (similarity >= 0.30) {
      level = 'RELATED';
      rationale = 'Adjacent domain or prerequisite relationship rather than direct equivalence.';
    } else {
      level = 'NO_MATCH';
      rationale = 'Distinct domain knowledge with minimal observable competency transfer.';
    }

    const result: SkillEquivalenceResult = {
      sourceSkillId,
      targetSkillId,
      sourceTaxonomy,
      targetTaxonomy,
      equivalenceLevel: level,
      confidenceScore: Number(similarity.toFixed(2)),
      mappingRationale: rationale,
    };

    this.crosswalks.set(key, result);
    return result;
  }

  getCrosswalks(): SkillEquivalenceResult[] {
    return Array.from(this.crosswalks.values());
  }
}
