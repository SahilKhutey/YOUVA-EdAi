import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class WorksheetService {
    constructor(private prisma: PrismaService, private aiService: AiService) { }

    async generateWorksheet(teacherId: string, payload: {
        topic: string;
        difficulty: string;
        numberOfQuestions: number;
        questionTypes: string[];
    }) {
        const systemPrompt = `You are an expert teacher creating a worksheet.
Constraints:
- Topic: ${payload.topic}
- Difficulty: ${payload.difficulty}
- Number of Questions: ${payload.numberOfQuestions}
- Accepted Types: ${payload.questionTypes.join(', ')}

Output standard JSON formatting ONLY, no markdown ticks. Supported Types in output: MCQ, SHORT_ANSWER, PROBLEM_SOLVING, DIAGRAM_LABELING, REASONING. 
{
  "title": "Generated Worksheet on ...",
  "questions": [
    {
      "order": 1,
      "type": "MCQ",
      "content": "What is ...?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "Because...",
      "points": 1
    }
  ]
}`;

        try {
            const textResponse = await this.aiService.generateText(systemPrompt);
            const cleaned = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            const generatedJson = JSON.parse(cleaned);

            const worksheet = await this.prisma.worksheet.create({
                data: {
                    teacherId,
                    title: generatedJson.title || `Worksheet: ${payload.topic}`,
                    generationMethod: 'AI_GENERATED',
                    difficulty: payload.difficulty,
                    status: 'DRAFT',
                    questions: {
                        create: generatedJson.questions.map((q: any) => ({
                            order: q.order,
                            type: q.type,
                            content: q.content,
                            options: q.options ? JSON.stringify(q.options) : null,
                            correctAnswer: q.correctAnswer,
                            explanation: q.explanation,
                            points: q.points || 1
                        }))
                    }
                },
                include: { questions: true }
            });

            return worksheet;
        } catch (e) {
            console.error('Failed to generate worksheet', e);
            throw new Error("AI Generation Failed.");
        }
    }

    async getWorksheets(teacherId: string) {
        return this.prisma.worksheet.findMany({
            where: { teacherId },
            include: { questions: { orderBy: { order: 'asc' } } },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getWorksheetById(id: string) {
        return this.prisma.worksheet.findUnique({
            where: { id },
            include: { questions: { orderBy: { order: 'asc' } } }
        });
    }

    async publishWorksheet(id: string) {
        return this.prisma.worksheet.update({
            where: { id },
            data: { status: 'PUBLISHED' }
        });
    }

    async submitWorksheet(studentId: string, worksheetId: string, payload: { answers: { questionId: string, studentAnswer: string }[] }) {
        // 1. Create submission
        const submission = await this.prisma.worksheetSubmission.create({
            data: {
                studentId,
                worksheetId,
                status: 'SUBMITTED',
                answers: {
                    create: payload.answers.map(ans => ({
                        questionId: ans.questionId,
                        studentAnswer: ans.studentAnswer
                    }))
                }
            },
            include: { answers: { include: { question: true } } }
        });

        // 2. Evaluate answers
        let totalPoints = 0;
        let earnedPoints = 0;

        for (const ans of submission.answers) {
            const q = ans.question;
            totalPoints += q.points;
            let isCorrect = false;

            if (q.type === 'MCQ') {
                isCorrect = ans.studentAnswer === q.correctAnswer;
            } else {
                // For SHORT_ANSWER, PROBLEM_SOLVING etc, use AI to evaluate
                const prompt = `Evaluate the student's answer for this question. Question: "${q.content}". Correct Answer/Context: "${q.correctAnswer || q.explanation}". Student Answer: "${ans.studentAnswer}". Output ONLY JSON: { "isCorrect": true/false, "feedback": "brief reasoning" }`;
                try {
                    const aiRes = await this.aiService.generateText(prompt);
                    const parsed = JSON.parse(aiRes.replace(/```json/g, '').replace(/```/g, '').trim());
                    isCorrect = parsed.isCorrect;
                    ans.feedback = parsed.feedback;
                } catch (e) {
                    console.error('AI evaluation failed', e);
                    // fallback to naive match
                    if (q.correctAnswer) isCorrect = ans.studentAnswer.toLowerCase().includes(q.correctAnswer.toLowerCase());
                }
            }

            const pointsAwarded = isCorrect ? q.points : 0;
            earnedPoints += pointsAwarded;

            await this.prisma.worksheetSubmissionAnswer.update({
                where: { id: ans.id },
                data: { isCorrect, pointsAwarded, feedback: ans.feedback }
            });
        }

        const score = (earnedPoints / totalPoints) * 100;
        return this.prisma.worksheetSubmission.update({
            where: { id: submission.id },
            data: { score, status: 'GRADED' },
            include: { answers: true }
        });
    }

    async getSubmission(submissionId: string) {
        return this.prisma.worksheetSubmission.findUnique({
            where: { id: submissionId },
            include: { answers: { include: { question: true } }, worksheet: true }
        });
    }
}
