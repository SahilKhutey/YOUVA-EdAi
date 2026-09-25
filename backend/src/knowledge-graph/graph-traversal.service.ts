import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  KnowledgeNode,
  GraphTraversalOptions,
  GraphEdge,
} from './types/graph.types';

@Injectable()
export class GraphTraversalService {
  private readonly logger = new Logger(GraphTraversalService.name);
  private readonly DEFAULT_MAX_DEPTH = 3;
  private readonly ABSOLUTE_MAX_DEPTH = 5;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Traverses upstream prerequisite edges to find all concepts required before `knowledgeId`.
   * Direction: Prerequisite (source) -> Dependent (target).
   * So for `knowledgeId`, prerequisites are incoming edges where targetId === knowledgeId.
   */
  async getPrerequisites(
    knowledgeId: string,
    options?: Partial<GraphTraversalOptions>,
  ): Promise<KnowledgeNode[]> {
    const maxDepth = Math.min(options?.maxDepth ?? this.DEFAULT_MAX_DEPTH, this.ABSOLUTE_MAX_DEPTH);
    const publishedOnly = options?.publishedOnly ?? true;
    const tenantId = options?.tenantId;

    const visited = new Set<string>();
    const result: KnowledgeNode[] = [];
    const queue: Array<{ id: string; depth: number }> = [{ id: knowledgeId, depth: 0 }];
    visited.add(knowledgeId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.depth >= maxDepth) continue;

      // Find incoming PREREQUISITE edges (source -> current.id)
      const incomingEdges = await this.prisma.knowledgeRelationship.findMany({
        where: {
          targetId: current.id,
          relation: 'PREREQUISITE',
          ...(tenantId ? { source: { OR: [{ tenantId }, { tenantId: null }] } } : {}),
        },
        include: { source: true },
      });

      for (const edge of incomingEdges) {
        const prereq = edge.source;
        if (!visited.has(prereq.id)) {
          visited.add(prereq.id);

          if (!publishedOnly || prereq.status === 'PUBLISHED') {
            result.push({
              id: prereq.id,
              title: prereq.title,
              type: prereq.type,
              status: prereq.status,
              slug: prereq.slug,
              description: prereq.description ?? undefined,
              currentVersion: prereq.currentVersion,
            });
            queue.push({ id: prereq.id, depth: current.depth + 1 });
          }
        }
      }
    }

