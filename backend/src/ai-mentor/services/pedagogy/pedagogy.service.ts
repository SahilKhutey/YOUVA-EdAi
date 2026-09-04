import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface StudentContext {
    cognitiveLevel: string; // 'CHILD', 'TEEN', 'ADULT'
    gradeLevel: string | null;
    mistakes: string[];
}

@Injectable()
export class PedagogyService {
    constructor(private prisma: PrismaService) { }

    async getStudentContext(userId: string, topicId: string): Promise<StudentContext> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        const mistakes = await this.prisma.mistakeLog.findMany({
            where: { userId, topicId, isResolved: false },
        });

        return {
            cognitiveLevel: user?.cognitiveLevel || 'TEEN',
            gradeLevel: user?.gradeLevel || 'Not specified',
            mistakes: mistakes.map((m: any) => m.description),
        };
    }

    buildSystemPrompt(context: StudentContext, topicTitle: string): string {
        let toneInstruction = '';

        switch (context.cognitiveLevel) {
            case 'CHILD':
                toneInstruction = 'Use very simple, encouraging language. Use fun analogies (like toys, animals, or superheroes). Keep sentences short and engaging.';
                break;
            case 'ADULT':
                toneInstruction = 'Use professional, clear, and direct language. Focus on practical applications and deeper underlying principles.';
                break;
            case 'TEEN':
            default:
                toneInstruction = 'Use relatable, supportive language. Use analogies that a high school or middle school student would find interesting (like sports, video games, or pop culture).';
                break;
        }

        let mistakeInstruction = '';
        if (context.mistakes.length > 0) {
            mistakeInstruction = `\nPrior Mistakes to Address: The student previously struggled with: ${context.mistakes.join(', ')}. Pay special attention to guiding them through these specific pitfalls securely.`;
        }

        return `You are a supportive, expert multi-modal AI tutor for a student.
Their Cognitive Level is: ${context.cognitiveLevel}.
Their Grade Level is: ${context.gradeLevel}.

Your Goal: Explain the topic of "${topicTitle}".

Tone & Pedagogical Style:
${toneInstruction}
${mistakeInstruction}

Instructions:
1. Break down the concept step-by-step.
2. Provide a clear, illustrative example.
3. Conclude with a thought-provoking, simple question to check for understanding.
4. Keep your response concise as it may be read aloud by a text-to-speech engine. Format lightly with markdown (bolding key terms).`;
    }
}
