import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InstitutionalPolicy } from '../policies/institutional-policy';

export interface NetworkNode {
  id: string;
  type: 'CONCEPT' | 'PREREQUISITE' | 'ASSESSMENT' | 'INTERVENTION' | 'OUTCOME';
  label: string;
  metadata?: Record<string, any>;
}

export interface NetworkEdge {
  source: string;
  target: string;
  relation: string;
}

export interface BoundedNetworkGraph {
  rootId: string;
  depth: number;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

@Injectable()
export class KnowledgeNetworkService {
  private readonly logger = new Logger(KnowledgeNetworkService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Performs bounded knowledge network traversal from a root entity.
   */
  async getBoundedNetwork(
    rootId: string,
    requestedDepth = 2,
    tenantId = 'default-tenant',
  ): Promise<BoundedNetworkGraph> {
    const depth = InstitutionalPolicy.clampTraversalDepth(requestedDepth);

    // Fetch root knowledge object
    const ko = await this.prisma.knowledgeObject.findFirst({
      where: { id: rootId, tenantId },
      include: {
        outgoingLinks: true,
        incomingLinks: true,
      },
    });

    const nodes: NetworkNode[] = [];
    const edges: NetworkEdge[] = [];
    const visited = new Set<string>();

    if (ko) {
      nodes.push({
        id: ko.id,
        type: 'CONCEPT',
        label: ko.title,
        metadata: { currentVersion: ko.currentVersion, status: ko.status },
      });
      visited.add(ko.id);

      // Depth 1: Relationships
      for (const link of ko.outgoingLinks) {
        if (!visited.has(link.targetId)) {
          nodes.push({
            id: link.targetId,
            type: link.relation === 'PREREQUISITE_OF' ? 'PREREQUISITE' : 'CONCEPT',
            label: `Target ${link.targetId}`,
          });
          visited.add(link.targetId);
        }
        edges.push({
          source: ko.id,
          target: link.targetId,
          relation: link.relation,
        });
      }

      // If depth >= 2, include systemic outcomes or assessments
      if (depth >= 2) {
        const outcomes = await this.prisma.improvementOutcome.findMany({
          where: { tenantId },
          take: 3,
        });

        for (const out of outcomes) {
          const outcomeNodeId = `out-${out.id}`;
          if (!visited.has(outcomeNodeId)) {
            nodes.push({
              id: outcomeNodeId,
              type: 'OUTCOME',
              label: `${out.metric} (${out.delta >= 0 ? '+' : ''}${(out.delta * 100).toFixed(0)}%)`,
              metadata: { sampleSize: out.sampleSize, classification: out.classification },
            });
            visited.add(outcomeNodeId);
          }
          edges.push({
            source: ko.id,
            target: outcomeNodeId,
            relation: 'EVALUATED_BY',
          });
        }
      }
    } else {
      // Fallback synthetic root if specific ID not found
      nodes.push({
        id: rootId,
        type: 'CONCEPT',
        label: `Entity ${rootId}`,
      });
    }

    return {
      rootId,
      depth,
      nodes,
      edges,
    };
  }
}
