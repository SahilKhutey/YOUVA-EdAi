import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    } else {
      console.warn('GEMINI_API_KEY is not set. AI features will not work.');
    }
  }

  async generateText(prompt: string): Promise<string> {
    if (!this.model) {
      return 'AI service is not configured.';
    }
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating AI content:', error);
      throw new Error('Failed to generate content.');
    }
  }

  async generateQuiz(
    topic: string,
    description: string,
    retries = 3,
  ): Promise<any[]> {
    const prompt = `Generate 5 multiple-choice questions for the topic "${topic}" (${description}). 
    Format the output as a strictly valid JSON array of objects. 
    Each object must have: "content" (string), "options" (array of 4 strings), "correctAnswer" (string, must be one of the options), "explanation" (string).
    Do not include any markdown formatting or code blocks. Just the raw JSON array.`;

    for (let i = 0; i < retries; i++) {
      try {
        const textResponse = await this.generateText(prompt);
        const cleanedResponse = textResponse
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        const json = JSON.parse(cleanedResponse);
        if (Array.isArray(json) && json.length > 0) {
          return json;
        }
      } catch (e) {
        console.warn(`Attempt ${i + 1} failed to generate valid JSON quiz.`, e);
        if (i === retries - 1) throw e;
      }
    }
    return [];
  }

  async chatWithTutor(context: string, userMessage: string): Promise<string> {
    const systemPrompt = `You are an expert Socratic Tutor. Your goal is to guide the student to the answer by asking probing questions, rather than giving the answer directly.
      - Never give the direct answer to a problem unless the student is completely stuck after multiple attempts.
      - Be encouraging and concise.
      - If the student asks a conceptual question, explain it simply using analogies.
      - Context: ${context}
      `;

    const fullPrompt = `${systemPrompt}\nStudent: ${userMessage}\nTutor:`;
    return this.generateText(fullPrompt);
  }
}
