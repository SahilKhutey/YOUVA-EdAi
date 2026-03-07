import { Controller, Request, Post, Patch, UseGuards, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req: any) {
    return this.authService.login(req.user);
  }

  @Post('register')
  async register(@Body() user: any) {
    return this.authService.register(user);
  }

  @Patch('complete-onboarding')
  @UseGuards(JwtAuthGuard)
  async completeOnboarding(
    @Request() req: any,
    @Body() body: { weeklyXpTarget?: number; weeklyStudyMinutes?: number },
  ) {
    return this.authService.completeOnboarding(
      req.user.userId,
      body.weeklyXpTarget,
      body.weeklyStudyMinutes,
    );
  }
}
