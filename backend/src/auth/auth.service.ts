import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from './role.enum';
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

  /**
   * Public sign-up. Always creates a STUDENT: the role is never taken from the request, so nobody can
   * register themselves as a teacher or admin. Staff accounts are created with `npm run create:user`.
   */
  async register(dto: { email: string; password: string; name?: string; gradeLevel?: string }) {
    if ((process.env.ALLOW_PUBLIC_REGISTRATION ?? 'true').toLowerCase() === 'false') {
      throw new ForbiddenException('Registration is closed. Please ask your teacher for an account.');
    }
    let newUser: any;
    try {
      newUser = await this.usersService.create({
        email: dto.email.trim(),
        password: dto.password,
        name: dto.name?.trim() || null,
        gradeLevel: dto.gradeLevel?.trim() || null,
        role: Role.STUDENT,
      } as any);
    } catch (e: any) {
      if (e?.code === 'P2002') throw new ConflictException('An account with this email already exists.');
      throw e;
    }
    const { password, ...safeUser } = newUser; // never return the password hash
    return this.login(safeUser);
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
