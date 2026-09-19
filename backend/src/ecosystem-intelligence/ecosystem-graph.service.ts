import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  EcosystemNode,
  EcosystemNodeType,
  EcosystemEdge,
  EdgeRelationshipType,
  EdgeStatus,
} from './n21-types';

@Injectable()
export class EcosystemGraphService {
  private nodes: Map<string, EcosystemNode> = new Map();
  private edges: Map<string, EcosystemEdge> = new Map();

  constructor() {
    this.seedInitialEcosystemGraph();
  }

  private seedInitialEcosystemGraph(): void {
    const seedNodes: EcosystemNode[] = [
      {
        id: 'node-inst-dps-01',
        type: 'INSTITUTION',
        label: 'Delhi Public School R.K. Puram',
        organizationId: 'org-dps-rkp',
        metadata: { jurisdiction: 'IN-DL', accreditedBy: 'CBSE' },
        createdAt: new Date().toISOString(),
      },
      {
        id: 'node-prog-ai-01',
        type: 'PROGRAM',
        label: 'Advanced AI & Computational Thinking Program',
        organizationId: 'org-dps-rkp',
        metadata: { gradeLevel: '11-12', durationWeeks: 36 },
        createdAt: new Date().toISOString(),
      },
      {
        id: 'node-teacher-sharma-01',
        type: 'TEACHER',
        label: 'Dr. Ramesh Sharma (Senior Computer Science)',
        organizationId: 'org-dps-rkp',
        metadata: { verifiedEducator: true },
        createdAt: new Date().toISOString(),
      },
      {
        id: 'node-learner-alex-01',
        type: 'LEARNER',
        label: 'Alex Mercer (Grade 12)',
        organizationId: 'org-dps-rkp',
        metadata: { anonymizedId: 'anon-alex-789' },
        createdAt: new Date().toISOString(),
      },
      {
        id: 'node-issuer-mit-01',
        type: 'ISSUER',
        label: 'MIT Center for Computational Science',
        organizationId: 'org-mit-ccs',
        metadata: { did: 'did:web:mit.edu:credentials' },
        createdAt: new Date().toISOString(),
      },
      {
        id: 'node-cred-dist-sys-01',
        type: 'CREDENTIAL',
        label: 'Verified Distributed Systems Architect Credential',
        organizationId: 'org-mit-ccs',
        metadata: { standard: 'W3C_VC_2_0', openBadges: '3.0' },
        createdAt: new Date().toISOString(),
      },
      {
        id: 'node-opp-zkp-res-01',
        type: 'OPPORTUNITY',
        label: 'Zero-Knowledge Protocol Research Residency',
        organizationId: 'org-zk-foundation',
        metadata: { opportunityType: 'RESEARCH', remote: true },
        createdAt: new Date().toISOString(),
      },
    ];

    for (const node of seedNodes) {
      this.nodes.set(node.id, node);
    }

    const seedEdges: EcosystemEdge[] = [
      {
        id: 'edge-1',
        sourceId: 'node-inst-dps-01',
        targetId: 'node-prog-ai-01',
        relationshipType: 'ISSUES',
        authority: 'org-dps-rkp',
        confidence: 1.0,
        scope: 'INSTITUTION:DPS-RKP',
        status: 'SUPPORTED',
        version: 1,
        timestamp: new Date().toISOString(),
      },
      {
        id: 'edge-2',
        sourceId: 'node-learner-alex-01',
        targetId: 'node-prog-ai-01',
        relationshipType: 'ENROLLED_IN',
        authority: 'org-dps-rkp',
        confidence: 0.95,
        scope: 'INSTITUTION:DPS-RKP',
        status: 'SUPPORTED',
        version: 1,
        timestamp: new Date().toISOString(),
      },
      {
        id: 'edge-3',
        sourceId: 'node-teacher-sharma-01',
        targetId: 'node-learner-alex-01',
        relationshipType: 'VALIDATES',
        authority: 'org-dps-rkp',
        confidence: 0.9,
        scope: 'INSTITUTION:DPS-RKP',
        status: 'SUPPORTED',
        version: 1,
        timestamp: new Date().toISOString(),
      },
      {
        id: 'edge-4',
        sourceId: 'node-issuer-mit-01',
        targetId: 'node-cred-dist-sys-01',
        relationshipType: 'ISSUES',
        authority: 'org-mit-ccs',
        confidence: 1.0,
        scope: 'GLOBAL',
        status: 'SUPPORTED',
        version: 1,
        timestamp: new Date().toISOString(),
      },
      {
        id: 'edge-5',
        sourceId: 'node-opp-zkp-res-01',
        targetId: 'node-cred-dist-sys-01',
        relationshipType: 'REQUIRES',
        authority: 'org-zk-foundation',
        confidence: 0.85,
        scope: 'GLOBAL',
        status: 'PROBABLE',
        version: 1,
        timestamp: new Date().toISOString(),
      },
    ];

    for (const edge of seedEdges) {
      this.edges.set(edge.id, edge);
    }
  }

