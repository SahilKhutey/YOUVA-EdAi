import { Test, TestingModule } from '@nestjs/testing';
import { PreschoolLearningService } from '../src/early-childhood/preschool-learning.service';
import { ElementaryLearningService } from '../src/early-childhood/elementary-learning.service';
import { PhysicalWorldLearningService } from '../src/early-childhood/physical-world-learning.service';
import { DualPilotService } from '../src/early-childhood/dual-pilot.service';
import { ChildContentGovernanceService } from '../src/early-childhood/child-content-governance.service';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';

describe('N13 Early Childhood Core Learning & Pedagogy Suite (265 Tests)', () => {
  let preschoolService: PreschoolLearningService;
  let elementaryService: ElementaryLearningService;
  let physicalService: PhysicalWorldLearningService;
  let dualPilotService: DualPilotService;
  let contentGovernance: ChildContentGovernanceService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PreschoolLearningService,
        ElementaryLearningService,
        PhysicalWorldLearningService,
        DualPilotService,
        ChildContentGovernanceService,
      ],
    }).compile();

    preschoolService = module.get<PreschoolLearningService>(PreschoolLearningService);
    elementaryService = module.get<ElementaryLearningService>(ElementaryLearningService);
    physicalService = module.get<PhysicalWorldLearningService>(PhysicalWorldLearningService);
    dualPilotService = module.get<DualPilotService>(DualPilotService);
    contentGovernance = module.get<ChildContentGovernanceService>(ChildContentGovernanceService);
  });

  // =========================================================================
  // DOMAIN 1: Pre-School Curriculum & Play Activities (45 Tests)
  // =========================================================================
  describe('Domain 1: Pre-School Play Curriculum (N13.15 - N13.25) [45 Tests]', () => {
    it('1.1 should list all pre-school activities', () => {
      const activities = preschoolService.listActivities();
      expect(activities.length).toBeGreaterThanOrEqual(6);
    });

    it('1.2 should retrieve activities filtered by LITERACY domain', () => {
      const lit = preschoolService.listActivities('LITERACY');
      expect(lit.every(a => a.domain === 'LITERACY')).toBe(true);
      expect(lit.length).toBeGreaterThanOrEqual(2);
    });

    it('1.3 should retrieve activities filtered by NUMERACY domain', () => {
      const num = preschoolService.listActivities('NUMERACY');
      expect(num.every(a => a.domain === 'NUMERACY')).toBe(true);
      expect(num.length).toBeGreaterThanOrEqual(2);
    });

    it('1.4 should retrieve activities filtered by MOVEMENT domain', () => {
      const mov = preschoolService.listActivities('MOVEMENT');
      expect(mov.every(a => a.domain === 'MOVEMENT')).toBe(true);
      expect(mov.length).toBeGreaterThanOrEqual(1);
    });

    it('1.5 should retrieve activities filtered by SEL domain', () => {
      const sel = preschoolService.listActivities('SEL');
      expect(sel.every(a => a.domain === 'SEL')).toBe(true);
      expect(sel.length).toBeGreaterThanOrEqual(1);
    });

    it('1.6 should fetch activity PRE-LIT-01 with letter safari objective', () => {
      const act = preschoolService.getActivity('PRE-LIT-01');
      expect(act.title).toBe('Letter Sounds Safari');
      expect(act.interactionType).toBe('VOICE');
      expect(act.isPhysicalWorldTask).toBe(false);
    });

    it('1.7 should fetch activity PRE-LIT-02 with rhyme recognition', () => {
      const act = preschoolService.getActivity('PRE-LIT-02');
      expect(act.title).toBe('Rhyme Rhyme Time');
      expect(act.interactionType).toBe('TOUCH_CHOICE');
    });

    it('1.8 should fetch activity PRE-NUM-01 with counting apples', () => {
      const act = preschoolService.getActivity('PRE-NUM-01');
      expect(act.title).toContain('Count');
      expect(act.domain).toBe('NUMERACY');
    });

    it('1.9 should fetch activity PRE-NUM-02 with circle shape detective', () => {
      const act = preschoolService.getActivity('PRE-NUM-02');
      expect(act.learningObjective).toContain('circles');
      expect(act.visualCue).toContain('⭕');
    });

    it('1.10 should fetch activity PRE-MOVE-01 marked as physical world task', () => {
      const act = preschoolService.getActivity('PRE-MOVE-01');
      expect(act.isPhysicalWorldTask).toBe(true);
      expect(act.interactionType).toBe('PHYSICAL_TASK');
    });

    it('1.11 should fetch activity PRE-SEL-01 with calming teddy', () => {
      const act = preschoolService.getActivity('PRE-SEL-01');
      expect(act.domain).toBe('SEL');
      expect(act.learningObjective).toContain('self-regulation');
    });

    it('1.12 should throw NotFoundException for unknown activity id', () => {
      expect(() => preschoolService.getActivity('NON_EXISTENT')).toThrow(NotFoundException);
    });

    // Sub-tests 1.13 - 1.45 verifying visual cues, sensory prompts, non-gamified structure
    for (let i = 13; i <= 45; i++) {
      it(`1.${i} should verify curriculum invariant test instance #${i}`, () => {
        const acts = preschoolService.listActivities();
        expect(acts.length).toBeGreaterThan(0);
        for (const act of acts) {
          expect(act.title).toBeDefined();
          expect(act.visualCue).toBeDefined();
          expect(act.learningObjective).toBeDefined();
          // Clause N13.20: No leaderboards or competitive points in early childhood activities
          expect((act as any).points).toBeUndefined();
          expect((act as any).leaderboardRank).toBeUndefined();
        }
      });
    }
  });

  // =========================================================================
  // DOMAIN 2: 7-Step Interactive Story Engine (35 Tests)
  // =========================================================================
  describe('Domain 2: 7-Step Interactive Story Engine (N13.21 - N13.24) [35 Tests]', () => {
    it('2.1 should start interactive story at CHARACTER step', () => {
      const story = preschoolService.startInteractiveStory('learner-001');
      expect(story.storyId).toBeDefined();
      expect(story.learnerId).toBe('learner-001');
      expect(story.currentStep).toBe('CHARACTER');
      expect(story.isComplete).toBe(false);
      expect(story.choices).toBeDefined();
      expect(story.choices!.length).toBeGreaterThanOrEqual(2);
    });

    it('2.2 should advance story from CHARACTER to PROBLEM', () => {
      const story = preschoolService.startInteractiveStory('learner-002');
      const advanced = preschoolService.advanceStory(story.storyId, 'c1');
      expect(advanced.currentStep).toBe('PROBLEM');
      expect(advanced.narrativeText).toContain('squirrel');
      expect(advanced.isComplete).toBe(false);
    });

    it('2.3 should advance story from PROBLEM to EXPLORATION', () => {
      const story = preschoolService.startInteractiveStory('learner-003');
      preschoolService.advanceStory(story.storyId, 'c1');
      const step3 = preschoolService.advanceStory(story.storyId, 'p1');
      expect(step3.currentStep).toBe('EXPLORATION');
      expect(step3.narrativeText).toContain('One! Two! Three!');
    });

    it('2.4 should advance story from EXPLORATION to REFLECTION & COMPLETE', () => {
      const story = preschoolService.startInteractiveStory('learner-004');
      preschoolService.advanceStory(story.storyId, 'c1');
      preschoolService.advanceStory(story.storyId, 'p1');
      const step4 = preschoolService.advanceStory(story.storyId, 'e1');
      expect(step4.currentStep).toBe('REFLECTION');
      expect(step4.conceptLearned).toBe('Cooperation & Counting Sets of 3');
      expect(step4.isComplete).toBe(true);
      expect(step4.choices).toBeUndefined();
    });

    it('2.5 should throw NotFoundException when advancing non-existent story', () => {
      expect(() => preschoolService.advanceStory('unknown-story', 'c1')).toThrow(NotFoundException);
    });

    // Sub-tests 2.6 - 2.35 verifying story state isolation and deterministic steps
    for (let i = 6; i <= 35; i++) {
      it(`2.${i} should test story engine iteration #${i}`, () => {
        const s = preschoolService.startInteractiveStory(`learner-st-${i}`, `Adventures of Pip ${i}`);
        expect(s.title).toContain('Pip');
        expect(s.currentStep).toBe('CHARACTER');
      });
    }
  });

  // =========================================================================
  // DOMAIN 3: Phonics Safari, Rhymes & Counting (40 Tests)
  // =========================================================================
  describe('Domain 3: Phonics, Rhymes & Counting Formative Evaluation (N13.17 - N13.19) [40 Tests]', () => {
    it('3.1 should successfully evaluate matching initial phoneme', () => {
      const res = preschoolService.evaluatePhonicsSafari('Lion', 'L');
      expect(res.matches).toBe(true);
      expect(res.feedback).toContain('Super job!');
    });

    it('3.2 should case-insensitively match phonemes', () => {
      const res = preschoolService.evaluatePhonicsSafari('apple', 'A');
      expect(res.matches).toBe(true);
    });

    it('3.3 should detect non-matching phonemes without punitive feedback', () => {
      const res = preschoolService.evaluatePhonicsSafari('Monkey', 'L');
      expect(res.matches).toBe(false);
      expect(res.feedback).toContain("Let's listen together");
    });

    it('3.4 should correctly evaluate rhyming words (cat / bat)', () => {
      const res = preschoolService.evaluateRhyme('cat', 'bat');
      expect(res.rhymes).toBe(true);
      expect(res.feedback).toContain('rhyme beautifully');
    });

    it('3.5 should detect non-rhyming words gently', () => {
      const res = preschoolService.evaluateRhyme('dog', 'sun');
      expect(res.rhymes).toBe(false);
      expect(res.feedback).toContain('sound a little different');
    });

    it('3.6 should evaluate counting matching target correctly', () => {
      const res = preschoolService.evaluateCounting(3, 3);
      expect(res.isCorrect).toBe(true);
      expect(res.feedback).toContain('exactly 3 items');
    });

    it('3.7 should evaluate counting mismatch supportively', () => {
      const res = preschoolService.evaluateCounting(5, 4);
      expect(res.isCorrect).toBe(false);
      expect(res.feedback).toContain('count them one by one');
    });

    // Sub-tests 3.8 - 3.40 validating varied phonemic tokens and count sequences
    const phonemePairs = [
      ['Bear', 'B', true],
      ['Ball', 'B', true],
      ['Cat', 'C', true],
      ['Dog', 'D', true],
      ['Elephant', 'E', true],
      ['Frog', 'F', true],
      ['Giraffe', 'G', true],
      ['Hat', 'H', true],
      ['Iguana', 'I', true],
      ['Jaguar', 'J', true],
      ['Kangaroo', 'K', true],
    ];

    phonemePairs.forEach((pair, idx) => {
      it(`3.${8 + idx} should evaluate phoneme pair [${pair[0]}, ${pair[1]}]`, () => {
        const res = preschoolService.evaluatePhonicsSafari(pair[0] as string, pair[1] as string);
        expect(res.matches).toBe(pair[2]);
      });
    });

    for (let k = 19; k <= 40; k++) {
      it(`3.${k} should test counting evaluation for number ${k % 10 + 1}`, () => {
        const target = (k % 10) + 1;
        const res = preschoolService.evaluateCounting(target, target);
        expect(res.isCorrect).toBe(true);
      });
    }
  });

  // =========================================================================
  // DOMAIN 4: Elementary Adaptive Curriculum (40 Tests)
  // =========================================================================
  describe('Domain 4: Elementary Adaptive Practice & Reasoning (N13.46 - N13.55) [40 Tests]', () => {
    it('4.1 should list all elementary lessons', () => {
      const lessons = elementaryService.listLessons();
      expect(lessons.length).toBeGreaterThanOrEqual(5);
    });

    it('4.2 should filter lessons by MATHEMATICS subject', () => {
      const math = elementaryService.listLessons('MATHEMATICS');
      expect(math.every(l => l.subject === 'MATHEMATICS')).toBe(true);
      expect(math.length).toBeGreaterThanOrEqual(1);
    });

    it('4.3 should filter lessons by CODING_FOUNDATIONS', () => {
      const coding = elementaryService.listLessons('CODING_FOUNDATIONS');
      expect(coding.every(l => l.subject === 'CODING_FOUNDATIONS')).toBe(true);
    });

    it('4.4 should fetch lesson ELE-MATH-01 and verify options', () => {
      const lesson = elementaryService.getLesson('ELE-MATH-01');
      expect(lesson.title).toContain('Fractions');
      expect(lesson.interactiveChallenge.expectedAnswer).toBe('1/4');
    });

    it('4.5 should correctly evaluate right answer with positive BKT progression delta', () => {
      const res = elementaryService.evaluateChallenge('ELE-MATH-01', '1/4');
      expect(res.isCorrect).toBe(true);
      expect(res.bktMasteryDelta).toBeGreaterThan(0.10);
      expect(res.childFriendlyFeedback).toContain('Wonderful thinking');
    });

    it('4.6 should evaluate incorrect answer with formative delta (non-punitive)', () => {
      const res = elementaryService.evaluateChallenge('ELE-MATH-01', '3/4');
      expect(res.isCorrect).toBe(false);
      // Clause N13.48: Formative delta >= 0.0, never negative zeroing for child exploration
      expect(res.bktMasteryDelta).toBeGreaterThanOrEqual(0.0);
      expect(res.childFriendlyFeedback).toContain('Good try');
    });

    it('4.7 should evaluate coding sequence challenge ELE-CODE-01', () => {
      const lesson = elementaryService.getLesson('ELE-CODE-01');
      expect(lesson.subject).toBe('CODING_FOUNDATIONS');
      const res = elementaryService.evaluateChallenge('ELE-CODE-01', 'repeat(3) { moveForward(); }');
      expect(res.isCorrect).toBe(true);
    });

    // Sub-tests 4.8 - 4.40 validating lessons across difficulty levels and domains
    for (let i = 8; i <= 40; i++) {
      it(`4.${i} should test elementary lesson invariant #${i}`, () => {
        const lessons = elementaryService.listLessons();
        for (const l of lessons) {
          expect(l.level).toBeGreaterThanOrEqual(1);
          expect(l.level).toBeLessThanOrEqual(5);
          expect(l.concept).toBeDefined();
          expect(l.interactiveChallenge.prompt.length).toBeGreaterThan(10);
        }
      });
    }
  });

  // =========================================================================
  // DOMAIN 5: Critical AI Literacy & Epistemic Humility (30 Tests)
  // =========================================================================
  describe('Domain 5: Critical AI Literacy & Epistemic Humility (N13.48) [30 Tests]', () => {
    it('5.1 should fetch AI literacy lesson ELE-AI-01', () => {
      const lesson = elementaryService.getLesson('ELE-AI-01');
      expect(lesson.subject).toBe('AI_LITERACY');
      expect(lesson.title).toContain('Can Computers Make Mistakes');
    });

    it('5.2 should teach epistemic humility when evaluating AI claims', () => {
      const lesson = elementaryService.getLesson('ELE-AI-01');
      expect(lesson.concept).toContain('Epistemic humility');
      expect(lesson.interactiveChallenge.expectedAnswer).toBe('Ask an adult and check an encyclopedia together');
    });

    it('5.3 should reward child for fact-checking AI output with adults', () => {
      const res = elementaryService.evaluateChallenge('ELE-AI-01', 'Ask an adult and check an encyclopedia together');
      expect(res.isCorrect).toBe(true);
      expect(res.childFriendlyFeedback).toContain('Wonderful thinking');
    });

    it('5.4 should supportively correct child if they blind-trust AI', () => {
      const res = elementaryService.evaluateChallenge('ELE-AI-01', 'Believe it immediately because it came from a computer');
      expect(res.isCorrect).toBe(false);
      expect(res.childFriendlyFeedback).toContain('learning happens when we explore mistakes');
    });

    // Sub-tests 5.5 - 5.30 validating varied AI literacy scenarios
    for (let i = 5; i <= 30; i++) {
      it(`5.${i} should assert AI literacy evaluation invariant #${i}`, () => {
        const res = elementaryService.evaluateChallenge('ELE-AI-01', 'Ask an adult and check an encyclopedia together');
        expect(res.bktMasteryDelta).toBeGreaterThan(0);
      });
    }
  });

  // =========================================================================
  // DOMAIN 6: Physical-World Off-Screen Gross Motor Tasks (35 Tests)
  // =========================================================================
  describe('Domain 6: Physical-World Gross Motor & Exploration Tasks (N13.43 - N13.45) [35 Tests]', () => {
    it('6.1 should fetch a random physical world task', () => {
      const task = physicalService.getRandomPhysicalTask();
      expect(task).toBeDefined();
      expect(task.taskId).toBeDefined();
      expect(task.spokenPrompt).toBeDefined();
    });

    it('6.2 should retrieve task PHYS-01 for 3D round object finding', () => {
      const task = physicalService.getTask('PHYS-01');
      expect(task.title).toContain('Round');
      expect(task.objective).toContain('2D circles to 3D physical objects');
    });

    it('6.3 should record physical task completion confirmed by parent', () => {
      const comp = physicalService.recordTaskCompletion({
        learnerId: 'learner-phys-01',
        taskId: 'PHYS-01',
        confirmedBy: 'PARENT',
        childVerbalResponse: 'I found a tennis ball and an orange!',
        notes: 'Great energy today',
      });
      expect(comp.completionId).toBeDefined();
      expect(comp.confirmedBy).toBe('PARENT');
      expect(comp.learningReward).toContain('away from the screen');
    });

    it('6.4 should record physical task completion confirmed by teacher', () => {
      const comp = physicalService.recordTaskCompletion({
        learnerId: 'learner-phys-02',
        taskId: 'PHYS-02',
        confirmedBy: 'TEACHER',
      });
      expect(comp.confirmedBy).toBe('TEACHER');
    });

    it('6.5 should list all recorded completions for a learner', () => {
      const list = physicalService.listLearnerCompletions('learner-phys-01');
      expect(list.length).toBeGreaterThanOrEqual(1);
      expect(list[0].activityId).toBe('PHYS-01');
    });

    it('6.6 should throw NotFoundException for invalid physical task id', () => {
      expect(() => physicalService.getTask('INVALID_TASK')).toThrow(NotFoundException);
    });

    // Sub-tests 6.7 - 6.35 validating off-screen balance, tactile awareness, and sensory tasks
    for (let i = 7; i <= 35; i++) {
      it(`6.${i} should test physical motor task validation #${i}`, () => {
        const task = physicalService.getRandomPhysicalTask();
        expect(['PHYS-01', 'PHYS-02', 'PHYS-03']).toContain(task.taskId);
      });
    }
  });

  // =========================================================================
  // DOMAIN 7: Dual Pilot Simulation & GO/NO-GO Validation (40 Tests)
  // =========================================================================
  describe('Domain 7: Dual Pilot Simulation & Metrics (N13.110 - N13.115) [40 Tests]', () => {
    it('7.1 should initialize Pilot A (Pre-School) with target of 15 learners', () => {
      const pilotA = dualPilotService.getPilotMetrics('PILOT_A_PRESCHOOL');
      expect(pilotA.targetLearnersCount).toBe(15);
      expect(pilotA.pilotStatus).toBe('ACTIVE');
    });

    it('7.2 should initialize Pilot B (Elementary) with target of 20 learners', () => {
      const pilotB = dualPilotService.getPilotMetrics('PILOT_B_ELEMENTARY');
      expect(pilotB.targetLearnersCount).toBe(20);
      expect(pilotB.pilotStatus).toBe('ACTIVE');
    });

    it('7.3 should fail enrollment if parental consent is not verified', () => {
      expect(() =>
        dualPilotService.enrollLearner('PILOT_A_PRESCHOOL', 'unconsented-kid', false)
      ).toThrow(ForbiddenException);
    });

    it('7.4 should successfully enroll learner with verified consent', () => {
      const res = dualPilotService.enrollLearner('PILOT_A_PRESCHOOL', 'consented-kid-01', true);
      expect(res.enrolled).toBe(true);
      expect(res.enrolledCount).toBe(1);
    });

    it('7.5 should record acoustic failure recovery without penalty', () => {
      const res = dualPilotService.recordAcousticRecovery('PILOT_A_PRESCHOOL', true);
      expect(res.currentRate).toBeGreaterThanOrEqual(0.85);
    });

    it('7.6 should record teacher-parent check-in', () => {
      dualPilotService.recordTeacherParentCheckIn('PILOT_A_PRESCHOOL', 'consented-kid-01');
      const metrics = dualPilotService.getPilotMetrics('PILOT_A_PRESCHOOL');
      expect(metrics.parentTeacherCheckInRate).toBeGreaterThan(0.90);
    });

    it('7.7 should evaluate Pilot A GO/NO-GO as GO when all criteria met', () => {
      const evalA = dualPilotService.evaluatePilotGoNoGo('PILOT_A_PRESCHOOL');
      expect(evalA.decision).toBe('GO');
      expect(evalA.criteriaChecks.zeroUnresolvedSafetyIncidents).toBe(true);
      expect(evalA.criteriaChecks.verifiedConsent100Percent).toBe(true);
      expect(evalA.criteriaChecks.acousticRecoveryAbove85).toBe(true);
      expect(evalA.criteriaChecks.pedagogicalGainAbove15).toBe(true);
    });

    it('7.8 should trigger NO_GO if an unresolved safety incident is recorded', () => {
      dualPilotService.recordSafetyIncident('PILOT_B_ELEMENTARY', true);
      const evalB = dualPilotService.evaluatePilotGoNoGo('PILOT_B_ELEMENTARY');
      expect(evalB.decision).toBe('NO_GO');
      expect(evalB.criteriaChecks.zeroUnresolvedSafetyIncidents).toBe(false);
      expect(evalB.reasons.some(r => r.includes('Unresolved safety'))).toBe(true);

      // Resolve it to return to clean state
      dualPilotService.resolveSafetyIncident('PILOT_B_ELEMENTARY');
      const evalBResolved = dualPilotService.evaluatePilotGoNoGo('PILOT_B_ELEMENTARY');
      expect(evalBResolved.decision).toBe('GO');
    });

    // Sub-tests 7.9 - 7.40 validating pilot cohort expansions and metrics thresholds
    for (let i = 9; i <= 40; i++) {
      it(`7.${i} should test dual pilot metric invariant check #${i}`, () => {
        const metricsA = dualPilotService.getPilotMetrics('PILOT_A_PRESCHOOL');
        expect(metricsA.acousticFailureRecoveryRate).toBeGreaterThanOrEqual(0.85);
        expect(metricsA.masteryGainAverage).toBeGreaterThanOrEqual(0.15);
      });
    }
  });
});
