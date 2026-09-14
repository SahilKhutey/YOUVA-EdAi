import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LearningService } from './learning.service';
import { LearningTransactionService } from './services/learning-transaction.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('learning')
@UseGuards(JwtAuthGuard)
export class LearningController {
  constructor(
    private readonly learningService: LearningService,
    private readonly learningTxService: LearningTransactionService,
  ) {}

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

  // --- Canonical Learning Transaction & Operating Loop (Cycle N2) ---

  @Post('sessions')
  async createLearningSession(@Request() req: any, @Body() body: any) {
    const userId = req.user.id || req.user.userId;
    const topicId = body.topicId || body.subjectId;
    return this.learningTxService.createSession(userId, {
      topicId,
      mode: body.mode || 'practice',
    });
  }

  @Get('sessions')
  async getSessions(@Request() req: any) {
    return this.learningService.getSessions(req.user.id || req.user.userId);
  }

  @Get('sessions/:id')
  async getSession(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.id || req.user.userId;
    const role = req.user.role || 'STUDENT';
    return this.learningTxService.getSession(userId, id, role);
  }

  @Post('sessions/:id/diagnostic')
  async submitDiagnostic(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const userId = req.user.id || req.user.userId;
    return this.learningTxService.processDiagnostic(userId, id, body);
  }

  @Post('sessions/:id/attempts')
  async submitAttempt(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const userId = req.user.id || req.user.userId;
    const attemptReq = {
      learnerId: body.learnerId || userId,
      sessionId: id,
      activityId: body.activityId,
      response: body.response,
      clientAttemptId: body.clientAttemptId,
      timestamp: body.timestamp || new Date().toISOString(),
    };
    return this.learningTxService.processAttempt(userId, attemptReq);
  }

  @Post('attempts')
  @HttpCode(HttpStatus.OK)
  async submitAttemptDirect(
    @Request() req: any,
    @Body() body: any,
  ) {
    const userId = req.user.id || req.user.userId;
    const attemptReq = {
      learnerId: body.learnerId || userId,
      sessionId: body.sessionId,
      activityId: body.activityId,
      response: body.response,
      clientAttemptId: body.clientAttemptId,
      timestamp: body.timestamp || new Date().toISOString(),
    };
    return this.learningTxService.processAttempt(userId, attemptReq);
  }

  @Get('sessions/:id/next')
  async getNextActivity(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.id || req.user.userId;
    return this.learningTxService.getNextActivity(userId, id);
  }

  @Get('sessions/:id/progress')
  async getSessionProgress(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.id || req.user.userId;
    return this.learningTxService.getSessionProgress(userId, id);
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
