import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { SkillDefinition } from './credential-types';

@Injectable()
export class SkillTaxonomyService {
  private readonly logger = new Logger(SkillTaxonomyService.name);
  private readonly taxonomy = new Map<string, SkillDefinition>();

  constructor() {
    this.seedDefaultTaxonomy();
  }

  private seedDefaultTaxonomy(): void {
    const defaultSkills: SkillDefinition[] = [
      // Computational Thinking
      {
        skillId: 'CT-DECOMP',
        name: 'Computational Decomposition',
        description: 'Decomposing complex distributed systems and multi-step computational problems into modular units.',
        domain: 'COMPUTATIONAL_THINKING',
        level: 'INTERMEDIATE',
        prerequisites: [],
        assessmentCriteria: [
          'Identifies independent system components',
          'Defines clear interfaces between subsystems',
          'Minimizes coupling and maximizes cohesion',
        ],
        version: 'v1.0.0',
      },
      {
        skillId: 'CT-ABSTRACTION',
        name: 'Algorithmic Abstraction',
        description: 'Isolating generalized patterns and invariants from implementation-specific details.',
        domain: 'COMPUTATIONAL_THINKING',
        level: 'INTERMEDIATE',
        prerequisites: ['CT-DECOMP'],
        assessmentCriteria: [
          'Formulates parameterized models',
          'Extracts reusable design patterns',
        ],
        version: 'v1.0.0',
      },
      {
        skillId: 'CT-ALGO',
        name: 'Algorithmic Optimization',
        description: 'Analyzing computational complexity (Big-O) and optimizing runtime and space efficiency.',
        domain: 'COMPUTATIONAL_THINKING',
        level: 'ADVANCED',
        prerequisites: ['CT-ABSTRACTION'],
        assessmentCriteria: [
          'Evaluates asymptotic time/space bounds',
          'Applies memoization and dynamic programming',
        ],
        version: 'v1.0.0',
      },
      {
        skillId: 'CT-DEBUG',
        name: 'Systematic Fault Isolation & Debugging',
        description: 'Root cause isolation using deterministic test suites, log telemetry, and invariant assertion.',
        domain: 'COMPUTATIONAL_THINKING',
        level: 'INTERMEDIATE',
        prerequisites: ['CT-DECOMP'],
        assessmentCriteria: [
          'Reproduces failure with minimal reproduction case',
          'Formulates falsifiable debugging hypotheses',
        ],
        version: 'v1.0.0',
      },

      // AI Literacy
      {
        skillId: 'AI-FOUNDATIONS',
        name: 'Neural Network & Transformer Foundations',
        description: 'Understanding tokenization, vector embeddings, attention heads, and model training phases.',
        domain: 'AI_LITERACY',
        level: 'INTERMEDIATE',
        prerequisites: [],
        assessmentCriteria: [
          'Explains vector embedding similarity',
          'Describes self-attention mechanism tradeoffs',
        ],
        version: 'v1.0.0',
      },
      {
        skillId: 'AI-LIMITS-HALLUCINATION',
        name: 'AI Hallucination & Epistemic Calibration',
        description: 'Detecting synthetic hallucination, factual divergence, and probabilistic overconfidence in LLM outputs.',
        domain: 'AI_LITERACY',
        level: 'ADVANCED',
        prerequisites: ['AI-FOUNDATIONS'],
        assessmentCriteria: [
          'Designs fact-checking and retrieval-augmented verification',
          'Audits confidence vs truthfulness in model outputs',
        ],
        version: 'v1.0.0',
      },
      {
        skillId: 'AI-PROMPT-VERIFY',
        name: 'Prompt Architecture & Structured Verification',
        description: 'Engineering few-shot prompts, chain-of-thought scaffolds, and JSON schema output validation.',
        domain: 'AI_LITERACY',
        level: 'INTERMEDIATE',
        prerequisites: ['AI-FOUNDATIONS'],
        assessmentCriteria: [
          'Applies structured delimiters and system boundaries',
          'Validates machine outputs against strict type schemas',
        ],
        version: 'v1.0.0',
      },
      {
        skillId: 'AI-ETHICS-BIAS',
        name: 'Algorithmic Fairness, Bias & Responsible AI',
        description: 'Identifying demographic bias in training corpora, privacy hazards, and ethical human oversight.',
        domain: 'AI_LITERACY',
        level: 'ADVANCED',
        prerequisites: ['AI-FOUNDATIONS'],
        assessmentCriteria: [
          'Detects systemic sampling skew in datasets',
          'Proposes human-in-the-loop remediation protocols',
        ],
        version: 'v1.0.0',
      },

      // Data Science & Quantitative Literacy
      {
        skillId: 'DS-DATA-CLEANING',
        name: 'Data Pipeline Hygiene & Schema Enforcement',
        description: 'Validating data integrity, missing data imputation, and outlier boundary checks.',
        domain: 'DATA_SCIENCE',
        level: 'FOUNDATION',
        prerequisites: [],
        assessmentCriteria: [
          'Normalizes raw tabular data to schema',
          'Handles null, NaN, and corrupt sensor values',
        ],
        version: 'v1.0.0',
      },
      {
        skillId: 'DS-EXPLORATORY-ANALYSIS',
        name: 'Exploratory Data Analysis (EDA)',
        description: 'Statistical distribution analysis, correlation matrix generation, and visual anomaly identification.',
        domain: 'DATA_SCIENCE',
        level: 'INTERMEDIATE',
        prerequisites: ['DS-DATA-CLEANING'],
        assessmentCriteria: [
          'Computes mean, median, IQR, and standard deviation',
          'Identifies multivariable correlations and confounding variables',
        ],
        version: 'v1.0.0',
      },
      {
        skillId: 'DS-STATS-INFERENCE',
        name: 'Statistical Inference & Hypothesis Testing',
        description: 'Formulating null hypotheses, p-value calculations, t-tests, and confidence interval estimation.',
        domain: 'DATA_SCIENCE',
        level: 'ADVANCED',
        prerequisites: ['DS-EXPLORATORY-ANALYSIS'],
        assessmentCriteria: [
          'Frames two-tailed statistical hypothesis tests',
          'Controls for Type I and Type II errors',
        ],
        version: 'v1.0.0',
      },

      // Software Engineering
      {
        skillId: 'SE-MODULAR-DESIGN',
        name: 'Modular Software Architecture',
        description: 'Designing clean domain boundaries, dependency injection, and separation of concerns.',
        domain: 'SOFTWARE_ENGINEERING',
        level: 'INTERMEDIATE',
        prerequisites: ['CT-DECOMP'],
        assessmentCriteria: [
          'Constructs decoupled service layers',
          'Enforces single responsibility principles',
        ],
        version: 'v1.0.0',
      },
      {
        skillId: 'SE-SECURE-CODING',
        name: 'Defensive & Secure Programming',
        description: 'Mitigating injection attacks, path traversal, replay vulnerabilities, and input sanitation.',
        domain: 'SOFTWARE_ENGINEERING',
        level: 'ADVANCED',
        prerequisites: ['SE-MODULAR-DESIGN'],
        assessmentCriteria: [
          'Prevents SQL/NoSQL/prompt injection',
          'Applies constant-time cryptographic verification',
        ],
        version: 'v1.0.0',
      },
    ];

    for (const skill of defaultSkills) {
      this.taxonomy.set(skill.skillId, skill);
    }
    this.logger.log(`Initialized Skill Taxonomy with ${this.taxonomy.size} high-school competencies.`);
  }

