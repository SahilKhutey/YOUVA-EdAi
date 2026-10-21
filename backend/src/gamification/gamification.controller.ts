import { Controller, Get, UseGuards, Request, Post } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { ScopeAuthorizationService } from '../auth/services/scope-authorization.service';

@Controller('gamification')
@UseGuards(JwtAuthGuard)
export class GamificationController {
  constructor(
    private readonly gamificationService: GamificationService,
    private readonly scope: ScopeAuthorizationService,
  ) { }

  @Get('stats')
  async getStats(@Request() req: any) {
    const callerId = req.user.id || req.user.userId;
    return this.gamificationService.getUserStats(callerId);
  }

  @Get('badges')
  async getBadges(@Request() req: any) {
    const callerId = req.user.id || req.user.userId;
    return this.gamificationService.getUserBadges(callerId);
  }

  @Get('badges/list')
  async getBadgesList() {
    return this.gamificationService.getAllBadges();
  }

  @Get('leaderboard')
  async getLeaderboard(@Request() req: any) {
    const callerId = req.user.id || req.user.userId;
    // Students see only their own classmates; teachers see their own students; admins see all students.
    const visible = req.user.role === Role.STUDENT
      ? await this.gamificationService.getClassmateIds(callerId)
      : await this.scope.getScopedStudentIds(callerId);
    return this.gamificationService.getLeaderboard(callerId, visible);
  }

  // Seeds the badge catalogue. Admin only (it used to be open to any logged-in user).
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('seed-badges')
  async seedBadges() {
    await this.gamificationService.seedBadges();
    return { message: 'Badges seeded successfully' };
  }
}
