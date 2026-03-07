import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) { }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async register(user: any) {
    const newUser = await this.usersService.create(user);
    return this.login(newUser);
  }

  async completeOnboarding(
    userId: string,
    weeklyXpTarget?: number,
    weeklyStudyMinutes?: number,
  ) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingComplete: true },
      select: { id: true, name: true, email: true, role: true, onboardingComplete: true },
    });

    if (weeklyXpTarget && weeklyStudyMinutes) {
      await this.prisma.studyGoal.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });
      await this.prisma.studyGoal.create({
        data: { userId, weeklyXpTarget, weeklyStudyMinutes, isActive: true },
      });
    }

    return updated;
  }
}
