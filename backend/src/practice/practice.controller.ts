import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PracticeService } from './practice.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('practice')
@UseGuards(JwtAuthGuard)
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @Post('generate')
  async generateQuiz(@Request() req: any, @Body('topicId') topicId: string) {
    const studentId = req.user.userId || req.user.id;
    return this.practiceService.generateQuiz(studentId, topicId);
  }

  @Post('submit')
  async submitQuiz(
    @Request() req: any,
    @Body() body: { sessionId: string; answers: any[] },
  ) {
    const studentId = req.user.userId || req.user.id;
    return this.practiceService.submitQuiz(
      body.sessionId,
      studentId,
      body.answers,
    );
  }

  @Get('tests')
  async getTests(@Request() req: any) {
    const studentId = req.user.userId || req.user.id;
    return this.practiceService.getTests(studentId);
  }
}
