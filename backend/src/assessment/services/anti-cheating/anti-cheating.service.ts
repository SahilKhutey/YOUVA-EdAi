import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AiService } from '../../../ai/ai.service';

@Injectable()
export class AntiCheatingService {
    constructor(
        private prisma: PrismaService,
        private aiService: AiService
    ) { }

    // Severity Weights for anomalies
    private readonly anomalyWeights = {
        TAB_SWITCH: 15.0,
        FACE_MISSING: 20.0,
        MULTIPLE_FACES: 30.0,
        MOUSE_IRREGULARITY: 5.0,
        RAPID_ANSWER_CHANGE: 10.0,
        PLAGIARISM_FLAG: 40.0,
    };

    async logAnomaly(sessionId: string, anomalyType: string, metadata?: any) {
        const session = await this.prisma.assessmentSession.findUnique({
            where: { id: sessionId },
        });

        if (!session || session.status !== 'ONGOING') {
            throw new NotFoundException('Active assessment session not found');
        }

        const severity = this.anomalyWeights[anomalyType as keyof typeof this.anomalyWeights] || 5.0;

        const log = await this.prisma.integrityLog.create({
            data: {
                sessionId,
                anomalyType,
                severity,
                metadata: metadata ? JSON.stringify(metadata) : null,
            },
        });

        // Update session integrity score
        const newScore = Math.max(0, session.integrityScore - severity);

        await this.prisma.assessmentSession.update({
            where: { id: sessionId },
            data: {
                integrityScore: newScore,
                status: newScore < 50 ? 'FLAGGED' : session.status,
            },
        });

        return log;
    }

    async analyzePlagiarism(sessionId: string, text: string) {
        const prompt = `Analyze the following text for AI generation or severe plagiarism markers. Return a single JSON object with a "score" number representing probability of cheating (0.0 to 1.0) and a "reason" string.\n\nText: "${text}"`;
        try {
            const responseData = await this.aiService.generateText(prompt);
            const cleaned = responseData.replace(/```json/g, '').replace(/```/g, '').trim();
            const result = JSON.parse(cleaned);

            if (result.score && result.score > 0.7) {
                await this.logAnomaly(sessionId, 'PLAGIARISM_FLAG', { textSnippet: text.substring(0, 50), aiScore: result.score, reason: result.reason });
            }
            return result;
        } catch (e) {
            console.warn('NLP Plagiarism Check failed', e);
            return { score: 0, reason: "Analysis failed" };
        }
    }
}
