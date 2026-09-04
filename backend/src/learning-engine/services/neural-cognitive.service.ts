import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NeuralCognitiveService {
    private readonly logger = new Logger(NeuralCognitiveService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Initializes or retrieves a user's Skill Node.
     */
    async getUserSkillNode(userId: string, skillNodeId: string) {
        let node = await this.prisma.userSkillNode.findUnique({
            where: { userId_skillNodeId: { userId, skillNodeId } }
        });

        if (!node) {
            node = await this.prisma.userSkillNode.create({
                data: { userId, skillNodeId }
            });
        }
        return node;
    }

    /**
     * Records real-time cognitive state variables based on in-app telemetry.
     */
    async logCognitiveState(userId: string, data: {
        cognitiveLoad: number;
        stepComplexity: number;
        retrievalStrength: number;
        attentionSwitching: number;
        impulseControl: number;
        errorClusterScore: number;
    }) {
        // Simple inference heuristic
        let inferredState = 'flow';
        if (data.cognitiveLoad > 0.8 && data.errorClusterScore > 0.7) {
            inferredState = 'confusion';
        } else if (data.cognitiveLoad > 0.7 && data.attentionSwitching < 0.3) {
            inferredState = 'fatigue';
        } else if (data.retrievalStrength > 0.9 && data.cognitiveLoad < 0.3) {
            inferredState = 'surface_memorization';
        } else if (data.retrievalStrength > 0.8 && data.stepComplexity > 0.8) {
            inferredState = 'deep_understanding';
        }

        const log = await this.prisma.cognitiveStateLog.create({
            data: {
                userId,
                ...data,
                inferredState,
            }
        });

        this.logger.log(`Cognitive state logged for ${userId}: ${inferredState}`);
        return log;
    }

    /**
     * Hebbian Learning Application: "Neurons that fire together, wire together."
     * Updates the connection weight between two domains based on transfer success.
     */
    async updateHebbianConnection(userId: string, sourceId: string, targetId: string, success: boolean) {
        const sourceUserNode = await this.getUserSkillNode(userId, sourceId);
        const targetUserNode = await this.getUserSkillNode(userId, targetId);

        let edge = await this.prisma.userSkillEdge.findUnique({
            where: { userId_sourceId_targetId: { userId, sourceId: sourceUserNode.id, targetId: targetUserNode.id } }
        });

        if (!edge) {
            edge = await this.prisma.userSkillEdge.create({
                data: { userId, sourceId: sourceUserNode.id, targetId: targetUserNode.id, connectionWeight: 0.1 }
            });
        }

        // Adjust connection weight based on Hebbian principles
        const learningRate = 0.05;
        const decayRate = 0.02;

        let newWeight = edge.connectionWeight;
        let newSuccesses = edge.transferSuccesses;

        if (success) {
            newWeight = Math.min(1.0, newWeight + learningRate * (1 - newWeight));
            newSuccesses += 1;

            // Also bump application flexibility
            await this.prisma.userSkillNode.update({
                where: { id: sourceUserNode.id },
                data: { applicationFlexibilityScore: Math.min(1.0, sourceUserNode.applicationFlexibilityScore + 0.02) }
            });
        } else {
            // Unsuccessful transfer slowly decays the connection
            newWeight = Math.max(0.0, newWeight - decayRate);
        }

        const updatedEdge = await this.prisma.userSkillEdge.update({
            where: { id: edge.id },
            data: { connectionWeight: newWeight, transferSuccesses: newSuccesses }
        });

        this.logger.log(`Updated Hebbian connection ${sourceId}->${targetId} for ${userId} to ${newWeight}`);
        return updatedEdge;
    }
}
