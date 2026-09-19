import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  LearnerGoal,
  LearnerGoalStatus,
  LearningPathway,
  PathwayType,
  PathwayStep,
  CapabilityGapDiagnosis,
  CapabilityDimensions,
} from './n20-types';
import { CapabilityGraphService } from './capability-graph.service';

@Injectable()
export class LearnerGoalsPathwayService {
  private goals: Map<string, LearnerGoal> = new Map();
  // Map of learnerId -> Map of capabilityId -> CapabilityDimensions
  private learnerCapabilities: Map<string, Map<string, CapabilityDimensions>> = new Map();

  constructor(private readonly capabilityGraph: CapabilityGraphService) {
    this.seedInitialLearnerData();
  }

  private seedInitialLearnerData(): void {
    const learnerId = 'learner-alex-001';
    const capMap = new Map<string, CapabilityDimensions>();
    capMap.set('cap-dist-sys-101', {
      applicationScore: 80,
      independenceScore: 85,
      transferScore: 70,
      recencyTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 15,
      evidenceStrengthScore: 75,
    });
    this.learnerCapabilities.set(learnerId, capMap);

    // Seed an initial goal
    const goalId = 'goal-alex-zkp-01';
    const pathways = this.generateAlternativePathways('cap-zkp-103');
    const initialGoal: LearnerGoal = {
      id: goalId,
      learnerId,
      targetCapabilityId: 'cap-zkp-103',
      title: 'Master Zero-Knowledge Circuit Engineering & Verification',
      rationale: 'Prepare for high-assurance cryptographic protocol design and privacy-preserving audit role.',
      status: 'ACTIVE',
      targetDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(), // 60 days
      activePathwayId: pathways[0].id,
      pathways,
      currentProgressPct: 25,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.goals.set(goalId, initialGoal);
  }

  // --- Learner Goal Management ---

  public createGoal(dto: {
    learnerId: string;
    targetCapabilityId: string;
    title: string;
    rationale: string;
    targetDate: string;
    preferredPathwayType?: PathwayType;
  }): LearnerGoal {
    if (!dto.learnerId || !dto.targetCapabilityId || !dto.title) {
      throw new BadRequestException('Learner ID, target capability ID, and title are required');
    }

    // Verify capability exists in graph
    this.capabilityGraph.getCapability(dto.targetCapabilityId);

    const pathways = this.generateAlternativePathways(dto.targetCapabilityId);
    const activePathway = dto.preferredPathwayType
      ? pathways.find((p) => p.type === dto.preferredPathwayType) || pathways[0]
      : pathways[0];

    const id = `goal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const goal: LearnerGoal = {
      id,
      learnerId: dto.learnerId,
      targetCapabilityId: dto.targetCapabilityId,
      title: dto.title,
      rationale: dto.rationale || 'Personal mastery and professional capability progression',
      status: 'ACTIVE',
      targetDate: dto.targetDate,
      activePathwayId: activePathway.id,
      pathways,
      currentProgressPct: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.goals.set(id, goal);
    return goal;
  }

  public getGoal(id: string): LearnerGoal {
    const goal = this.goals.get(id);
    if (!goal) {
      throw new NotFoundException(`Learner Goal with ID ${id} not found`);
    }
    return goal;
  }

  public listGoalsByLearner(learnerId: string): LearnerGoal[] {
    return Array.from(this.goals.values()).filter((g) => g.learnerId === learnerId);
  }

  public updateGoalStatus(id: string, status: LearnerGoalStatus): LearnerGoal {
    const goal = this.getGoal(id);
    goal.status = status;
    goal.updatedAt = new Date().toISOString();
    this.goals.set(id, goal);
    return goal;
  }

  public switchActivePathway(goalId: string, pathwayId: string): LearnerGoal {
    const goal = this.getGoal(goalId);
    const pathway = goal.pathways.find((p) => p.id === pathwayId);
    if (!pathway) {
      throw new BadRequestException(`Pathway with ID ${pathwayId} does not exist in this goal`);
    }
    goal.activePathwayId = pathwayId;
    goal.updatedAt = new Date().toISOString();
    this.goals.set(goalId, goal);
    return goal;
  }

  public completePathwayStep(goalId: string, pathwayId: string, stepIndex: number): LearnerGoal {
    const goal = this.getGoal(goalId);
    const pathway = goal.pathways.find((p) => p.id === pathwayId);
    if (!pathway) {
      throw new BadRequestException(`Pathway with ID ${pathwayId} not found`);
    }

    const step = pathway.steps.find((s) => s.stepIndex === stepIndex);
    if (!step) {
      throw new BadRequestException(`Step ${stepIndex} not found in pathway ${pathwayId}`);
    }

    step.completed = true;

    // Recalculate progress
    const completedSteps = pathway.steps.filter((s) => s.completed).length;
    goal.currentProgressPct = Math.round((completedSteps / pathway.steps.length) * 100);

    if (goal.currentProgressPct === 100) {
      goal.status = 'COMPLETED';
    }

    goal.updatedAt = new Date().toISOString();
    this.goals.set(goalId, goal);
    return goal;
  }

  // --- Gap Diagnosis & Pathway Generation ---

  public diagnoseCapabilityGap(learnerId: string, targetCapabilityId: string): CapabilityGapDiagnosis {
    const targetCap = this.capabilityGraph.getCapability(targetCapabilityId);
    const learnerCaps = this.learnerCapabilities.get(learnerId) || new Map<string, CapabilityDimensions>();

    const missingPrereqs: string[] = [];
    for (const prereqId of targetCap.prerequisites) {
      if (!learnerCaps.has(prereqId)) {
        missingPrereqs.push(prereqId);
      }
    }

    const learnerDims = learnerCaps.get(targetCapabilityId);
    const weakDimensions: (keyof CapabilityDimensions)[] = [];

    if (!learnerDims) {
      weakDimensions.push('applicationScore', 'independenceScore', 'transferScore', 'evidenceStrengthScore');
    } else {
      if (learnerDims.applicationScore < 70) weakDimensions.push('applicationScore');
      if (learnerDims.independenceScore < 70) weakDimensions.push('independenceScore');
      if (learnerDims.transferScore < 70) weakDimensions.push('transferScore');
      if (learnerDims.evidenceStrengthScore < 50) weakDimensions.push('evidenceStrengthScore');
    }

    const pathways = this.generateAlternativePathways(targetCapabilityId);
    const estimatedEffortHours = pathways[0].estimatedTotalHours;

    return {
      learnerId,
      targetCapabilityId,
      currentLevel: learnerDims ? targetCap.level : 'NONE',
      missingPrerequisites: missingPrereqs,
      weakDimensions,
      recommendedPathways: pathways,
      estimatedEffortHours,
      diagnosedAt: new Date().toISOString(),
    };
  }

  public generateAlternativePathways(targetCapabilityId: string): LearningPathway[] {
    const targetCap = this.capabilityGraph.getCapability(targetCapabilityId);

    const projectSteps: PathwayStep[] = [
      {
        stepIndex: 1,
        title: `Deconstruct ${targetCap.title} Core Architecture`,
        description: 'Analyze foundational principles, formal specifications, and state machines.',
        targetCapabilityId,
        actionType: 'REFLECT',
        estimatedHours: 8,
        completed: false,
      },
      {
        stepIndex: 2,
        title: `Implement Minimal Prototype & Unit Verifiers`,
        description: 'Build functional reference implementation under synthetic test vectors.',
        targetCapabilityId,
        actionType: 'BUILD',
        estimatedHours: 16,
        completed: false,
      },
      {
        stepIndex: 3,
        title: `Stress-Test & Adversarial Fuzzing`,
        description: 'Subject system to partition, malformed input, and adversarial edge cases.',
        targetCapabilityId,
        actionType: 'SOLVE',
        estimatedHours: 12,
        completed: false,
      },
      {
        stepIndex: 4,
        title: `Deliver Production Artifact & Peer Defense`,
        description: 'Publish verified codebase and defend design choices before human mentors.',
        targetCapabilityId,
        actionType: 'COLLABORATE',
        estimatedHours: 10,
        completed: false,
      },
    ];

    const practiceSteps: PathwayStep[] = [
      {
        stepIndex: 1,
        title: `Interactive Kata & Micro-Problems`,
        description: 'Complete 15 targeted problem-solving drills with increasing complexity.',
        targetCapabilityId,
        actionType: 'SOLVE',
        estimatedHours: 10,
        completed: false,
      },
      {
        stepIndex: 2,
        title: `Timed Autonomous Coding Challenges`,
        description: 'Solve complex scenarios without AI scaffolding or external assistance.',
        targetCapabilityId,
        actionType: 'SOLVE',
        estimatedHours: 14,
        completed: false,
      },
      {
        stepIndex: 3,
        title: `Reflective Self-Diagnosis & Error Analysis`,
        description: 'Document failure modes and derive generalized heuristics.',
        targetCapabilityId,
        actionType: 'REFLECT',
        estimatedHours: 6,
        completed: false,
      },
    ];

    const mentorSteps: PathwayStep[] = [
      {
        stepIndex: 1,
        title: `Socratic Dialogue & Conceptual Probing`,
        description: 'Engage with senior mentor on architectural trade-offs and edge cases.',
        targetCapabilityId,
        actionType: 'COLLABORATE',
        estimatedHours: 6,
        completed: false,
      },
      {
        stepIndex: 2,
        title: `Paired Code Review & Refactoring`,
        description: 'Refactor production code under direct mentor supervision.',
        targetCapabilityId,
        actionType: 'BUILD',
        estimatedHours: 12,
        completed: false,
      },
      {
        stepIndex: 3,
        title: `Oral Examination & Capstone Defense`,
        description: 'Formal oral defense verifying deep transfer and independence.',
        targetCapabilityId,
        actionType: 'REFLECT',
        estimatedHours: 8,
        completed: false,
      },
    ];

    return [
      {
        id: `path-project-${targetCap.slug}`,
        type: 'PROJECT_BASED',
        title: `Applied Project Pathway: ${targetCap.title}`,
        description: 'Build an authentic, end-to-end production artifact demonstrating multi-dimensional capability.',
        steps: projectSteps,
        estimatedTotalHours: 46,
        isAiScaffolded: true,
      },
      {
        id: `path-practice-${targetCap.slug}`,
        type: 'PRACTICE_DRIVEN',
        title: `Deliberate Practice Pathway: ${targetCap.title}`,
        description: 'High-frequency problem solving and unassisted timed katas focusing on cognitive independence.',
        steps: practiceSteps,
        estimatedTotalHours: 30,
        isAiScaffolded: false,
      },
      {
        id: `path-mentor-${targetCap.slug}`,
        type: 'MENTOR_ASSISTED',
        title: `Mentored Apprenticeship Pathway: ${targetCap.title}`,
        description: 'Direct human educator and mentor collaboration with oral defense checkpoints.',
        steps: mentorSteps,
        estimatedTotalHours: 26,
        isAiScaffolded: false,
      },
    ];
  }

  public recordLearnerCapability(learnerId: string, capabilityId: string, dimensions: CapabilityDimensions): void {
    let learnerMap = this.learnerCapabilities.get(learnerId);
    if (!learnerMap) {
      learnerMap = new Map<string, CapabilityDimensions>();
      this.learnerCapabilities.set(learnerId, learnerMap);
    }
    learnerMap.set(capabilityId, dimensions);
  }

  public getLearnerCapability(learnerId: string, capabilityId: string): CapabilityDimensions | undefined {
    return this.learnerCapabilities.get(learnerId)?.get(capabilityId);
  }
}
