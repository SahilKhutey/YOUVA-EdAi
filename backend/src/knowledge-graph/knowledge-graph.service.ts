import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KnowledgeGraphService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Adds a new skill node to the global knowledge graph.
     */
    async createNode(name: string, type: string, description?: string, domain?: string) {
        return this.prisma.skillNode.create({
            data: {
                name,
                type,
                description,
                domain,
            },
        });
    }

    /**
     * Links two nodes together in the graph.
     */
    async createEdge(sourceName: string, targetName: string, relationType: string, weight: number = 1.0) {
        const sourceNode = await this.prisma.skillNode.findUnique({ where: { name: sourceName } });
        const targetNode = await this.prisma.skillNode.findUnique({ where: { name: targetName } });

        if (!sourceNode || !targetNode) {
            throw new NotFoundException('Source or target node not found in Knowledge Graph');
        }

        const existingEdge = await this.prisma.skillEdge.findFirst({
            where: {
                sourceId: sourceNode.id,
                targetId: targetNode.id,
                relationType,
            },
        });

        if (existingEdge) {
            return this.prisma.skillEdge.update({
                where: { id: existingEdge.id },
                data: { weight },
            });
        }

        return this.prisma.skillEdge.create({
            data: {
                sourceId: sourceNode.id,
                targetId: targetNode.id,
                relationType,
                weight,
            },
        });
    }

    /**
     * Retrieves a subgraph of prerequisites for a given skill.
     * Useful for dynamic curriculum generation.
     */
    async getPrerequisites(nodeName: string) {
        const node = await this.prisma.skillNode.findUnique({
            where: { name: nodeName },
            include: {
                targetEdges: {
                    where: { relationType: 'PREREQUISITE_FOR' },
                    include: { sourceNode: true },
                },
            },
        });

        if (!node) throw new NotFoundException('Node not found');

        // In our semantic, 'A is PREREQUISITE_FOR B'
        // This node means 'targetEdges' are edges pointing TO this node.
        // So 'sourceNode' is the prerequisite (A).
        return node.targetEdges.map(e => ({
            prerequisite: e.sourceNode,
            weight: e.weight
        }));
    }

    /**
     * Gets the entire graph (limited) for visualization or embedding
     */
    async getFullGraph() {
        const nodes = await this.prisma.skillNode.findMany();
        const edges = await this.prisma.skillEdge.findMany();

        return { nodes, edges };
    }
}
