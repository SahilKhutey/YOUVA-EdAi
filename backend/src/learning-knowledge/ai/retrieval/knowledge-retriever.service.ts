import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GraphTraversalService } from '../../../knowledge-graph/graph-traversal.service';
import { Role } from '../../../auth/role.enum';
import { AiContext, RetrievedKnowledgeItem } from '../ai.types';

@Injectable()
export class KnowledgeRetrieverService {
  private readonly logger = new Logger(KnowledgeRetrieverService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly graphTraversal: GraphTraversalService,
  ) {}

  /**
   * Securely retrieves grounded curriculum context for AI operations.
   * Enforces strict tenant isolation and student PUBLISHED-only access.
   */
  async retrieveContext(
    knowledgeId: string,
    actorId: string,
    actorRole: Role,
    tenantId: string = 'default-tenant',
  ): Promise<AiContext> {
    const isStudent = actorRole === Role.STUDENT;

    // 1. Fetch Target Knowledge Object
    const object = await this.prisma.knowledgeObject.findFirst({
      where: {
        id: knowledgeId,
        ...(isStudent ? { status: 'PUBLISHED' } : {}),
        OR: [{ tenantId }, { tenantId: null }],
      },
      include: {
        versions: { orderBy: { version: 'desc' }, take: 1 },
      },
    });

    if (!object) {
      if (isStudent) {
        throw new NotFoundException(
          `Knowledge object '${knowledgeId}' not found or not published.`,
        );
      }
      throw new NotFoundException(
        `Knowledge object '${knowledgeId}' not found in tenant '${tenantId}'.`,
      );
    }

    const version = object.versions[0];
    if (!version) {
      throw new NotFoundException(
        `No content versions found for knowledge object '${knowledgeId}'.`,
      );
    }

    // 2. Fetch Prerequisites via Graph Traversal (always PUBLISHED for students)
    const prereqNodes = await this.graphTraversal.getPrerequisites(knowledgeId, {
      tenantId,
      publishedOnly: isStudent,
      maxDepth: 2,
    });

    // Resolve content for top prerequisites (limit to 3 for context budget)
    const prereqIds = prereqNodes.slice(0, 3).map((p) => p.id);
    const prereqVersions = await this.prisma.knowledgeVersion.findMany({
      where: {
        knowledgeObjectId: { in: prereqIds },
        ...(isStudent ? { knowledgeObject: { status: 'PUBLISHED' } } : {}),
      },
      distinct: ['knowledgeObjectId'],
      orderBy: { version: 'desc' },
      include: { knowledgeObject: true },
    });

    const prerequisites: RetrievedKnowledgeItem[] = (prereqVersions || []).map((pv) => ({
      id: pv.knowledgeObjectId,
      versionId: pv.id,
      title: pv.knowledgeObject.title,
      type: pv.knowledgeObject.type,
      status: pv.knowledgeObject.status,
      content: typeof pv.content === 'string' ? pv.content : JSON.stringify(pv.content),
      relationToTarget: 'PREREQUISITE',
    }));

    // 3. Fetch Related Concepts
    const relatedData = await this.graphTraversal.getRelated(knowledgeId, {
      tenantId,
      publishedOnly: isStudent,
    });

    const relatedKnowledge: RetrievedKnowledgeItem[] = [
      ...relatedData.outgoing.slice(0, 2).map((r) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        status: r.status,
        content: '',
        relationToTarget: r.relation,
      })),
      ...relatedData.incoming.slice(0, 2).map((r) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        status: r.status,
        content: '',
        relationToTarget: r.relation,
      })),
    ];

    // 4. Fetch Learner State (if student)
    let learnerState: AiContext['learnerState'] = undefined;
    if (isStudent) {
      const state = await this.prisma.learnerKnowledgeState.findUnique({
        where: {
          tenantId_learnerId_knowledgeObjectId: {
            tenantId,
            learnerId: actorId,
            knowledgeObjectId: object.id,
          },
        },
      });

      if (state) {
        learnerState = {
          masteryLevel: state.masteryLevel,
          confidence: state.confidence,
          status: state.status,
        };
      }
    }

    return {
      tenantId,
      targetKnowledge: {
        id: object.id,
        versionId: version.id,
        title: object.title,
        type: object.type,
        status: object.status,
        content: typeof version.content === 'string' ? version.content : JSON.stringify(version.content),
      },
      prerequisites,
      relatedKnowledge,
      learnerState,
    };
  }
}
