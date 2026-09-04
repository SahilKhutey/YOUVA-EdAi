import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AiService } from '../../../ai/ai.service';
import { PedagogicalCoreService } from '../../../agei/pedagogical-core/pedagogical-core.service';

@Injectable()
export class PromptOrchestratorService {
    constructor(
        private prisma: PrismaService,
        private aiService: AiService,
        private pedagogicalCore: PedagogicalCoreService,
    ) { }

    async generateContent(payload: {
        teacherId: string;
        topicId?: string;
        type: 'LESSON_PLAN' | 'WORKSHEET' | 'QUIZ' | 'HOMEWORK';
        difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
        targetDuration: number;
        learningObjective: string;
        customTopic?: string;
    }) {
        // Determine Topic Name
        let topicName = payload.customTopic || 'General Education';
        if (payload.topicId) {
            const t = await this.prisma.topic.findUnique({ where: { id: payload.topicId } });
            if (t) topicName = t.title;
        }

        // Determine Bloom's Taxonomy Mapping Baseline
        let bloomsLevel = 'KNOWLEDGE';
        if (payload.type === 'WORKSHEET' || payload.type === 'HOMEWORK') bloomsLevel = 'APPLICATION';
        if (payload.difficulty === 'ADVANCED') bloomsLevel = 'SYNTHESIS';

        // Integrate AGEI Pedagogical Reasoning Core
        // For demonstration, we assume the teacher is generating for themselves or a specific target persona.
        // We use the teacher's ID to fetch a profile. In a real classroom setting, this would be an aggregate.
        const strategy = await this.pedagogicalCore.determineStrategy(payload.teacherId, payload.difficulty === 'ADVANCED' ? 0.9 : 0.5);
        const pedagogicalModifier = await this.pedagogicalCore.getPedagogicalPromptModifier(payload.teacherId, strategy);

        const systemPrompt = `You are an expert, strict curriculum designer building an AI-orchestrated education platform.
    ${pedagogicalModifier}
    
    Generate a JSON object for a ${payload.type} about "${topicName}".
    
    Constraints:
    - Target Duration: ${payload.targetDuration} minutes.
    - Difficulty Level: ${payload.difficulty}.
    - Specific Learning Objective: "${payload.learningObjective}".
    - Bloom's Taxonomy Alignment: Focus on ${bloomsLevel} level outcomes.

    Formatting Requirement:
    - You must output ONLY RAW VALID JSON. No markdown ticks, no conversational text.
    - If LESSON_PLAN: return { title: "...", objective: "...", sections: [{ title: "..", durationMins: X, content: "..." }], summary: "..." }
    - If QUIZ or WORKSHEET: return { title: "...", items: [{ type: "MCQ|OPEN", question: "...", options: [...], correctAnswer: "...", explanation: "..." }] }
    `;

        try {
            const textResponse = await this.aiService.generateText(systemPrompt);
            const cleaned = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            const generatedJson = JSON.parse(cleaned);

            // Save as Draft
            const draft = await this.prisma.generatedContent.create({
                data: {
                    teacherId: payload.teacherId,
                    topicId: payload.topicId || null,
                    type: payload.type,
                    difficulty: payload.difficulty,
                    targetDuration: payload.targetDuration,
                    learningObjective: payload.learningObjective,
                    bloomsTaxonomyLevel: bloomsLevel,
                    content: JSON.stringify(generatedJson),
                    status: 'DRAFT'
                }
            });

            return {
                draftId: draft.id,
                parsedContent: generatedJson
            };

        } catch (e) {
            console.error('Failed to orchestrate prompt', e);
            throw new Error("AI Generation Failed. Could not parse structured JSON.");
        }
    }

    async publishContent(draftId: string, overrides: any) {
        // Overrides allows the teacher to save their edits from the Human Review Panel
        const existing = await this.prisma.generatedContent.findUnique({ where: { id: draftId } });
        if (!existing) throw new NotFoundException('Draft not found');

        return this.prisma.generatedContent.update({
            where: { id: draftId },
            data: {
                content: JSON.stringify(overrides),
                status: 'PUBLISHED'
            }
        });
    }

    async getDrafts(teacherId: string) {
        return this.prisma.generatedContent.findMany({
            where: { teacherId },
            orderBy: { createdAt: 'desc' }
        });
    }
}
