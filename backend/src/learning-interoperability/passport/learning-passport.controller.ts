import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { LearningPassportService } from './learning-passport.service';
import { PassportAchievementDto } from './passport.types';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
    sub?: string;
    userId?: string;
    tenantId?: string;
    role?: string;
  };
}

@Controller(['api/v1/learning-passport', 'v1/learning-passport', 'learning-passport'])
export class LearningPassportController {
  constructor(
    private readonly passportService: LearningPassportService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyPassport(@Req() req: AuthenticatedRequest) {
    const learnerId = req.user?.sub || req.user?.userId || req.user?.id;
    const tenantId = req.user?.tenantId || 'default-tenant';
    if (!learnerId) {
      throw new ForbiddenException('User authentication required.');
    }
    return this.passportService.getOrCreatePassport(learnerId, 'YOUVA-Global', tenantId);
  }

  @Get('achievements')
  @UseGuards(JwtAuthGuard)
  async getAchievements(@Req() req: AuthenticatedRequest) {
    const learnerId = req.user?.sub || req.user?.userId || req.user?.id;
    if (!learnerId) throw new ForbiddenException('User authentication required.');
    const passport = await this.passportService.getPassport(learnerId);
    if (!passport) return [];
    return this.passportService.getAchievements(passport.id);
  }

  @Post('achievements')
  @UseGuards(JwtAuthGuard)
  async addAchievement(
    @Req() req: AuthenticatedRequest,
    @Body() dto: PassportAchievementDto,
  ) {
    const learnerId = req.user?.sub || req.user?.userId || req.user?.id;
    if (!learnerId) throw new ForbiddenException('User authentication required.');
    const passport = await this.passportService.getOrCreatePassport(learnerId);
    return this.passportService.addAchievement(passport.id, dto);
  }

  @Get('competencies')
  @UseGuards(JwtAuthGuard)
  async getCompetencies(@Req() req: AuthenticatedRequest) {
    const learnerId = req.user?.sub || req.user?.userId || req.user?.id;
    if (!learnerId) throw new ForbiddenException('User authentication required.');
    const passport = await this.passportService.getPassport(learnerId);
    if (!passport) return [];
    const achievements = await this.passportService.getAchievements(passport.id);
    return achievements.filter((a: any) => a.achievementType === 'COMPETENCY');
  }

  @Get('credentials')
  @UseGuards(JwtAuthGuard)
  async getCredentials(@Req() req: AuthenticatedRequest) {
    const learnerId = req.user?.sub || req.user?.userId || req.user?.id;
    if (!learnerId) throw new ForbiddenException('User authentication required.');
    const passport = await this.passportService.getPassport(learnerId);
    if (!passport) return [];
    const achievements = await this.passportService.getAchievements(passport.id);
    return achievements.filter((a: any) => a.achievementType === 'CREDENTIAL');
  }

  @Get('export')
  @UseGuards(JwtAuthGuard)
  async exportPassport(@Req() req: AuthenticatedRequest) {
    const learnerId = req.user?.sub || req.user?.userId || req.user?.id;
    if (!learnerId) throw new ForbiddenException('User authentication required.');
    return this.passportService.exportPassport(learnerId);
  }

  @Post('revoke')
  @UseGuards(JwtAuthGuard)
  async revokePassport(@Req() req: AuthenticatedRequest) {
    const learnerId = req.user?.sub || req.user?.userId || req.user?.id;
    if (!learnerId) throw new ForbiddenException('User authentication required.');
    const passport = await this.passportService.getPassport(learnerId);
    if (!passport) throw new NotFoundException('Passport not found');
    return { status: 'REVOKED', learnerId };
  }
}