    return result;
  }

  /**
   * Traverses downstream dependent edges to find concepts that depend on `knowledgeId`.
   * Direction: knowledgeId (source) -> Dependent (target).
   */
  async getDependents(
    knowledgeId: string,
    options?: Partial<GraphTraversalOptions>,
  ): Promise<KnowledgeNode[]> {
    const maxDepth = Math.min(options?.maxDepth ?? this.DEFAULT_MAX_DEPTH, this.ABSOLUTE_MAX_DEPTH);
    const publishedOnly = options?.publishedOnly ?? true;
    const tenantId = options?.tenantId;

    const visited = new Set<string>();
    const result: KnowledgeNode[] = [];
    const queue: Array<{ id: string; depth: number }> = [{ id: knowledgeId, depth: 0 }];
    visited.add(knowledgeId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.depth >= maxDepth) continue;

      // Outgoing PREREQUISITE edges (current.id -> target)
      const outgoingEdges = await this.prisma.knowledgeRelationship.findMany({
        where: {
          sourceId: current.id,
          relation: 'PREREQUISITE',
          ...(tenantId ? { target: { OR: [{ tenantId }, { tenantId: null }] } } : {}),
        },
        include: { target: true },
      });

      for (const edge of outgoingEdges) {
        const dependent = edge.target;
        if (!visited.has(dependent.id)) {
          visited.add(dependent.id);

          if (!publishedOnly || dependent.status === 'PUBLISHED') {
            result.push({
              id: dependent.id,
              title: dependent.title,
              type: dependent.type,
              status: dependent.status,
              slug: dependent.slug,
              description: dependent.description ?? undefined,
              currentVersion: dependent.currentVersion,
            });
            queue.push({ id: dependent.id, depth: current.depth + 1 });
          }
        }
      }
    }

    return result;
  }

  /**
   * Retrieves related knowledge (non-prerequisite and progression links).
   */
  async getRelated(
    knowledgeId: string,
    options?: Partial<GraphTraversalOptions>,
  ): Promise<{ outgoing: any[]; incoming: any[] }> {
    const publishedOnly = options?.publishedOnly ?? true;
    const tenantId = options?.tenantId;

    const [outgoing, incoming] = await Promise.all([
      this.prisma.knowledgeRelationship.findMany({
        where: {
          sourceId: knowledgeId,
          ...(publishedOnly ? { target: { status: 'PUBLISHED' } } : {}),
          ...(tenantId ? { target: { OR: [{ tenantId }, { tenantId: null }] } } : {}),
        },
        include: { target: true },
      }),
      this.prisma.knowledgeRelationship.findMany({
        where: {
          targetId: knowledgeId,
          ...(publishedOnly ? { source: { status: 'PUBLISHED' } } : {}),
          ...(tenantId ? { source: { OR: [{ tenantId }, { tenantId: null }] } } : {}),
        },
        include: { source: true },
      }),
    ]);

    return {
      outgoing: outgoing.map((rel) => ({
        id: rel.target.id,
        title: rel.target.title,
        type: rel.target.type,
        relation: rel.relation,
        weight: rel.weight,
        status: rel.target.status,
      })),
      incoming: incoming.map((rel) => ({
        id: rel.source.id,
        title: rel.source.title,
        type: rel.source.type,
        relation: rel.relation,
        weight: rel.weight,
        status: rel.source.status,
      })),
    };
  }

  /**
   * Finds the shortest directed path from `sourceId` to `targetId` along PREREQUISITE edges.
   */
  async findPath(
    sourceId: string,
    targetId: string,
    options?: Partial<GraphTraversalOptions>,
  ): Promise<KnowledgeNode[]> {
    if (sourceId === targetId) {
      const node = await this.prisma.knowledgeObject.findUnique({ where: { id: sourceId } });
      return node ? [this.mapToNode(node)] : [];
    }

    const tenantId = options?.tenantId;
    const publishedOnly = options?.publishedOnly ?? true;

    const queue: Array<{ id: string; path: string[] }> = [{ id: sourceId, path: [sourceId] }];
    const visited = new Set<string>([sourceId]);

    while (queue.length > 0) {
      const { id: currentId, path } = queue.shift()!;

      const edges = await this.prisma.knowledgeRelationship.findMany({
        where: {
          sourceId: currentId,
          relation: 'PREREQUISITE',
          ...(tenantId ? { target: { OR: [{ tenantId }, { tenantId: null }] } } : {}),
          ...(publishedOnly ? { target: { status: 'PUBLISHED' } } : {}),
        },
        select: { targetId: true },
      });

      for (const edge of edges) {
        if (edge.targetId === targetId) {
          const finalPathIds = [...path, edge.targetId];
          const nodes = await this.prisma.knowledgeObject.findMany({
            where: { id: { in: finalPathIds } },
          });
          const nodeMap = new Map(nodes.map((n) => [n.id, this.mapToNode(n)]));
          return finalPathIds.map((id) => nodeMap.get(id)!).filter(Boolean);
        }

        if (!visited.has(edge.targetId)) {
          visited.add(edge.targetId);
          queue.push({ id: edge.targetId, path: [...path, edge.targetId] });
        }
      }
    }

    return [];
  }

  /**
   * Retrieves a multi-hop subgraph around `knowledgeId` for teacher visualization.
   */
  async getSubgraph(
    knowledgeId: string,
    maxDepth: number = 2,
    tenantId?: string,
  ): Promise<{ nodes: KnowledgeNode[]; edges: GraphEdge[] }> {
    const depth = Math.min(maxDepth, 3);
    const visitedNodes = new Set<string>([knowledgeId]);
    const collectedEdges: Map<string, GraphEdge> = new Map();

    const queue: Array<{ id: string; depth: number }> = [{ id: knowledgeId, depth: 0 }];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.depth >= depth) continue;

      const [outgoing, incoming] = await Promise.all([
        this.prisma.knowledgeRelationship.findMany({
          where: {
            sourceId: current.id,
            ...(tenantId ? { target: { OR: [{ tenantId }, { tenantId: null }] } } : {}),
          },
          include: { source: true, target: true },
        }),
        this.prisma.knowledgeRelationship.findMany({
          where: {
            targetId: current.id,
            ...(tenantId ? { source: { OR: [{ tenantId }, { tenantId: null }] } } : {}),
          },
          include: { source: true, target: true },
        }),
      ]);

      for (const edge of [...outgoing, ...incoming]) {
        collectedEdges.set(edge.id, {
          id: edge.id,
          sourceId: edge.sourceId,
          targetId: edge.targetId,
          relation: edge.relation,
          weight: edge.weight ?? undefined,
        });

        for (const endpointId of [edge.sourceId, edge.targetId]) {
          if (!visitedNodes.has(endpointId)) {
            visitedNodes.add(endpointId);
            queue.push({ id: endpointId, depth: current.depth + 1 });
          }
        }
      }
    }

    const nodes = await this.prisma.knowledgeObject.findMany({
      where: { id: { in: Array.from(visitedNodes) } },
    });

    return {
      nodes: nodes.map((n) => this.mapToNode(n)),
      edges: Array.from(collectedEdges.values()),
    };
  }

  private mapToNode(object: any): KnowledgeNode {
    return {
      id: object.id,
      title: object.title,
      type: object.type,
      status: object.status,
      slug: object.slug,
      description: object.description ?? undefined,
      currentVersion: object.currentVersion,
    };
  }
}
