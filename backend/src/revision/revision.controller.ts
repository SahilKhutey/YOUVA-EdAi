import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { RevisionService } from './revision.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('revision')
@UseGuards(JwtAuthGuard)
export class RevisionController {
  constructor(private readonly revisionService: RevisionService) { }

  @Get('suggestions')
  async getSuggestions(@Request() req: any) {
    const studentId = req.user.userId || req.user.id;
    return this.revisionService.getRevisionSuggestions(studentId);
  }

  @Post('start')
  async startRevision(@Request() req: any) {
    const studentId = req.user.userId || req.user.id;
    return this.revisionService.startRevisionSession(studentId);
  }

  @Get('schedule')
  async getSchedule(@Request() req: any) {
    const studentId = req.user.userId || req.user.id;
    return this.revisionService.getScheduledRevisions(studentId);
  }
}
