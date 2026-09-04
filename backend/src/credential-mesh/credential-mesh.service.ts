import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KnowledgeGraphService } from '../knowledge-graph/knowledge-graph.service';
import * as crypto from 'crypto';

/**
 * Issues blockchain-ready skill credentials for verified knowledge nodes.
 */
@Injectable()
export class CredentialMeshService {
    constructor(
        private prisma: PrismaService,
        private knowledgeGraph: KnowledgeGraphService
    ) { }

    /**
     * Mints a new credential for a student upon verifying an assessment project.
     */
    async issueCredential(userId: string, skillNodeId: string, validationScore: number) {
        if (validationScore < 0.8) {
            throw new BadRequestException('Validation score too low to issue a credential. Must be >= 0.8');
        }

        // Generate a placeholder "hash" for the blockchain integration
        // In a real Web3 environment, this would call a smart contract.
        const rawData = `${userId}-${skillNodeId}-${Date.now()}-${validationScore}`;
        const mockBlockchainHash = '0x' + Buffer.from(rawData).toString('hex'); // Simple mock

        return this.prisma.skillCredential.upsert({
            where: {
                userId_skillNodeId: {
                    userId,
                    skillNodeId
                }
            },
            update: {
                validationScore: validationScore > 0.95 ? 1.0 : validationScore, // Cap or upgrade
                issuedAt: new Date()
            },
            create: {
                userId,
                skillNodeId,
                validationScore,
                blockchainHash: mockBlockchainHash
            }
        });
    }

    /**
     * Retrieves a student's fully verified credential graph.
     */
    async getStudentCredentials(userId: string) {
        return this.prisma.skillCredential.findMany({
            where: { userId },
            include: { skillNode: true }
        });
    }
}
