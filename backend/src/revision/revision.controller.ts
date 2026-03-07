import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { RevisionService } from './revision.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('revision')
@UseGuards(JwtAuthGuard)
export class RevisionController {
  constructor(private readonly revisionService: RevisionService) { }

  @Get('suggestions')
  async getSuggestions(@Request() req: any) {
    return this.revisionService.getRevisionSuggestions(req.user.userId);
  }

  @Post('start')
  async startRevision(@Request() req: any) {
    return this.revisionService.startRevisionSession(req.user.userId);
  }
  @Get('schedule')
  async getSchedule(@Request() req: any) {
    return this.revisionService.getScheduledRevisions(req.user.userId);
  }
}
