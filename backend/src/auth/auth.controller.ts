import { Controller, Request, Post, Patch, UseGuards, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { RegisterDto } from './dto/register.dto';
import { LOGIN_THROTTLE, REGISTER_THROTTLE } from '../security/throttle-config';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Throttle(LOGIN_THROTTLE)
  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req: any) {
    return this.authService.login(req.user);
  }

  @Throttle(REGISTER_THROTTLE)
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
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
