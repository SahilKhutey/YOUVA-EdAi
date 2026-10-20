import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Role } from './role.enum';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

interface LockoutState {
  failedAttempts: number;
  lockedUntil: number | null;
}

export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class AuthService {
  private lockoutMap = new Map<string, LockoutState>();

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) { }

  isAccountLocked(email: string): boolean {
    const key = email.toLowerCase().trim();
    const state = this.lockoutMap.get(key);
    if (!state || !state.lockedUntil) return false;
    if (Date.now() > state.lockedUntil) {
      this.lockoutMap.delete(key);
      return false;
    }
    return true;
  }

  recordFailedAttempt(email: string): void {
    const key = email.toLowerCase().trim();
    const state = this.lockoutMap.get(key) || { failedAttempts: 0, lockedUntil: null };
    state.failedAttempts += 1;
    if (state.failedAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
      state.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    }
    this.lockoutMap.set(key, state);
  }

  resetFailedAttempts(email: string): void {
    const key = email.toLowerCase().trim();
    this.lockoutMap.delete(key);
  }

  getFailedAttempts(email: string): number {
    const key = email.toLowerCase().trim();
    return this.lockoutMap.get(key)?.failedAttempts ?? 0;
  }

  async validateUser(email: string, pass: string): Promise<any> {
    if (this.isAccountLocked(email)) {
      throw new UnauthorizedException('Account is temporarily locked due to too many failed login attempts. Please try again later.');
    }

    const user = await this.usersService.findOne(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      this.resetFailedAttempts(email);
      const { password, ...result } = user;
      return result;
    }

    this.recordFailedAttempt(email);
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
