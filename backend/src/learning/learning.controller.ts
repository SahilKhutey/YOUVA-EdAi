import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { LearningService } from './learning.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('learning')
@UseGuards(JwtAuthGuard)
export class LearningController {
  constructor(private readonly learningService: LearningService) {}

  @Post('start')
  async startSession(@Request() req: any, @Body('topicId') topicId: string) {
    return this.learningService.startSession(req.user.userId, topicId);
  }

  @Post('chat')
  async chat(
    @Request() req: any,
    @Body() body: { sessionId: string; message: string },
  ) {
    return this.learningService.chat(
      body.sessionId,
      req.user.userId,
      body.message,
    );
  }

  @Post('end')
  async endSession(@Request() req: any, @Body('sessionId') sessionId: string) {
    return this.learningService.endSession(sessionId, req.user.userId);
  }

  @Get('history')
  async getHistory(@Request() req: any) {
    return this.learningService.getHistory(req.user.userId);
  }
}