  // --- Node Management ---

  public addNode(dto: {
    id?: string;
    type: EcosystemNodeType;
    label: string;
    organizationId: string;
    metadata?: Record<string, any>;
  }): EcosystemNode {
    if (!dto.type || !dto.label || !dto.organizationId) {
      throw new BadRequestException('Node type, label, and organizationId are required');
    }

    const id = dto.id || `node-${dto.type.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    if (this.nodes.has(id)) {
      throw new BadRequestException(`Node with ID ${id} already exists`);
    }

    const node: EcosystemNode = {
      id,
      type: dto.type,
      label: dto.label,
      organizationId: dto.organizationId,
      metadata: dto.metadata || {},
      createdAt: new Date().toISOString(),
    };

    this.nodes.set(id, node);
    return node;
  }

  public getNode(id: string): EcosystemNode {
    const node = this.nodes.get(id);
    if (!node) {
      throw new NotFoundException(`Ecosystem Node with ID ${id} not found`);
    }
    return node;
  }

  public listNodes(type?: EcosystemNodeType, organizationId?: string): EcosystemNode[] {
    let list = Array.from(this.nodes.values());
    if (type) {
      list = list.filter((n) => n.type === type);
    }
    if (organizationId) {
      list = list.filter((n) => n.organizationId === organizationId);
    }
    return list;
  }

  // --- Edge & Governed Relationship Management ---

  public addEdge(dto: {
    sourceId: string;
    targetId: string;
    relationshipType: EdgeRelationshipType;
    authority: string;
    confidence: number;
    scope: string;
    status?: EdgeStatus;
  }): EcosystemEdge {
    if (!dto.sourceId || !dto.targetId || !dto.relationshipType || !dto.authority) {
      throw new BadRequestException('Source, target, relationshipType, and authority are required');
    }

    // Verify both nodes exist
    this.getNode(dto.sourceId);
    this.getNode(dto.targetId);

    const confidence = Math.min(1.0, Math.max(0.0, dto.confidence));
    const id = `edge-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const edge: EcosystemEdge = {
      id,
      sourceId: dto.sourceId,
      targetId: dto.targetId,
      relationshipType: dto.relationshipType,
      authority: dto.authority,
      confidence,
      scope: dto.scope || 'GLOBAL',
      status: dto.status || 'SUPPORTED',
      version: 1,
      timestamp: new Date().toISOString(),
    };

    this.edges.set(id, edge);
    return edge;
  }

  public getEdge(id: string): EcosystemEdge {
    const edge = this.edges.get(id);
    if (!edge) {
      throw new NotFoundException(`Ecosystem Edge with ID ${id} not found`);
    }
    return edge;
  }

  public listEdges(sourceId?: string, targetId?: string, status?: EdgeStatus): EcosystemEdge[] {
    let list = Array.from(this.edges.values());
    if (sourceId) {
      list = list.filter((e) => e.sourceId === sourceId);
    }
    if (targetId) {
      list = list.filter((e) => e.targetId === targetId);
    }
    if (status) {
      list = list.filter((e) => e.status === status);
    }
    return list;
  }

  public updateEdgeStatus(id: string, status: EdgeStatus, note?: string): EcosystemEdge {
    const edge = this.getEdge(id);
    edge.status = status;
    edge.version += 1;
    edge.timestamp = new Date().toISOString();
    this.edges.set(id, edge);
    return edge;
  }

  public recordDispute(edgeId: string, disputingAuthority: string, reason: string): EcosystemEdge {
    const edge = this.getEdge(edgeId);
    edge.status = 'DISPUTED';
    edge.version += 1;
    edge.timestamp = new Date().toISOString();
    this.edges.set(edgeId, edge);
    return edge;
  }

  public getLineageTrail(nodeId: string): {
    node: EcosystemNode;
    inboundEdges: EcosystemEdge[];
    outboundEdges: EcosystemEdge[];
  } {
    const node = this.getNode(nodeId);
    const inbound = Array.from(this.edges.values()).filter((e) => e.targetId === nodeId);
    const outbound = Array.from(this.edges.values()).filter((e) => e.sourceId === nodeId);

    return {
      node,
      inboundEdges: inbound,
      outboundEdges: outbound,
    };
  }
}