  getSkill(skillId: string): SkillDefinition {
    const skill = this.taxonomy.get(skillId);
    if (!skill) {
      throw new NotFoundException(`Skill '${skillId}' not found in taxonomy.`);
    }
    return skill;
  }

  listSkills(filter?: { domain?: string; level?: string; version?: string }): SkillDefinition[] {
    let result = Array.from(this.taxonomy.values());
    if (filter?.domain) {
      result = result.filter(s => s.domain === filter.domain);
    }
    if (filter?.level) {
      result = result.filter(s => s.level === filter.level);
    }
    if (filter?.version) {
      result = result.filter(s => s.version === filter.version);
    }
    return result;
  }

  registerSkill(definition: SkillDefinition): SkillDefinition {
    if (!definition.skillId || !definition.name || !definition.version) {
      throw new BadRequestException('Skill definition requires skillId, name, and version.');
    }
    this.taxonomy.set(definition.skillId, definition);
    return definition;
  }

  validatePrerequisites(skillId: string, demonstratedSkillIds: string[]): { satisfied: boolean; missing: string[] } {
    const skill = this.getSkill(skillId);
    const missing = skill.prerequisites.filter(prereq => !demonstratedSkillIds.includes(prereq));
    return {
      satisfied: missing.length === 0,
      missing,
    };
  }

  /**
   * Enforces Clause N12.7: Skill != Lesson Invariant.
   * Completing lessons alone cannot fulfill a skill demonstration requirement.
   */
  assertSkillNotLessonRule(evidenceTypes: string[]): boolean {
    const hasSubstantiveEvidence = evidenceTypes.some(t =>
      ['ASSESSMENT', 'PROJECT', 'PERFORMANCE', 'TEACHER_REVIEW', 'TRANSFER_TASK'].includes(t)
    );
    if (!hasSubstantiveEvidence) {
      throw new BadRequestException(
        'Clause N12.7 Violation: Completing instructional lessons does not demonstrate a skill. ' +
        'Substantive evidence (Assessment, Project, Performance, or Teacher Review) is mandatory.'
      );
    }
    return true;
  }
}
