import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  GraphHealthMetrics,
  RelationshipValidationResult,
} from './types/graph.types';

@Injectable()
export class GraphValidationService {
  private readonly logger = new Logger(GraphValidationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Checks if adding a directed edge (sourceId -> targetId) with the specified relation
   * would introduce a circular dependency in the graph.
   * Progression relations like PREREQUISITE and BUILDS_ON must remain strictly acyclic (DAG).
   */
  async wouldCreateCycle(
    sourceId: string,
    targetId: string,
    relation: string = 'PREREQUISITE',
    tenantId?: string,
  ): Promise<boolean> {
    // Rule 1: Self-reference is inherently cyclic
    if (sourceId === targetId) {
      return true;
    }

    // Only progression edges (PREREQUISITE, BUILDS_ON) enforce strict DAG acyclicity
    if (relation !== 'PREREQUISITE' && relation !== 'BUILDS_ON') {
      return false;
    }

    // If source is prerequisite for target (source -> target),
    // a cycle would be formed if target can already reach source via prerequisite edges.
    return this.isReachable(targetId, sourceId, relation, tenantId);
  }

  /**
   * Breadth-first search to determine if `toId` is reachable from `fromId`
   * along edges of the specified relation type.
   */
  async isReachable(
    fromId: string,
    toId: string,
    relationType: string = 'PREREQUISITE',
    tenantId?: string,
  ): Promise<boolean> {
    if (fromId === toId) {
      return true;
    }

    const visited = new Set<string>();
    const queue: string[] = [fromId];
    visited.add(fromId);

    const MAX_VISITS = 150; // Safety guardrail against deep or unbounded search
    let visits = 0;

    while (queue.length > 0 && visits < MAX_VISITS) {
      const currentId = queue.shift()!;
      visits++;

      // Find all outgoing edges from currentId with matching relation
      const outgoing =
        (await this.prisma.knowledgeRelationship.findMany({
          where: {
            sourceId: currentId,
            relation: relationType,
            ...(tenantId ? { source: { OR: [{ tenantId }, { tenantId: null }] } } : {}),
          },
          select: { targetId: true },
        })) || [];

      for (const edge of outgoing) {
        if (edge.targetId === toId) {
          return true;
        }

        if (!visited.has(edge.targetId)) {
          visited.add(edge.targetId);
          queue.push(edge.targetId);
        }
      }
    }

    return false;
  }

  /**
   * Validates relationship integrity before persisting into the knowledge graph.
   * Throws BadRequestException or NotFoundException on hard violations.
   */
  async validateRelationship(
    sourceId: string,
    targetId: string,
    relation: string,
    tenantId: string = 'default-tenant',
  ): Promise<RelationshipValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Rule 1: No self-reference
    if (sourceId === targetId) {
      errors.push('A knowledge object cannot relate to itself');
      throw new BadRequestException('A knowledge object cannot relate to itself');
    }

    // Rule 2: Valid targets and tenant isolation
    const [source, target] = await Promise.all([
      this.prisma.knowledgeObject.findUnique({ where: { id: sourceId } }),
      this.prisma.knowledgeObject.findUnique({ where: { id: targetId } }),
    ]);

    if (!source) {
      errors.push(`Source knowledge object '${sourceId}' not found`);
      throw new NotFoundException(`Source knowledge object '${sourceId}' not found`);
    }

    if (!target) {
      errors.push(`Target knowledge object '${targetId}' not found`);
      throw new NotFoundException(`Target knowledge object '${targetId}' not found`);
    }

    // Tenant isolation check
    if (
      (source.tenantId && target.tenantId && source.tenantId !== target.tenantId) ||
      (tenantId && source.tenantId && source.tenantId !== tenantId) ||
      (tenantId && target.tenantId && target.tenantId !== tenantId)
    ) {
      errors.push('Cross-tenant relationships are not permitted');
      throw new BadRequestException('Cross-tenant relationships are not permitted');
    }

    // Rule 3: Cycle detection for progression edges
    if (relation === 'PREREQUISITE' || relation === 'BUILDS_ON') {
      const createsCycle = await this.wouldCreateCycle(sourceId, targetId, relation, tenantId);
      if (createsCycle) {
        errors.push(
          `Cannot create ${relation} relationship: it would introduce a circular dependency between '${source.title}' and '${target.title}'`,
        );
        throw new BadRequestException(
          `Cannot create ${relation} relationship: it would introduce a circular dependency between '${source.title}' and '${target.title}'`,
        );
      }
    }

    // Warnings: Unpublished references
    if (source.status !== 'PUBLISHED' || target.status !== 'PUBLISHED') {
      warnings.push(
        `Relationship connects non-published knowledge (${source.title}: ${source.status}, ${target.title}: ${target.status}). This relationship will not appear to students until both objects are published.`,
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Analyzes the overall health, completeness, and governance of the tenant's knowledge graph.
   */
  async validateGraphHealth(tenantId: string = 'default-tenant'): Promise<GraphHealthMetrics> {
    const whereTenant = { OR: [{ tenantId }, { tenantId: null }] };

    const [totalNodes, allRelationships, allNodes] = await Promise.all([
      this.prisma.knowledgeObject.count({ where: whereTenant }),
      this.prisma.knowledgeRelationship.findMany({
        where: {
          source: whereTenant,
        },
        include: {
          source: { select: { id: true, status: true, title: true } },
          target: { select: { id: true, status: true, title: true } },
        },
      }),
      this.prisma.knowledgeObject.findMany({
        where: whereTenant,
        select: { id: true, status: true, title: true },
      }),
    ]);

    const nodeIds = new Set(allNodes.map((n) => n.id));
    const connectedNodeIds = new Set<string>();

    let brokenRelationships = 0;
    let prerequisiteRelationships = 0;
    let unpublishedReferences = 0;
    const warnings: string[] = [];

    for (const rel of allRelationships) {
      if (rel.relation === 'PREREQUISITE') {
        prerequisiteRelationships++;
      }

      if (!rel.source || !rel.target || !nodeIds.has(rel.sourceId) || !nodeIds.has(rel.targetId)) {
        brokenRelationships++;
        warnings.push(`Broken relationship detected: edge ${rel.id} has missing source or target.`);
      } else {
        connectedNodeIds.add(rel.sourceId);
        connectedNodeIds.add(rel.targetId);

        if (rel.source.status !== 'PUBLISHED' || rel.target.status !== 'PUBLISHED') {
          unpublishedReferences++;
        }
      }
    }

    // Orphan detection: nodes with 0 incoming and 0 outgoing edges
    const orphanNodes = allNodes.filter((n) => !connectedNodeIds.has(n.id)).length;
    if (orphanNodes > 0) {
      warnings.push(`${orphanNodes} knowledge objects have no incoming or outgoing graph relationships.`);
    }

    // Check for potential cycles among existing prerequisite edges
    let potentialCycles = 0;
    const prereqEdges = allRelationships.filter((r) => r.relation === 'PREREQUISITE');
    const prereqAdj = new Map<string, string[]>();
    for (const e of prereqEdges) {
      if (!prereqAdj.has(e.sourceId)) {
        prereqAdj.set(e.sourceId, []);
      }
      prereqAdj.get(e.sourceId)!.push(e.targetId);
    }

    // Cycle check via DFS with recursion stack
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const checkCycle = (nodeId: string): boolean => {
      visited.add(nodeId);
      recStack.add(nodeId);

      const neighbors = prereqAdj.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (checkCycle(neighbor)) return true;
        } else if (recStack.has(neighbor)) {
          return true;
        }
      }

      recStack.delete(nodeId);
      return false;
    };

    for (const nodeId of prereqAdj.keys()) {
      if (!visited.has(nodeId)) {
        if (checkCycle(nodeId)) {
          potentialCycles++;
          warnings.push(`Potential cycle detected involving node '${nodeId}'.`);
        }
      }
    }

    return {
      totalNodes,
      totalRelationships: allRelationships.length,
      prerequisiteRelationships,
      brokenRelationships,
      potentialCycles,
      orphanNodes,
      unpublishedReferences,
      warnings,
    };
  }
}
