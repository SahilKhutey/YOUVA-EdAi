import { Controller, Patch, UseGuards, Request, Body, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req: any) {
    return this.usersService.findById(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Request() req: any,
    @Body() body: { name?: string; password?: string; cognitiveLevel?: string; gradeLevel?: string },
  ) {
    return this.usersService.updateProfile(req.user.userId, body);
  }
}
