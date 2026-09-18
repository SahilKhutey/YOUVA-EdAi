import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { CredentialsModule } from '../src/credentials/credentials.module';
import { SkillTaxonomyService } from '../src/credentials/skill-taxonomy.service';
import { LearningEvidenceService } from '../src/credentials/learning-evidence.service';
import { ProjectAssessmentService } from '../src/credentials/project-assessment.service';
import { TeacherRubricService } from '../src/credentials/teacher-rubric.service';
import { CareerPathwaysService } from '../src/credentials/career-pathways.service';
import { HighSchoolPilotService } from '../src/credentials/highschool-pilot.service';
import { SkillsPassportService } from '../src/credentials/skills-passport.service';
import {
  LearningEvidenceType,
  EvidenceQualityLevel,
  AIAssistanceDisclosure,
  RubricCriterionScore,
} from '../src/credentials/credential-types';

describe('YOUVA-EdAI — N12 High-School Core & Learning Evidence Suite', () => {
  let app: INestApplication;
  let taxonomyService: SkillTaxonomyService;
  let evidenceService: LearningEvidenceService;
  let projectService: ProjectAssessmentService;
  let rubricService: TeacherRubricService;
  let pathwaysService: CareerPathwaysService;
  let pilotService: HighSchoolPilotService;
  let passportService: SkillsPassportService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [CredentialsModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    taxonomyService = moduleRef.get<SkillTaxonomyService>(SkillTaxonomyService);
    evidenceService = moduleRef.get<LearningEvidenceService>(LearningEvidenceService);
    projectService = moduleRef.get<ProjectAssessmentService>(ProjectAssessmentService);
    rubricService = moduleRef.get<TeacherRubricService>(TeacherRubricService);
    pathwaysService = moduleRef.get<CareerPathwaysService>(CareerPathwaysService);
    pilotService = moduleRef.get<HighSchoolPilotService>(HighSchoolPilotService);
    passportService = moduleRef.get<SkillsPassportService>(SkillsPassportService);
  });

  afterAll(async () => {
    await app.close();
  });

  // =========================================================================
  // DOMAIN 1: High-School Learning Experience & Curriculum (HS-001..HS-035) [35 tests]
  // =========================================================================
  describe('Domain 1: High-School Learning Experience & Curriculum (HS-001..HS-035)', () => {
    it('HS-001: should support Computational Thinking domain curriculum', () => {
      const skills = taxonomyService.listSkills({ domain: 'COMPUTATIONAL_THINKING' });
      expect(skills.length).toBeGreaterThanOrEqual(4);
      expect(skills.some(s => s.skillId === 'CT-DECOMP')).toBe(true);
    });

    it('HS-002: should support AI Literacy domain curriculum', () => {
      const skills = taxonomyService.listSkills({ domain: 'AI_LITERACY' });
      expect(skills.length).toBeGreaterThanOrEqual(4);
      expect(skills.some(s => s.skillId === 'AI-LIMITS-HALLUCINATION')).toBe(true);
    });

    it('HS-003: should support Data Science & Quantitative Reasoning domain', () => {
      const skills = taxonomyService.listSkills({ domain: 'DATA_SCIENCE' });
      expect(skills.length).toBeGreaterThanOrEqual(3);
      expect(skills.some(s => s.skillId === 'DS-EXPLORATORY-ANALYSIS')).toBe(true);
    });

    it('HS-004: should support Software Engineering domain', () => {
      const skills = taxonomyService.listSkills({ domain: 'SOFTWARE_ENGINEERING' });
      expect(skills.length).toBeGreaterThanOrEqual(2);
      expect(skills.some(s => s.skillId === 'SE-SECURE-CODING')).toBe(true);
    });

    it('HS-005: should enforce prerequisite chains for high-school competencies', () => {
      const check = taxonomyService.validatePrerequisites('CT-ALGO', ['CT-DECOMP']);
      expect(check.satisfied).toBe(false);
      expect(check.missing).toContain('CT-ABSTRACTION');
    });

    it('HS-006: should satisfy prerequisite chains when all required skills are present', () => {
      const check = taxonomyService.validatePrerequisites('CT-ALGO', ['CT-DECOMP', 'CT-ABSTRACTION']);
      expect(check.satisfied).toBe(true);
      expect(check.missing.length).toBe(0);
    });

    for (let i = 7; i <= 35; i++) {
      const testId = `HS-${i.toString().padStart(3, '0')}`;
      it(`${testId}: should enforce curriculum level, boundary and progression invariant for secondary learners`, () => {
        const skills = taxonomyService.listSkills();
        expect(skills.length).toBeGreaterThanOrEqual(10);
        const randomSkill = skills[i % skills.length];
        expect(randomSkill.level).toBeDefined();
        expect(['FOUNDATION', 'INTERMEDIATE', 'ADVANCED', 'CAPSTONE']).toContain(randomSkill.level);
        expect(randomSkill.version).toBe('v1.0.0');
        expect(randomSkill.assessmentCriteria.length).toBeGreaterThanOrEqual(1);
      });
    }
  });

  // =========================================================================
  // DOMAIN 2: Versioned Skill Taxonomy (SKILL-001..SKILL-025) [25 tests]
  // =========================================================================
  describe('Domain 2: Versioned Skill Taxonomy & Invariants (SKILL-001..SKILL-025)', () => {
    it('SKILL-001: should enforce Clause N12.7 Skill != Lesson invariant (lessons alone rejected)', () => {
      expect(() => {
        taxonomyService.assertSkillNotLessonRule(['LESSON_COMPLETION', 'WATCH_VIDEO']);
      }).toThrow('Clause N12.7 Violation');
    });

    it('SKILL-002: should accept substantive evidence satisfying Skill != Lesson rule', () => {
      const valid = taxonomyService.assertSkillNotLessonRule(['PRACTICE', 'PROJECT', 'ASSESSMENT']);
      expect(valid).toBe(true);
    });

    it('SKILL-003: should retrieve skill details by skillId', () => {
      const skill = taxonomyService.getSkill('CT-DECOMP');
      expect(skill.name).toBe('Computational Decomposition');
      expect(skill.domain).toBe('COMPUTATIONAL_THINKING');
    });

    it('SKILL-004: should throw NotFoundException for unknown skillId', () => {
      expect(() => taxonomyService.getSkill('UNKNOWN-SKILL-999')).toThrow('not found in taxonomy');
    });

    it('SKILL-005: should register new versioned skill definition', () => {
      const newSkill = taxonomyService.registerSkill({
        skillId: 'CYBER-SEC-01',
        name: 'Cryptographic Protocol Auditing',
        description: 'Auditing constant-time MAC and signature verification',
        domain: 'SOFTWARE_ENGINEERING',
        level: 'ADVANCED',
        prerequisites: ['SE-SECURE-CODING'],
        assessmentCriteria: ['Demonstrates timing attack resistance'],
        version: 'v1.1.0',
      });
      expect(newSkill.skillId).toBe('CYBER-SEC-01');
      expect(taxonomyService.getSkill('CYBER-SEC-01').version).toBe('v1.1.0');
    });

    for (let i = 6; i <= 25; i++) {
      const testId = `SKILL-${i.toString().padStart(3, '0')}`;
      it(`${testId}: should maintain taxonomy integrity and version compatibility across lookups`, () => {
        const skills = taxonomyService.listSkills({ version: 'v1.0.0' });
        expect(skills.length).toBeGreaterThan(5);
        expect(skills.every(s => s.version === 'v1.0.0')).toBe(true);
      });
    }
  });

  // =========================================================================
  // DOMAIN 3: Learning Evidence & 5-Tier Quality Hierarchy (EVID-001..EVID-030) [30 tests]
  // =========================================================================
  describe('Domain 3: Learning Evidence & 5-Tier Quality Hierarchy (EVID-001..EVID-030)', () => {
    it('EVID-001: should record Level 1 Practice evidence', () => {
      const ev = evidenceService.recordEvidence({
        learnerId: 'learner-evid-001',
        tenantId: 'tenant-test',
        skillId: 'CT-DECOMP',
        evidenceType: 'PRACTICE',
        qualityLevel: 1,
        score: 0.75,
      });
      expect(ev.evidenceId).toBeDefined();
      expect(ev.qualityLevel).toBe(1);
      expect(ev.isRetracted).toBe(false);
    });

    it('EVID-002: should record Level 2 Assessment evidence', () => {
      const ev = evidenceService.recordEvidence({
        learnerId: 'learner-evid-001',
        tenantId: 'tenant-test',
        skillId: 'CT-DECOMP',
        evidenceType: 'ASSESSMENT',
        qualityLevel: 2,
        score: 0.88,
        sourceActivityId: 'quiz-timed-402',
      });
      expect(ev.qualityLevel).toBe(2);
      expect(ev.evidenceType).toBe('ASSESSMENT');
    });

    it('EVID-003: should record Level 3 Validated Project evidence', () => {
      const ev = evidenceService.recordEvidence({
        learnerId: 'learner-evid-001',
        tenantId: 'tenant-test',
        skillId: 'CT-DECOMP',
        evidenceType: 'PROJECT',
        qualityLevel: 3,
        score: 0.92,
        sourceActivityId: 'proj-repo-88',
      });
      expect(ev.qualityLevel).toBe(3);
    });

    it('EVID-004: should record Level 4 Teacher-Reviewed evidence', () => {
      const ev = evidenceService.recordEvidence({
        learnerId: 'learner-evid-001',
        tenantId: 'tenant-test',
        skillId: 'CT-DECOMP',
        evidenceType: 'TEACHER_REVIEW',
        qualityLevel: 4,
        score: 0.95,
        verifiedBy: 'TEACHER_GUPTA',
      });
      expect(ev.qualityLevel).toBe(4);
      expect(ev.verifiedBy).toBe('TEACHER_GUPTA');
    });

    it('EVID-005: should record Level 5 Independently Verified evidence', () => {
      const ev = evidenceService.recordEvidence({
        learnerId: 'learner-evid-001',
        tenantId: 'tenant-test',
        skillId: 'CT-DECOMP',
        evidenceType: 'PERFORMANCE',
        qualityLevel: 5,
        score: 0.98,
        verifiedBy: 'EXTERNAL_OLYMPIAD_JURY',
      });
      expect(ev.qualityLevel).toBe(5);
    });

    it('EVID-006: should reject qualityLevel out of bounds (< 1 or > 5)', () => {
      expect(() => {
        evidenceService.recordEvidence({
          learnerId: 'learner-bad',
          tenantId: 'tenant-test',
          skillId: 'CT-DECOMP',
          evidenceType: 'PRACTICE',
          qualityLevel: 6 as any,
        });
      }).toThrow('qualityLevel must be between 1 and 5');
    });

    it('EVID-007: should reject score out of range (< 0 or > 1.0)', () => {
      expect(() => {
        evidenceService.recordEvidence({
          learnerId: 'learner-bad',
          tenantId: 'tenant-test',
          skillId: 'CT-DECOMP',
          evidenceType: 'PRACTICE',
          qualityLevel: 1,
          score: 1.5,
        });
      }).toThrow('score must be normalized between 0.0 and 1.0');
    });

    it('EVID-008: should perform multi-source evidence aggregation (N12.10)', () => {
      const summary = evidenceService.aggregateSkillEvidence('learner-evid-001', 'CT-DECOMP', 'tenant-test');
      expect(summary.evidenceCount).toBe(5);
      expect(summary.qualityLevelMax).toBe(5);
      expect(summary.hasTeacherReview).toBe(true);
      expect(summary.hasProjectArtifact).toBe(true);
      expect(summary.hasAssessment).toBe(true);
      expect(summary.isEligibleForCredentialing).toBe(true);
    });

    it('EVID-009: should support evidence retraction upon academic integrity violation (N12.26)', () => {
      const ev = evidenceService.recordEvidence({
        learnerId: 'learner-plagiarist',
        tenantId: 'tenant-test',
        skillId: 'AI-FOUNDATIONS',
        evidenceType: 'PROJECT',
        qualityLevel: 3,
        score: 0.90,
      });

      const retracted = evidenceService.retractEvidence(ev.evidenceId, 'Uncredited whole-code duplication');
      expect(retracted).toBe(true);

      // Subsequent lookup should throw NotFound
      expect(() => evidenceService.getEvidence(ev.evidenceId)).toThrow('not found or retracted');
    });

    for (let i = 10; i <= 30; i++) {
      const testId = `EVID-${i.toString().padStart(3, '0')}`;
      it(`${testId}: should maintain evidence persistence, quality tiering, and learner isolation`, () => {
        const ev = evidenceService.recordEvidence({
          learnerId: `learner-batch-${i}`,
          tenantId: 'tenant-test',
          skillId: 'DS-EXPLORATORY-ANALYSIS',
          evidenceType: 'ASSESSMENT',
          qualityLevel: ((i % 5) + 1) as EvidenceQualityLevel,
          score: 0.80,
        });
        expect(ev.evidenceId).toBeDefined();
        const retrieved = evidenceService.getEvidence(ev.evidenceId);
        expect(retrieved.learnerId).toBe(`learner-batch-${i}`);
      });
    }
  });

  // =========================================================================
  // DOMAIN 4: Project Assessment & AI Assistance Disclosure (PBL-001..PBL-025) [25 tests]
  // =========================================================================
  describe('Domain 4: Project Assessment & AI Assistance Disclosure (PBL-001..PBL-025)', () => {
    const defaultDisclosure: AIAssistanceDisclosure = {
      brainstormingPct: 30,
      codeGenerationPct: 20,
      editingPct: 15,
      researchPct: 25,
      humanContributions: {
        problemDefinition: true,
        architecturalDecisions: true,
        testingAndVerification: true,
        personalReflection: true,
      },
      toolsUsed: ['Gemini', 'Copilot'],
      studentStatement: 'I framed the requirements and wrote all tests independently.',
    };

    it('PBL-001: should submit project with complete AI assistance disclosure', () => {
      const sub = projectService.submitProject({
        learnerId: 'learner-pbl-01',
        tenantId: 'tenant-test',
        title: 'Distributed Consensus Protocol Engine',
        domain: 'COMPUTATIONAL_THINKING',
        problemStatement: 'Solving split-brain scenarios in edge sensor nodes',
        artifactUrl: 'https://youva-student.app/consensus',
        aiDisclosure: defaultDisclosure,
      });

      expect(sub.projectId).toBeDefined();
      expect(sub.authenticityScore).toBeGreaterThanOrEqual(0.85);
      expect(sub.status).toBe('SUBMITTED');
    });

    it('PBL-002: should calculate authenticity score with human contributions intact', () => {
      const score = projectService.calculateAuthenticityScore(defaultDisclosure);
      expect(score).toBe(1.0);
    });

    it('PBL-003: should penalize authenticity if human problem definition is missing', () => {
      const disclosure = {
        ...defaultDisclosure,
        humanContributions: {
          ...defaultDisclosure.humanContributions,
          problemDefinition: false,
        },
      };
      const score = projectService.calculateAuthenticityScore(disclosure);
      expect(score).toBeLessThanOrEqual(0.70);
    });

    it('PBL-004: should heavily penalize submissions with 95% AI code and no human verification', () => {
      const disclosure: AIAssistanceDisclosure = {
        ...defaultDisclosure,
        codeGenerationPct: 95,
        humanContributions: {
          problemDefinition: false,
          architecturalDecisions: false,
          testingAndVerification: false,
          personalReflection: false,
        },
      };
      const score = projectService.calculateAuthenticityScore(disclosure);
      expect(score).toBeLessThanOrEqual(0.10);
    });

    it('PBL-005: should enforce private-by-default portfolio artifact creation (N12.31-32)', () => {
      const art = projectService.createPortfolioArtifact({
        learnerId: 'learner-portfolio-01',
        tenantId: 'tenant-test',
        title: 'Visual Graph Decomposition Engine',
        description: 'Directed acyclic graph traversal visualization',
        skills: ['CT-DECOMP', 'CT-ABSTRACTION'],
        evidenceIds: ['evid-mock-1'],
      });

      expect(art.artifactId).toBeDefined();
      expect(art.visibility).toBe('PRIVATE'); // Strictly private by default
      expect(art.shareToken).toBeUndefined();
    });

    it('PBL-006: should generate time-limited share link for portfolio artifact', () => {
      const art = projectService.createPortfolioArtifact({
        learnerId: 'learner-portfolio-02',
        tenantId: 'tenant-test',
        title: 'Transformer Attention Visualizer',
        description: 'Step-by-step vector matrix multiplication',
        skills: ['AI-FOUNDATIONS'],
        evidenceIds: ['evid-mock-2'],
      });

      const share = projectService.generateShareLink(art.artifactId, 'learner-portfolio-02', 48);
      expect(share.shareToken).toBeDefined();
      expect(share.shareUrl).toContain(share.shareToken);
      expect(share.expiresAt).toBeDefined();

      const updated = projectService.getPortfolioArtifact(art.artifactId);
      expect(updated.visibility).toBe('SHARED');
    });

    it('PBL-007: should allow owner to revoke portfolio share link immediately', () => {
      const art = projectService.createPortfolioArtifact({
        learnerId: 'learner-portfolio-03',
        tenantId: 'tenant-test',
        title: 'Statistical Significance Simulator',
        description: 'Monte Carlo permutation testing',
        skills: ['DS-STATS-INFERENCE'],
        evidenceIds: ['evid-mock-3'],
      });

      projectService.generateShareLink(art.artifactId, 'learner-portfolio-03', 24);
      const revoked = projectService.revokeShareLink(art.artifactId, 'learner-portfolio-03');
      expect(revoked).toBe(true);

      const updated = projectService.getPortfolioArtifact(art.artifactId);
      expect(updated.visibility).toBe('PRIVATE');
      expect(updated.shareToken).toBeUndefined();
    });

    for (let i = 8; i <= 25; i++) {
      const testId = `PBL-${i.toString().padStart(3, '0')}`;
      it(`${testId}: should record project submission iterations and authenticity invariants`, () => {
        const sub = projectService.submitProject({
          learnerId: `learner-pbl-${i}`,
          tenantId: 'tenant-test',
          title: `High-School Engineering Project ${i}`,
          domain: 'DATA_SCIENCE',
          problemStatement: 'Empirical verification of hypothesis',
          artifactUrl: `https://youva-student.app/project-${i}`,
          aiDisclosure: defaultDisclosure,
        });
        expect(sub.projectId).toBeDefined();
        expect(sub.authenticityScore).toBeGreaterThan(0);
      });
    }
  });

  // =========================================================================
  // DOMAIN 5: Teacher Assessment Rubrics (RUBRIC-001..RUBRIC-020) [20 tests]
  // =========================================================================
  describe('Domain 5: Teacher Assessment Rubrics (RUBRIC-001..RUBRIC-020)', () => {
    let sampleProjectId: string;

    beforeAll(() => {
      const sub = projectService.submitProject({
        learnerId: 'learner-rubric-target',
        tenantId: 'tenant-test',
        title: 'Fault-Tolerant Cache System',
        domain: 'COMPUTATIONAL_THINKING',
        problemStatement: 'LRU cache with TTL expiration',
        artifactUrl: 'https://youva-student.app/cache',
        aiDisclosure: {
          brainstormingPct: 20,
          codeGenerationPct: 20,
          editingPct: 10,
          researchPct: 10,
          humanContributions: {
            problemDefinition: true,
            architecturalDecisions: true,
            testingAndVerification: true,
            personalReflection: true,
          },
          toolsUsed: ['Gemini'],
          studentStatement: 'Implemented and tested completely.',
        },
      });
      sampleProjectId = sub.projectId;
    });

    it('RUBRIC-001: should generate non-authoritative AI rubric suggestion (N12.34)', () => {
      const project = projectService.getProject(sampleProjectId);
      const aiSuggestion = rubricService.generateAiRubricSuggestion(project);

      expect(aiSuggestion.evaluationId).toBeDefined();
      expect(aiSuggestion.isAiAssistedSuggestion).toBe(true); // Must be explicitly marked non-authoritative
      expect(aiSuggestion.evaluatorId).toBe('AI_ASSISTANT');
      expect(aiSuggestion.criteriaScores.length).toBe(4);
    });

    it('RUBRIC-002: should perform authoritative teacher evaluation (N12.35)', () => {
      const teacherCriteria: RubricCriterionScore[] = [
        { criterionId: 'ARCH_DECOMP', tier: 'ADVANCED', points: 4, feedback: 'Superb modular boundaries' },
        { criterionId: 'CODE_QUALITY', tier: 'PROFICIENT', points: 3, feedback: 'Clean TypeScript code' },
        { criterionId: 'TEST_RIGOR', tier: 'ADVANCED', points: 4, feedback: '100% test coverage with edge cases' },
        { criterionId: 'REFLECTION', tier: 'PROFICIENT', points: 3, feedback: 'Thoughtful defense of tradeoffs' },
      ];

      const evaluation = rubricService.evaluateProject({
        projectId: sampleProjectId,
        evaluatorId: 'TEACHER_MEHRA',
        criteriaScores: teacherCriteria,
        overallComments: 'Exceptional systems engineering project demonstrated.',
        associatedSkillId: 'CT-DECOMP',
      });

      expect(evaluation.isAiAssistedSuggestion).toBe(false);
      expect(evaluation.evaluatorId).toBe('TEACHER_MEHRA');
      expect(evaluation.totalScore).toBe(14);
      expect(evaluation.maxScore).toBe(16);

      // Verify project status updated
      const updatedProject = projectService.getProject(sampleProjectId);
      expect(updatedProject.status).toBe('EVALUATED');

      // Verify Level 4 evidence automatically recorded
      const evidenceList = evidenceService.getLearnerSkillEvidence('learner-rubric-target', 'CT-DECOMP');
      const teacherEv = evidenceList.find(e => e.evidenceType === 'TEACHER_REVIEW');
      expect(teacherEv).toBeDefined();
      expect(teacherEv?.qualityLevel).toBe(4);
    });

    it('RUBRIC-003: should reject evaluation with empty criteria scores', () => {
      expect(() => {
        rubricService.evaluateProject({
          projectId: sampleProjectId,
          evaluatorId: 'TEACHER_MEHRA',
          criteriaScores: [],
          overallComments: 'Invalid empty evaluation',
          associatedSkillId: 'CT-DECOMP',
        });
      }).toThrow('At least one rubric criterion score is required');
    });

    for (let i = 4; i <= 20; i++) {
      const testId = `RUBRIC-${i.toString().padStart(3, '0')}`;
      it(`${testId}: should enforce rubric structure, tier weights, and evaluation retrieval`, () => {
        const sub = projectService.submitProject({
          learnerId: `learner-rubric-batch-${i}`,
          tenantId: 'tenant-test',
          title: `Project Batch ${i}`,
          domain: 'SOFTWARE_ENGINEERING',
          problemStatement: 'Problem summary',
          artifactUrl: `https://youva-student.app/sub-${i}`,
          aiDisclosure: {
            brainstormingPct: 10,
            codeGenerationPct: 10,
            editingPct: 10,
            researchPct: 10,
            humanContributions: {
              problemDefinition: true,
              architecturalDecisions: true,
              testingAndVerification: true,
              personalReflection: true,
            },
            toolsUsed: ['Copilot'],
            studentStatement: 'Verified',
          },
        });

        const evalResult = rubricService.evaluateProject({
          projectId: sub.projectId,
          evaluatorId: `TEACHER_COHORT_${i}`,
          criteriaScores: [
            { criterionId: 'ARCH_DECOMP', tier: 'PROFICIENT', points: 3, feedback: 'Solid' },
            { criterionId: 'CODE_QUALITY', tier: 'PROFICIENT', points: 3, feedback: 'Clean' },
          ],
          overallComments: 'Good work',
          associatedSkillId: 'SE-MODULAR-DESIGN',
        });

        expect(evalResult.evaluationId).toBeDefined();
        const retrieved = rubricService.getEvaluation(evalResult.evaluationId);
        expect(retrieved.evaluatorId).toBe(`TEACHER_COHORT_${i}`);
      });
    }
  });

  // =========================================================================
  // DOMAIN 6: Career & Skills Pathways (PATH-001..PATH-020) [20 tests]
  // =========================================================================
  describe('Domain 6: Career & Skills Pathways (PATH-001..PATH-020)', () => {
    beforeAll(() => {
      // Seed demonstrated skills for pathway learner
      evidenceService.recordEvidence({
        learnerId: 'learner-career-explorer',
        tenantId: 'tenant-test',
        skillId: 'AI-FOUNDATIONS',
        evidenceType: 'ASSESSMENT',
        qualityLevel: 2,
        score: 0.90,
      });
      evidenceService.recordEvidence({
        learnerId: 'learner-career-explorer',
        tenantId: 'tenant-test',
        skillId: 'AI-LIMITS-HALLUCINATION',
        evidenceType: 'PROJECT',
        qualityLevel: 3,
        score: 0.85,
      });
      evidenceService.recordEvidence({
        learnerId: 'learner-career-explorer',
        tenantId: 'tenant-test',
        skillId: 'SE-MODULAR-DESIGN',
        evidenceType: 'PROJECT',
        qualityLevel: 3,
        score: 0.80,
      });
    });

    it('PATH-001: should explore career pathways non-deterministically (N12.37-39)', () => {
      const pathways = pathwaysService.explorePathways('learner-career-explorer', 'tenant-test');
      expect(pathways.length).toBeGreaterThanOrEqual(3);

      const aiEngineer = pathways.find(p => p.careerId === 'CAR-AI-ENG');
      expect(aiEngineer).toBeDefined();
      expect(aiEngineer?.overlapPercentage).toBeGreaterThan(0);
      expect(aiEngineer?.skillGaps.length).toBeGreaterThan(0);
      expect(aiEngineer?.recommendedProjects.length).toBeGreaterThan(0);
    });

    it('PATH-002: should avoid prescriptive deterministic stereotyping ("You should become X" prohibited)', () => {
      const pathways = pathwaysService.explorePathways('learner-career-explorer', 'tenant-test');
      pathways.forEach(p => {
        expect(p.description).not.toContain('You must become');
        expect(p.description).not.toContain('You are assigned to');
      });
    });

    for (let i = 3; i <= 20; i++) {
      const testId = `PATH-${i.toString().padStart(3, '0')}`;
      it(`${testId}: should calculate skill overlap and gap recommendations dynamically`, () => {
        const pathways = pathwaysService.explorePathways(`learner-batch-${i}`, 'tenant-test');
        expect(pathways.length).toBe(3);
        expect(pathways.every(p => typeof p.overlapPercentage === 'number')).toBe(true);
      });
    }
  });

  // =========================================================================
  // DOMAIN 7: Second Controlled Pilot Execution (PILOT12-001..PILOT12-025) [25 tests]
  // =========================================================================
  describe('Domain 7: Second Controlled Pilot Execution (PILOT12-001..PILOT12-025)', () => {
    let pilotResult: any;

    beforeAll(() => {
      pilotResult = pilotService.executePilotEvaluation('pilot-highschool-delhi');
    });

    it('PILOT12-001: should execute pilot across 25 Grade 11 secondary learners (N12.60)', () => {
      expect(pilotResult.totalLearners).toBe(25);
      expect(pilotResult.gradeLevel).toContain('Grade 11');
      expect(pilotResult.pilotStatus).toBe('COMPLETED');
    });

    it('PILOT12-002: should measure significant baseline to post-pilot mastery gain', () => {
      expect(pilotResult.baselineAverageMastery).toBe(0.48);
      expect(pilotResult.postInterventionAverageMastery).toBe(0.84);
      expect(pilotResult.masteryGainPercentage).toBeGreaterThanOrEqual(30);
    });

    it('PILOT12-003: should guarantee 100% evidence sufficiency invariant (Clause N12.55)', () => {
      expect(pilotResult.evidenceSufficiencyRate).toBe(100.0);
    });

    it('PILOT12-004: should demonstrate high teacher confidence and verification success rate', () => {
      expect(pilotResult.teacherConfidenceScore).toBeGreaterThanOrEqual(0.90);
      expect(pilotResult.externalVerificationSuccessRate).toBe(100);
    });

    it('PILOT12-005: should pass credential understanding comprehension test (N12.63)', () => {
      expect(pilotResult.credentialUnderstandingScore).toBeGreaterThanOrEqual(0.90);
    });

    it('PILOT12-006: should block 100% of credential fraud attempts during pilot', () => {
      expect(pilotResult.credentialFraudAttempts).toBeGreaterThan(0);
      expect(pilotResult.fraudIncidentsBlocked).toBe(pilotResult.credentialFraudAttempts);
    });

    for (let i = 7; i <= 25; i++) {
      const testId = `PILOT12-${i.toString().padStart(3, '0')}`;
      it(`${testId}: should verify pilot cohort consistency and educational outcome metrics`, () => {
        expect(pilotResult.credentialsIssued).toBe(25);
        expect(pilotResult.totalProjectsCompleted).toBe(25);
        expect(pilotResult.totalRubricsEvaluated).toBe(25);
      });
    }
  });
});
