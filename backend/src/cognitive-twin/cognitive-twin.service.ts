import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CognitiveTwinService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Retrieves or creates a cognitive profile for a given user.
     */
    async getProfile(userId: string) {
        let profile = await this.prisma.cognitiveProfile.findUnique({
            where: { userId },
        });

        if (!profile) {
            // Create a default profile
            profile = await this.prisma.cognitiveProfile.create({
                data: {
                    userId,
                    skillGenome: JSON.stringify({ "Logical Reasoning": 0.5, "Creativity": 0.5 }),
                },
            });
        }

        return profile;
    }

    /**
     * Updates specific traits of the cognitive profile.
     * e.g., when a user answers questions faster, memory retention might be high.
     */
    async updateProfile(userId: string, data: {
        learningVelocityIndex?: number;
        skillGenomeDelta?: Record<string, number>;
        attentionSpanDelta?: number;
        memoryRetentionRate?: number;
        ethicalAlignmentScore?: number;
    }) {
        const profile = await this.getProfile(userId);

        let updatedSkillGenome = JSON.parse(profile.skillGenome || '{}');
        if (data.skillGenomeDelta) {
            for (const [skill, delta] of Object.entries(data.skillGenomeDelta)) {
                updatedSkillGenome[skill] = Math.min(1.0, Math.max(0.0, (updatedSkillGenome[skill] || 0) + delta));
            }
        }

        return this.prisma.cognitiveProfile.update({
            where: { userId },
            data: {
                learningVelocityIndex: data.learningVelocityIndex ?? profile.learningVelocityIndex,
                skillGenome: JSON.stringify(updatedSkillGenome),
                attentionSpan: data.attentionSpanDelta ? profile.attentionSpan + data.attentionSpanDelta : profile.attentionSpan,
                memoryRetentionRate: data.memoryRetentionRate ?? profile.memoryRetentionRate,
                ethicalAlignmentScore: data.ethicalAlignmentScore ?? profile.ethicalAlignmentScore,
            },
        });
    }
}
