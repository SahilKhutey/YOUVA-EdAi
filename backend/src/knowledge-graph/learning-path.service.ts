import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GraphTraversalService } from './graph-traversal.service';
import {
  LearningPath,
  LearningPathNode,
  LearningPathReadiness,
} from './types/graph.types';

@Injectable()
export class LearningPathService {
  private readonly logger = new Logger(LearningPathService.name);
  private readonly MASTERY_THRESHOLD = 0.70;
  private readonly STRUGGLE_THRESHOLD = 0.40;

  constructor(
    private readonly prisma: PrismaService,
    private readonly traversalService: GraphTraversalService,
  ) {}

  /**
   * Builds an explainable, graph-driven learning path for a learner and target concept.
   * Evaluates prerequisite mastery to determine overall readiness and pinpoint remediation targets.
   */
  async buildPath(
    learnerId: string,
    targetKnowledgeId: string,
    context?: {
      tenantId?: string;
      courseId?: string;
      respectTeacherPath?: boolean;
    },
  ): Promise<LearningPath> {
    const tenantId = context?.tenantId ?? 'default-tenant';

    // 1. Fetch target knowledge object (must be published for learning path)
    const targetObject = await this.prisma.knowledgeObject.findFirst({
      where: {
        id: targetKnowledgeId,
        status: 'PUBLISHED',
        OR: [{ tenantId }, { tenantId: null }],
      },
    });

    if (!targetObject) {
      throw new NotFoundException(
        `Target knowledge object '${targetKnowledgeId}' not found or not published`,
      );
    }

    // 2. Traverse upstream prerequisites and downstream dependents
    const [prerequisites, dependents] = await Promise.all([
      this.traversalService.getPrerequisites(targetKnowledgeId, {
        tenantId,
        publishedOnly: true,
        maxDepth: 3,
      }),
      this.traversalService.getDependents(targetKnowledgeId, {
        tenantId,
        publishedOnly: true,
        maxDepth: 1,
      }),
    ]);

    // 3. Collect all node IDs to query learner states in a single batch
    const allNodeIds = [
      targetKnowledgeId,
      ...prerequisites.map((p) => p.id),
      ...dependents.map((d) => d.id),
    ];

    const learnerStates = await this.prisma.learnerKnowledgeState.findMany({
      where: {
        tenantId,
        learnerId,
        knowledgeObjectId: { in: allNodeIds },
      },
    });

    const stateMap = new Map(learnerStates.map((s) => [s.knowledgeObjectId, s]));

    // 4. Evaluate Prerequisite Readiness
    let readiness: LearningPathReadiness = 'READY';
    let weakestPrerequisiteId: string | undefined = undefined;
    let lowestMastery = 1.0;

    const prereqNodes: LearningPathNode[] = [];

    for (const prereq of prerequisites) {
      const state = stateMap.get(prereq.id);
      const mastery = state?.masteryLevel ?? 0.0;
      const confidence = state?.confidence ?? 0.0;
      const isStruggling = state?.status === 'STRUGGLING' || mastery < this.STRUGGLE_THRESHOLD;
      const isWeak = mastery < this.MASTERY_THRESHOLD;

      if (isWeak && mastery < lowestMastery) {
        lowestMastery = mastery;
        weakestPrerequisiteId = prereq.id;
      }

      if (isStruggling) {
        readiness = 'NOT_READY';
      } else if (isWeak && readiness !== 'NOT_READY') {
        readiness = 'PARTIALLY_READY';
      }

      prereqNodes.push({
        knowledgeId: prereq.id,
        title: prereq.title,
        type: prereq.type,
        role: isWeak ? 'REMEDIATION' : 'PREREQUISITE',
        mastery,
        confidence,
        status: state?.status ?? 'NOT_STARTED',
        required: true,
        reason: isStruggling
          ? `Active struggle detected on foundational concept '${prereq.title}'. Review required.`
          : isWeak
            ? `Prerequisite '${prereq.title}' has not yet reached mastery threshold (${Math.round(mastery * 100)}%).`
            : `Prerequisite '${prereq.title}' is mastered (${Math.round(mastery * 100)}%).`,
      });
    }

    // 5. Build Current Target Node
    const targetState = stateMap.get(targetKnowledgeId);
    const targetMastery = targetState?.masteryLevel ?? 0.0;

    const currentNode: LearningPathNode = {
      knowledgeId: targetObject.id,
      title: targetObject.title,
      type: targetObject.type,
      role: 'CURRENT',
      mastery: targetMastery,
      confidence: targetState?.confidence ?? 0.0,
      status: targetState?.status ?? 'NOT_STARTED',
      required: true,
      reason:
        readiness === 'READY'
          ? `All prerequisites are satisfied. Ready for active learning!`
          : readiness === 'PARTIALLY_READY'
            ? `Foundational refresh recommended before beginning.`
            : `Important prerequisite gaps must be addressed first.`,
    };

    // 6. Build Downstream Next / Extension Nodes
    const nextNodes: LearningPathNode[] = dependents.map((dep) => {
      const depState = stateMap.get(dep.id);
      return {
        knowledgeId: dep.id,
        title: dep.title,
        type: dep.type,
        role: 'NEXT',
        mastery: depState?.masteryLevel ?? 0.0,
        confidence: depState?.confidence ?? 0.0,
        status: depState?.status ?? 'NOT_STARTED',
        required: false,
        reason: `Follow-up concept that unlocks upon mastering '${targetObject.title}'.`,
      };
    });

    // 7. Order nodes: Prerequisites (in traversal order) -> Current -> Next
    const nodes: LearningPathNode[] = [...prereqNodes, currentNode, ...nextNodes];

    return {
      targetKnowledgeId,
      targetTitle: targetObject.title,
      nodes,
      readiness,
      weakestPrerequisiteId,
      generatedAt: new Date(),
    };
  }
}
