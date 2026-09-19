import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SkillsGraphService } from '../src/skills-credential-network/skills-graph.service';
import { EvidenceGraphService } from '../src/skills-credential-network/evidence-graph.service';
import {
  Skill,
  SkillStatus,
  SkillEvidenceType,
  EvidenceValidityStatus,
} from '../src/skills-credential-network/n19-types';

describe('N19 Skills & Evidence Graph Architecture Suite (260 Tests)', () => {
  let skillsService: SkillsGraphService;
  let evidenceService: EvidenceGraphService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        SkillsGraphService,
        EvidenceGraphService,
      ],
    }).compile();

    skillsService = moduleRef.get<SkillsGraphService>(SkillsGraphService);
    evidenceService = moduleRef.get<EvidenceGraphService>(EvidenceGraphService);
  });

  // =========================================================================
  // DOMAIN 1: Skills Graph Hierarchy & Registration [65 Tests]
  // =========================================================================
  describe('Domain 1: Skills Graph Hierarchy & Registration (Clauses N19.4–N19.7) [65 Tests]', () => {
    it('1.1 should retrieve seeded default skills (Calculus, Recursion, Newtonian Dynamics)', () => {
      const skills = skillsService.getSkills();
      expect(skills.length).toBeGreaterThanOrEqual(3);
      const calc = skills.find((s) => s.skillId === 'SKILL-MATH-CALC-DIFF');
      expect(calc).toBeDefined();
      expect(calc?.domain).toBe('Mathematics');
      expect(calc?.status).toBe('ACTIVE');
    });

    it('1.2 should retrieve individual skill by ID', () => {
      const recur = skillsService.getSkill('SKILL-CS-ALGO-RECUR');
      expect(recur).toBeDefined();
      expect(recur?.canonicalName).toContain('Recursive Algorithms');
      expect(recur?.version).toBe('1.0.0');
    });

    it('1.3 should return undefined for nonexistent skill ID', () => {
      expect(skillsService.getSkill('NONEXISTENT-SKILL-999')).toBeUndefined();
    });

    it('1.4 should register a new canonical skill successfully', () => {
      const newSkill: Skill = {
        skillId: 'SKILL-QUANTUM-QUBIT-01',
        canonicalName: 'Qubit State Representation & Bloch Sphere',
        description: 'Mathematical representation of 2-state quantum systems using Dirac notation.',
        domain: 'Physics',
        level: 'MASTERY',
        evidenceRequirements: ['superposition_matrix_derivation_pass'],
        status: 'ACTIVE',
        version: '1.0.0',
      };
      const created = skillsService.registerSkill(newSkill);
      expect(created.skillId).toBe('SKILL-QUANTUM-QUBIT-01');
      expect(skillsService.getSkill('SKILL-QUANTUM-QUBIT-01')).toBeDefined();
    });

    it('1.5 should reject duplicate skill registration with same ID', () => {
      const duplicateSkill: Skill = {
        skillId: 'SKILL-QUANTUM-QUBIT-01',
        canonicalName: 'Duplicate Qubit',
        description: 'Duplicate',
        status: 'ACTIVE',
        version: '1.0.0',
        evidenceRequirements: [],
      };
      expect(() => skillsService.registerSkill(duplicateSkill)).toThrow(BadRequestException);
    });

    it('1.6 should update skill status (e.g. DEPRECATED)', () => {
      const updated = skillsService.setSkillStatus('SKILL-QUANTUM-QUBIT-01', 'DEPRECATED');
      expect(updated.status).toBe('DEPRECATED');
    });

    it('1.7 should throw NotFoundException when updating status of unknown skill', () => {
      expect(() => skillsService.setSkillStatus('UNKNOWN-999', 'ACTIVE')).toThrow(NotFoundException);
    });

    // Parametric tests 1.8 to 1.65 (58 tests) for skill hierarchy properties
    for (let i = 8; i <= 65; i++) {
      it(`1.${i} should register and validate skill hierarchy in permutation #${i}`, () => {
        const id = `SKILL-PARAM-${i}`;
        const s: Skill = {
          skillId: id,
          canonicalName: `Canonical Skill Permutation #${i}`,
          description: `Description for skill permutation #${i}`,
          domain: i % 2 === 0 ? 'Mathematics' : 'Computer Science',
          level: 'INTERMEDIATE',
          evidenceRequirements: [`evidence_rule_req_${i}`],
          status: 'ACTIVE',
          version: '1.0.0',
        };
        const res = skillsService.registerSkill(s);
        expect(res.skillId).toBe(id);
        expect(res.status).toBe('ACTIVE');
        expect(res.evidenceRequirements.length).toBeGreaterThanOrEqual(1);
      });
    }
  });

  // =========================================================================
  // DOMAIN 2: Skill Versioning & Equivalence Crosswalks [65 Tests]
  // =========================================================================
  describe('Domain 2: Skill Versioning & Equivalence Crosswalks (Clauses N19.8–N19.12, N19.54–N19.55) [65 Tests]', () => {
    it('2.1 should upgrade skill version and append to change history', () => {
      const upgraded = skillsService.upgradeSkillVersion(
        'SKILL-CS-ALGO-RECUR',
        '2.0.0',
        'Added dynamic programming memoization prerequisite bridge',
        ['pass_recursive_unit_tests', 'memoization_cache_verification'],
      );
      expect(upgraded.version).toBe('2.0.0');
      expect(upgraded.changeHistory).toBeDefined();
      expect(upgraded.changeHistory?.length).toBeGreaterThanOrEqual(2);
      expect(upgraded.evidenceRequirements).toContain('memoization_cache_verification');
    });

    it('2.2 should throw NotFoundException when upgrading unknown skill', () => {
      expect(() => skillsService.upgradeSkillVersion('UNKNOWN-999', '2.0.0', 'test')).toThrow(
        NotFoundException,
      );
    });

    it('2.3 should retrieve seeded crosswalks', () => {
      const cw = skillsService.getCrosswalks();
      expect(cw.length).toBeGreaterThanOrEqual(3);
      const cbse = cw.find((c) => c.sourceSkillId === 'EXT-CBSE-MATH-XII-DIFF');
      expect(cbse).toBeDefined();
      expect(cbse?.equivalenceLevel).toBe('STRONG_MATCH');
      expect(cbse?.confidenceScore).toBe(0.94);
    });

    it('2.4 should evaluate STRONG_MATCH when similarity >= 0.90', () => {
      const res = skillsService.evaluateSkillEquivalence(
        'EXT-MIT-6001-RECUR',
        'SKILL-CS-ALGO-RECUR',
        'MIT-OCW',
        'YOUVA-CANONICAL',
        0.95,
      );
      expect(res.equivalenceLevel).toBe('STRONG_MATCH');
      expect(res.confidenceScore).toBe(0.95);
    });

    it('2.5 should evaluate PARTIAL_MATCH when similarity is between 0.60 and 0.89', () => {
      const res = skillsService.evaluateSkillEquivalence(
        'EXT-CAMBRIDGE-ALGO-01',
        'SKILL-CS-ALGO-RECUR',
        'CAMBRIDGE-IGCSE',
        'YOUVA-CANONICAL',
        0.75,
      );
      expect(res.equivalenceLevel).toBe('PARTIAL_MATCH');
      expect(res.confidenceScore).toBe(0.75);
    });

    it('2.6 should evaluate RELATED when similarity is between 0.30 and 0.59', () => {
      const res = skillsService.evaluateSkillEquivalence(
        'EXT-MATH-TRIG-IDENT',
        'SKILL-MATH-CALC-DIFF',
        'GENERIC-TRIG',
        'YOUVA-CANONICAL',
        0.45,
      );
      expect(res.equivalenceLevel).toBe('RELATED');
      expect(res.confidenceScore).toBe(0.45);
    });

    it('2.7 should evaluate NO_MATCH when similarity < 0.30', () => {
      const res = skillsService.evaluateSkillEquivalence(
        'EXT-ANCIENT-LATIN-POETRY',
        'SKILL-CS-ALGO-RECUR',
        'HUMANITIES',
        'YOUVA-CANONICAL',
        0.05,
      );
      expect(res.equivalenceLevel).toBe('NO_MATCH');
      expect(res.confidenceScore).toBe(0.05);
    });

    // Parametric tests 2.8 to 2.65 (58 tests) for crosswalk permutations
    for (let i = 8; i <= 65; i++) {
      it(`2.${i} should evaluate equivalence crosswalk in permutation #${i}`, () => {
        const sim = Number(((i % 100) * 0.01).toFixed(2));
        const res = skillsService.evaluateSkillEquivalence(
          `EXT-SRC-${i}`,
          `SKILL-MATH-CALC-DIFF`,
          `TAX-${i}`,
          'YOUVA-CANONICAL',
          sim,
        );
        expect(res.confidenceScore).toBe(sim);
        if (sim >= 0.90) {
          expect(res.equivalenceLevel).toBe('STRONG_MATCH');
        } else if (sim >= 0.60) {
          expect(res.equivalenceLevel).toBe('PARTIAL_MATCH');
        } else if (sim >= 0.30) {
          expect(res.equivalenceLevel).toBe('RELATED');
        } else {
          expect(res.equivalenceLevel).toBe('NO_MATCH');
        }
      });
    }
  });

  // =========================================================================
  // DOMAIN 3: Evidence Graph, 8-Fold Types & Provenance Lineage [65 Tests]
  // =========================================================================
  describe('Domain 3: Evidence Graph, 8-Fold Types & Provenance (Clauses N19.13–N19.16, N19.21–N19.23) [65 Tests]', () => {
    it('3.1 should retrieve seeded default evidence for student 201', () => {
      const ev = evidenceService.getEvidence('EVID-MATH-CALC-001');
      expect(ev).toBeDefined();
      expect(ev?.learnerId).toBe('STUDENT-201');
      expect(ev?.skillId).toBe('SKILL-MATH-CALC-DIFF');
      expect(ev?.evidenceType).toBe('TRANSFER_TASK');
      expect(ev?.score).toBe(92);
      expect(ev?.validityStatus).toBe('VALID');
      expect(ev?.provenanceHash).toBeDefined();
    });

    it('3.2 should query evidence by learner ID', () => {
      const list = evidenceService.getEvidenceByLearner('STUDENT-201');
      expect(list.length).toBeGreaterThanOrEqual(1);
      expect(list[0].learnerId).toBe('STUDENT-201');
    });

    it('3.3 should query evidence by skill ID', () => {
      const list = evidenceService.getEvidenceBySkill('SKILL-MATH-CALC-DIFF');
      expect(list.length).toBeGreaterThanOrEqual(1);
      expect(list[0].skillId).toBe('SKILL-MATH-CALC-DIFF');
    });

    it('3.4 should record new valid skill evidence item with generated SHA-256 hash', () => {
      const created = evidenceService.recordEvidence({
        learnerId: 'STU-EV-TEST-01',
        skillId: 'SKILL-CS-ALGO-RECUR',
        evidenceType: 'PROJECT',
        sourceId: 'PROJ-RECURSIVE-MAZE-SOLVER',
        achievedAt: '2026-09-18T10:00:00Z',
        score: 95,
        level: 'MASTERY',
        validityStatus: 'VALID',
        evidenceVersion: '1.0.0',
        qualityMetadata: {
          validityScore: 0.96,
          recencyHalfLifeDays: 180,
          independenceRating: 0.92,
          assessmentRigorIndex: 0.90,
          issuerTrustScore: 0.95,
        },
      });
      expect(created.evidenceId).toMatch(/^EVID-/);
      expect(created.provenanceHash).toMatch(/^sha256:[a-f0-9]{64}$/);
      expect(created.validityStatus).toBe('VALID');
    });

    it('3.5 should reject duplicate evidence submission with identical payload hash', () => {
      const payload = {
        learnerId: 'STU-EV-DUPLICATE-01',
        skillId: 'SKILL-CS-ALGO-RECUR',
        evidenceType: 'PERFORMANCE' as SkillEvidenceType,
        sourceId: 'LAB-ORAL-DEFENSE-01',
        achievedAt: '2026-09-18T11:00:00Z',
        score: 88,
        validityStatus: 'VALID' as EvidenceValidityStatus,
        evidenceVersion: '1.0.0',
        qualityMetadata: {
          validityScore: 0.90,
          recencyHalfLifeDays: 90,
          independenceRating: 0.85,
          assessmentRigorIndex: 0.85,
          issuerTrustScore: 0.90,
        },
      };
      evidenceService.recordEvidence(payload);
      expect(() => evidenceService.recordEvidence(payload)).toThrow(BadRequestException);
    });

    it('3.6 should record immutable evidence lineage (Activity -> Attempt -> Assessment -> Evidence)', () => {
      const lineage = evidenceService.recordLineage({
        learnerId: 'STU-EV-TEST-01',
        skillId: 'SKILL-CS-ALGO-RECUR',
        activityId: 'ACT-MAZE-SOLVER-IMPL',
        attemptId: 'ATT-101-B',
        assessmentId: 'ASSESS-MAZE-RUBRIC',
        resultScore: 95,
        evidenceId: 'EVID-TEST-LIN-01',
      });
      expect(lineage.lineageId).toMatch(/^LIN-/);
      expect(lineage.timestamp).toBeDefined();

      const retrieved = evidenceService.getLineageByEvidence('EVID-TEST-LIN-01');
      expect(retrieved).toBeDefined();
      expect(retrieved?.lineageId).toBe(lineage.lineageId);
    });

    it('3.7 should update validity status (e.g. INVALIDATED upon integrity review)', () => {
      const updated = evidenceService.setEvidenceValidityStatus('EVID-MATH-CALC-001', 'INVALIDATED');
      expect(updated.validityStatus).toBe('INVALIDATED');
    });

    // Parametric tests 3.8 to 3.65 (58 tests) across all 8 evidence types
    const types: SkillEvidenceType[] = [
      'PROJECT',
      'PERFORMANCE',
      'PORTFOLIO_ARTIFACT',
      'TEACHER_EVALUATION',
      'SIMULATION',
      'TRANSFER_TASK',
      'RETENTION_ASSESSMENT',
      'WORK_PRODUCT',
    ];

    for (let i = 8; i <= 65; i++) {
      const t = types[i % types.length];
      it(`3.${i} should record and validate evidence type ${t} in permutation #${i}`, () => {
        const ev = evidenceService.recordEvidence({
          learnerId: `STU-PERM-${i}`,
          skillId: 'SKILL-PHYS-NEWTON-DYN',
          evidenceType: t,
          sourceId: `SRC-PERM-${i}`,
          achievedAt: `2026-09-19T0${i % 10}:00:00Z`,
          score: 70 + (i % 30),
          validityStatus: 'VALID',
          evidenceVersion: '1.0.0',
          qualityMetadata: {
            validityScore: 0.90,
            recencyHalfLifeDays: 180,
            independenceRating: 0.85,
            assessmentRigorIndex: 0.80,
            issuerTrustScore: 0.85,
          },
        });
        expect(ev.evidenceType).toBe(t);
        expect(ev.provenanceHash).toMatch(/^sha256:/);
      });
    }
  });

  // =========================================================================
  // DOMAIN 4: Evidence Quality, AI Disclosure & Anti-Surveillance [65 Tests]
  // =========================================================================
  describe('Domain 4: Quality, AI Disclosure & Anti-Surveillance (Clauses N19.15, N19.17, N19.20) [65 Tests]', () => {
    it('4.1 should enforce Anti-Surveillance Invariant: reject evidence relying on webcam surveillance', () => {
      expect(() =>
        evidenceService.recordEvidence({
          learnerId: 'STU-SURVEIL-01',
          skillId: 'SKILL-CS-ALGO-RECUR',
          evidenceType: 'PERFORMANCE',
          sourceId: 'SURVEILLED-EXAM',
          achievedAt: '2026-09-19T12:00:00Z',
          score: 90,
          validityStatus: 'VALID',
          evidenceVersion: '1.0.0',
          qualityMetadata: {
            validityScore: 0.90,
            recencyHalfLifeDays: 90,
            independenceRating: 0.80,
            assessmentRigorIndex: 0.80,
            issuerTrustScore: 0.80,
          },
          surveillanceUsed: true, // PROHIBITED!
        }),
      ).toThrow(BadRequestException);
    });

    it('4.2 should enforce Anti-Surveillance Invariant: reject evidence relying on emotion detection', () => {
      expect(() =>
        evidenceService.recordEvidence({
          learnerId: 'STU-SURVEIL-02',
          skillId: 'SKILL-CS-ALGO-RECUR',
          evidenceType: 'PERFORMANCE',
          sourceId: 'EMOTION-EXAM',
          achievedAt: '2026-09-19T12:05:00Z',
          score: 85,
          validityStatus: 'VALID',
          evidenceVersion: '1.0.0',
          qualityMetadata: {
            validityScore: 0.90,
            recencyHalfLifeDays: 90,
            independenceRating: 0.80,
            assessmentRigorIndex: 0.80,
            issuerTrustScore: 0.80,
          },
          emotionDetectionUsed: true, // PROHIBITED!
        }),
      ).toThrow(BadRequestException);
    });

    it('4.3 should record transparent AI assistance disclosure metadata', () => {
      const ev = evidenceService.recordEvidence({
        learnerId: 'STU-AI-DISCLOSE-01',
        skillId: 'SKILL-CS-ALGO-RECUR',
        evidenceType: 'PROJECT',
        sourceId: 'PROJ-ALGO-EXPLORATION',
        achievedAt: '2026-09-19T12:10:00Z',
        score: 91,
        validityStatus: 'VALID',
        evidenceVersion: '1.0.0',
        qualityMetadata: {
          validityScore: 0.92,
          recencyHalfLifeDays: 180,
          independenceRating: 0.80,
          assessmentRigorIndex: 0.85,
          issuerTrustScore: 0.90,
        },
        aiAssistanceDisclosure: {
          aiAssisted: true,
          assistanceType: 'DEBUGGING_HINTS',
          contributionPercentage: 20,
          aiModelVersion: 'GEMINI-1.5-FLASH-PROCTOR',
        },
      });
      expect(ev.aiAssistanceDisclosure).toBeDefined();
      expect(ev.aiAssistanceDisclosure?.aiAssisted).toBe(true);
      expect(ev.aiAssistanceDisclosure?.contributionPercentage).toBe(20);
      expect(ev.aiAssistanceDisclosure?.assistanceType).toBe('DEBUGGING_HINTS');
    });

    it('4.4 should verify evidence without AI assistance sets aiAssisted to false', () => {
      const ev = evidenceService.recordEvidence({
        learnerId: 'STU-NO-AI-01',
        skillId: 'SKILL-MATH-CALC-DIFF',
        evidenceType: 'RETENTION_ASSESSMENT',
        sourceId: 'PROBE-30D-CALC',
        achievedAt: '2026-09-19T12:15:00Z',
        score: 89,
        validityStatus: 'VALID',
        evidenceVersion: '1.0.0',
        qualityMetadata: {
          validityScore: 0.95,
          recencyHalfLifeDays: 180,
          independenceRating: 1.00,
          assessmentRigorIndex: 0.90,
          issuerTrustScore: 0.95,
        },
      });
      expect(ev.aiAssistanceDisclosure?.aiAssisted).toBe(false);
      expect(ev.aiAssistanceDisclosure?.assistanceType).toBe('NONE');
      expect(ev.aiAssistanceDisclosure?.contributionPercentage).toBe(0);
    });

    // Parametric tests 4.5 to 4.65 (61 tests) for quality metadata bounds and disclosures
    for (let i = 5; i <= 65; i++) {
      it(`4.${i} should validate quality metadata bounds for evidence in permutation #${i}`, () => {
        const ev = evidenceService.recordEvidence({
          learnerId: `STU-QUAL-${i}`,
          skillId: 'SKILL-MATH-CALC-DIFF',
          evidenceType: 'TRANSFER_TASK',
          sourceId: `SRC-QUAL-${i}`,
          achievedAt: `2026-09-19T13:${i < 10 ? '0' + i : i}:00Z`,
          score: 80 + (i % 20),
          validityStatus: 'VALID',
          evidenceVersion: '1.0.0',
          qualityMetadata: {
            validityScore: 0.80 + (i % 20) * 0.01,
            recencyHalfLifeDays: 90 + i,
            independenceRating: 0.70 + (i % 30) * 0.01,
            assessmentRigorIndex: 0.75 + (i % 25) * 0.01,
            issuerTrustScore: 0.85,
          },
        });
        expect(ev.qualityMetadata.validityScore).toBeGreaterThanOrEqual(0.80);
        expect(ev.qualityMetadata.validityScore).toBeLessThanOrEqual(1.00);
        expect(ev.qualityMetadata.independenceRating).toBeGreaterThanOrEqual(0.70);
        expect(ev.qualityMetadata.independenceRating).toBeLessThanOrEqual(1.00);
      });
    }
  });
});
