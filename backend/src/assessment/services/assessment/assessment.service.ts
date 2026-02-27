import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AiService } from '../../../ai/ai.service';

@Injectable()
export class AssessmentService {
    constructor(
        private prisma: PrismaService,
        private aiService: AiService,
    ) { }

    async generateAssessment(userId: string, topicId: string) {
        const topic = await this.prisma.topic.findUnique({ where: { id: topicId } });
        if (!topic) throw new NotFoundException('Topic not found');

        // Create session
        const session = await this.prisma.assessmentSession.create({
            data: {
                userId,
                topicId,
            }
        });

        // Generate randomized questions specifically for this secure assessment
        const prompt = `Generate a high-security certification-style exam of 5 multiple-choice questions for the topic "${topic.title}" (${topic.description || ''}). 
      Ensure questions are extremely randomized and distinct from standard practice banks.
      Format the output as a strictly valid JSON array of objects.
      Each object must have: "content" (string), "options" (array of 4 strings), "correctAnswer" (string, must be one of the options), "explanation" (string).
      Do not include any markdown formatting or code blocks. Just the raw JSON array.`;

        let questions = [];
        try {
            const textResponse = await this.aiService.generateText(prompt);
            const cleanedResponse = textResponse
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .trim();
            questions = JSON.parse(cleanedResponse);
        } catch (e) {
            // fallback
            questions = await this.aiService.generateQuiz(topic.title, topic.description || '');
        }

        return {
            session,
            questions,
        };
    }

    async submitAssessment(sessionId: string, userId: string, answers: any[]) {
        const session = await this.prisma.assessmentSession.findUnique({ where: { id: sessionId } });
        if (!session || session.userId !== userId) throw new NotFoundException('Session not found');

        const updatedSession = await this.prisma.assessmentSession.update({
            where: { id: sessionId },
            data: {
                status: session.integrityScore < 50 ? 'FLAGGED' : 'COMPLETED',
                endTime: new Date(),
            }
        });

        // Calculate score
        let correctCount = 0;
        for (const ans of answers) {
            if (ans.isCorrect) correctCount++;
        }
        const score = (correctCount / Math.max(answers.length, 1)) * 100;

        return { session: updatedSession, score };
    }
}
