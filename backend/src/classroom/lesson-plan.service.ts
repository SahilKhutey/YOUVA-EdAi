import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class LessonPlanService {
    constructor(private prisma: PrismaService, private aiService: AiService) { }

    async generateLessonPlan(teacherId: string, payload: {
        subject: string;
        topicName: string;
        studentLevel: string;
        learningObjective: string;
        durationMinutes: number;
        preferredMethod: string;
    }) {
        const systemPrompt = `You are an expert curriculum designer. Generate a structured JSON lesson plan.
Constraints:
- Subject: ${payload.subject}
- Topic: ${payload.topicName}
- Level: ${payload.studentLevel}
- Objective: ${payload.learningObjective}
- Duration: ${payload.durationMinutes} minutes
- Method: ${payload.preferredMethod}

Output standard JSON formatting ONLY, no markdown ticks.
{
  "steps": [
    { "order": 1, "type": "INTRODUCTION", "title": "...", "content": "...", "durationMinutes": 5 },
    { "order": 2, "type": "EXPLANATION", "title": "...", "content": "...", "durationMinutes": 15 }
  ]
}
Supported types: INTRODUCTION, EXPLANATION, EXAMPLE, GUIDED_PRACTICE, WORKSHEET, DISCUSSION, QUIZ, HOMEWORK.`;

        try {
            const textResponse = await this.aiService.generateText(systemPrompt);
            const cleaned = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            const generatedJson = JSON.parse(cleaned);

            const lessonPlan = await this.prisma.lessonPlan.create({
                data: {
                    teacherId,
                    subject: payload.subject,
                    topicName: payload.topicName,
                    studentLevel: payload.studentLevel,
                    learningObjective: payload.learningObjective,
                    durationMinutes: payload.durationMinutes,
                    preferredMethod: payload.preferredMethod,
                    status: 'DRAFT',
                    steps: {
                        create: generatedJson.steps.map((step: any) => ({
                            order: step.order,
                            type: step.type,
                            title: step.title,
                            content: step.content,
                            durationMinutes: step.durationMinutes,
                        }))
                    }
                },
                include: { steps: true }
            });

            return lessonPlan;
        } catch (e) {
            console.error('Failed to generate lesson plan', e);
            throw new Error("AI Generation Failed.");
        }
    }

    async getLessonPlans(teacherId: string) {
        return this.prisma.lessonPlan.findMany({
            where: { teacherId },
            include: { steps: { orderBy: { order: 'asc' } } },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getLessonPlanById(id: string) {
        return this.prisma.lessonPlan.findUnique({
            where: { id },
            include: { steps: { orderBy: { order: 'asc' } } }
        });
    }

    async publishLessonPlan(id: string) {
        return this.prisma.lessonPlan.update({
            where: { id },
            data: { status: 'PUBLISHED' }
        });
    }
}
