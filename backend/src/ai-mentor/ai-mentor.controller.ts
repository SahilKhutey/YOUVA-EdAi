import { Controller, Post, Body, UseGuards, Req, Logger, Get, Param } from '@nestjs/common';
import { PedagogyService } from './services/pedagogy/pedagogy.service';
import { ValidatorService } from './services/validator/validator.service';
import { AiService } from '../ai/ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PremiumGuard } from '../auth/premium.guard';

@Controller('ai-mentor')
export class AiMentorController {
    private readonly logger = new Logger(AiMentorController.name);

    constructor(
        private readonly pedagogyService: PedagogyService,
        private readonly validatorService: ValidatorService,
        private readonly aiService: AiService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('context/:topicId')
    async getContext(@Req() req: any, @Param('topicId') topicId: string) {
        return this.pedagogyService.getStudentContext(req.user.id, topicId);
    }

    @UseGuards(JwtAuthGuard, PremiumGuard)
    @Post('chat')
    async chatWithMentor(
        @Req() req: any,
        @Body() body: { topicId: string; topicTitle: string; message: string; history?: string },
    ) {
        const userId = req.user.id;
        const { topicId, topicTitle, message, history = '' } = body;

        // 1. Gather Context & Build Prompt
        const context = await this.pedagogyService.getStudentContext(userId, topicId);
        const systemPrompt = this.pedagogyService.buildSystemPrompt(context, topicTitle);

        // 2. Query LLM
        const fullPrompt = `${systemPrompt}
    
Chat History:
${history}

Student: ${message}
AI Tutor:`;

        let aiResponse = await this.aiService.generateText(fullPrompt);

        // 3. Validate Response
        const validation = await this.validatorService.validateResponse(aiResponse, context.cognitiveLevel);

        if (!validation.isValid) {
            this.logger.warn(`Response failed validation.Regenerating...`);
            // Simple fallback or generic safe response (could retry generation here in a real app)
            aiResponse = "I'm sorry, I couldn't generate a good response for that right now. Could you please rephrase your question?";
        }

        return {
            message: aiResponse,
            cognitiveLevel: context.cognitiveLevel,
            isValid: validation.isValid,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Post('study-buddy')
    async studyBuddy(
        @Req() req: any,
        @Body() body: { message: string; history?: { role: string; content: string }[] },
    ) {
        const { message, history = [] } = body;

        const historyText = history
            .map((h) => `${h.role === 'user' ? 'Student' : 'AI Tutor'}: ${h.content}`)
            .join('\n');

        const prompt = `You are Youva, a friendly and encouraging AI study buddy for students. 
You help students understand concepts, answer homework questions, explain topics clearly, and keep them motivated.
Be concise, warm, and use simple language appropriate for secondary school students.
If a student asks something unrelated to studying, gently redirect them.

${historyText ? `Chat History:\n${historyText}\n` : ''}
Student: ${message}
AI Tutor:`;

        const aiResponse = await this.aiService.generateText(prompt);

        return { message: aiResponse };
    }
}
