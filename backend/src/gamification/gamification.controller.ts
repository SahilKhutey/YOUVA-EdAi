import { Controller, Get, UseGuards, Request, Post } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('gamification')
@UseGuards(JwtAuthGuard)
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) { }

  @Get('stats')
  async getStats(@Request() req: any) {
    return this.gamificationService.getUserStats(req.user.userId);
  }

  @Get('badges')
  async getBadges(@Request() req: any) {
    return this.gamificationService.getUserBadges(req.user.userId);
  }

  @Get('badges/list')
  async getBadgesList() {
    return this.gamificationService.getAllBadges();
  }

  @Get('leaderboard')
  async getLeaderboard(@Request() req: any) {
    return this.gamificationService.getLeaderboard(req.user.userId);
  }

  // Temporary endpoint to trigger seeding for testing
  @Post('seed-badges')
  async seedBadges() {
    await this.gamificationService.seedBadges();
    return { message: 'Badges seeded successfully' };
  }
}
