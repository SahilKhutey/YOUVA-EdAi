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
    return this.practiceService.generateQuiz(req.user.userId, topicId);
  }

  @Post('submit')
  async submitQuiz(
    @Request() req: any,
    @Body() body: { sessionId: string; answers: any[] },
  ) {
    return this.practiceService.submitQuiz(
      body.sessionId,
      req.user.userId,
      body.answers,
    );
  }

  @Get('tests')
  async getTests(@Request() req: any) {
    return this.practiceService.getTests(req.user.userId);
  }
}
