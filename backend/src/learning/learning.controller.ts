import {
  Controller,
  Post,
  Get,
  Body,
  Param,
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
    return this.learningService.getHistory(req.user.id || req.user.userId);
  }

  // --- Phase P2 Student Operations Endpoints ---

  @Get('today')
  async getToday(@Request() req: any) {
    return this.learningService.getToday(req.user.id || req.user.userId);
  }

  @Get('sessions')
  async getSessions(@Request() req: any) {
    return this.learningService.getSessions(req.user.id || req.user.userId);
  }

  @Get('sessions/:id')
  async getSession(@Request() req: any, @Param('id') id: string) {
    return this.learningService.getSession(req.user.id || req.user.userId, id);
  }

  @Get('recommendations')
  async getRecommendations(@Request() req: any) {
    return this.learningService.getRecommendations(req.user.id || req.user.userId);
  }

  @Get('mastery')
  async getMastery(@Request() req: any) {
    return this.learningService.getMastery(req.user.id || req.user.userId);
  }
}
