import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  LearningPathway,
  PathwayMilestone,
  PathwayScoreInput,
  scorePathway,
  transition,
} from './pathway.types';

@Injectable()
export class LearningPathwayService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Evaluates pathway selection score based on multidimensional inputs.
   */
  evaluateScore(input: PathwayScoreInput): number {
    return scorePathway(input);
  }

  /**
   * Advances milestone status through governed state machine transitions.
   * Invariant: AI cannot skip stages or directly mark milestone as completed without evidence review.
   */
  advanceMilestone(milestone: PathwayMilestone, nextState: any): PathwayMilestone {
    const updatedStatus = transition(milestone.status, nextState) as any;
    return {
      ...milestone,
      status: updatedStatus,
    };
  }

  /**
   * Synthesizes an adaptive multi-stage learning pathway for a learner goal.
   */
  async generatePathway(learnerId: string, goal: string): Promise<LearningPathway> {
    const milestones: PathwayMilestone[] = [
      {
        id: 'ms-1',
        type: 'CONCEPT',
        targetId: 'concept-foundations',
        status: 'AVAILABLE',
        evidenceRequired: 2,
      },
      {
        id: 'ms-2',
        type: 'COMPETENCY',
        targetId: 'comp-application',
        status: 'LOCKED',
        evidenceRequired: 3,
      },
      {
        id: 'ms-3',
        type: 'PROJECT',
        targetId: 'proj-capstone',
        status: 'LOCKED',
        evidenceRequired: 1,
      },
    ];

    return {
      learnerId,
      goal,
      milestones,
      prerequisites: [],
      estimatedStages: milestones.length,
      confidence: 0.9,
    };
  }
}
