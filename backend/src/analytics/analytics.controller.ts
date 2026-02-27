import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  async getSummary(@Request() req: any) {
    return this.analyticsService.getSummary(req.user.userId);
  }

  @Get('dashboard-stats')
  async getDashboardStats(@Request() req: any) {
    return this.analyticsService.getDashboardStats(req.user.userId);
  }

  @Get('weak-topics')
  async getWeakTopics(@Request() req: any) {
    return this.analyticsService.getWeakTopics(req.user.userId);
  }

  @Get('upcoming-tests')
  async getUpcomingTests(@Request() req: any) {
    return this.analyticsService.getUpcomingTests(req.user.userId);
  }

  @Get('recommendations')
  async getRecommendations(@Request() req: any) {
    return this.analyticsService.getRecommendations(req.user.userId);
  }

  @Get('ai-report')
  async getAiReport(@Request() req: any) {
    return this.analyticsService.generateAIPerformanceReport(req.user.userId);
  }
}
