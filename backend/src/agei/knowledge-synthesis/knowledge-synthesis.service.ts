import { Injectable } from '@nestjs/common';
import { KnowledgeGraphService } from '../../knowledge-graph/knowledge-graph.service';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Synthesizes knowledge across different domains and topics to create interdisciplinary
 * pedagogical connections (e.g., teaching Mathematics through the lens of Physics or Biology).
 */
@Injectable()
export class KnowledgeSynthesisService {
    constructor(
        private knowledgeGraph: KnowledgeGraphService,
        private prisma: PrismaService,
    ) { }

    /**
     * Looks for overlapping dependencies or shared applications between two subjects/domains
     * to formulate an interdisciplinary project.
     * For example, finding a link between "Linear Algebra" (Math) and "Neural Networks" (Computer Science).
     */
    async discoverCrossDomainLink(domainA: string, domainB: string): Promise<any> {
        // Find nodes where Domain A is an APPLIED_IN target for Domain B, 
        // or where they both share a DEPENDS_ON relationship.

        const nodesInA = await this.prisma.skillNode.findMany({ where: { domain: domainA }, select: { id: true, name: true } });
        const aIds = nodesInA.map(n => n.id);

        const crossDomainEdges = await this.prisma.skillEdge.findMany({
            where: {
                sourceId: { in: aIds },
                targetNode: { domain: domainB },
                relationType: 'APPLIED_IN'
            },
            include: { sourceNode: true, targetNode: true }
        });

        if (crossDomainEdges.length === 0) {
            return null; // No direct explicit graph link found
        }

        // Return the strongest link or a random one for project generation
        return crossDomainEdges[0];
    }
}
