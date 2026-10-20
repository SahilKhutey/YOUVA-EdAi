import { Test, TestingModule } from '@nestjs/testing';
import { AuthService, MAX_FAILED_LOGIN_ATTEMPTS } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: { findOne: jest.Mock; create: jest.Mock };
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    usersService = {
      findOne: jest.fn(),
      create: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).useMocker(() => ({})).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('validates user successfully with correct password', async () => {
    const hashedPassword = await bcrypt.hash('secretPass123', 10);
    usersService.findOne.mockResolvedValue({
      id: 'u-1',
      email: 'student@example.org',
      password: hashedPassword,
      role: 'STUDENT',
    });

    const validated = await service.validateUser('student@example.org', 'secretPass123');
    expect(validated).toBeDefined();
    expect(validated.id).toBe('u-1');
    expect(validated.password).toBeUndefined();
    expect(service.getFailedAttempts('student@example.org')).toBe(0);
  });

  it('returns null and records failed attempt on incorrect password', async () => {
    const hashedPassword = await bcrypt.hash('secretPass123', 10);
    usersService.findOne.mockResolvedValue({
      id: 'u-1',
      email: 'student@example.org',
      password: hashedPassword,
      role: 'STUDENT',
    });

    const validated = await service.validateUser('student@example.org', 'wrongPass');
    expect(validated).toBeNull();
    expect(service.getFailedAttempts('student@example.org')).toBe(1);
  });

  it('locks account after 5 consecutive failed login attempts', async () => {
    const hashedPassword = await bcrypt.hash('secretPass123', 10);
    usersService.findOne.mockResolvedValue({
      id: 'u-1',
      email: 'student@example.org',
      password: hashedPassword,
      role: 'STUDENT',
    });

    for (let i = 0; i < MAX_FAILED_LOGIN_ATTEMPTS; i++) {
      await service.validateUser('student@example.org', 'wrongPass');
    }

    expect(service.isAccountLocked('student@example.org')).toBe(true);

    // 6th attempt should throw UnauthorizedException for account lockout
    await expect(service.validateUser('student@example.org', 'secretPass123')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('resets failed attempts upon successful login', async () => {
    const hashedPassword = await bcrypt.hash('secretPass123', 10);
    usersService.findOne.mockResolvedValue({
      id: 'u-1',
      email: 'student@example.org',
      password: hashedPassword,
      role: 'STUDENT',
    });

    // 2 failed attempts
    await service.validateUser('student@example.org', 'wrong1');
    await service.validateUser('student@example.org', 'wrong2');
    expect(service.getFailedAttempts('student@example.org')).toBe(2);

    // 1 successful attempt
    const validated = await service.validateUser('student@example.org', 'secretPass123');
    expect(validated).toBeDefined();
    expect(service.getFailedAttempts('student@example.org')).toBe(0);
  });
});
