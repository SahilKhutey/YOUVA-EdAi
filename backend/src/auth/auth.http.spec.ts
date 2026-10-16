import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { DEFAULT_THROTTLE } from '../security/throttle-config';

/** Real controller, real AuthService, real login strategy, real throttler and validation pipe; only storage is fake. */
async function buildApp(opts: { existingEmail?: string } = {}) {
  const created: any[] = [];
  const users = {
    create: jest.fn(async (data: any) => {
      if (data.email === opts.existingEmail) throw Object.assign(new Error('dup'), { code: 'P2002' });
      created.push(data);
      return { id: 'u-new', ...data };
    }),
    findOne: jest.fn(async () => null), // nobody exists: every login attempt fails
  };
  const moduleRef = await Test.createTestingModule({
    imports: [PassportModule, ThrottlerModule.forRoot([DEFAULT_THROTTLE])],
    controllers: [AuthController],
    providers: [
      AuthService, LocalStrategy,
      { provide: 'UsersService', useValue: users },
      { provide: APP_GUARD, useClass: ThrottlerGuard },
    ],
  })
    .useMocker((token: any) => {
      if (token?.name === 'UsersService') return users;
      if (token?.name === 'JwtService') return { sign: () => 'signed-token' };
      return {};
    })
    .compile();
  const app: INestApplication = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe());
  await app.init();
  return { app, created, users };
}

describe('POST /auth/register', () => {
  afterEach(() => { delete process.env.ALLOW_PUBLIC_REGISTRATION; });

  it('creates a STUDENT even when the request asks for ADMIN, and ignores other fields', async () => {
    const { app, created } = await buildApp();
    const res = await request(app.getHttpServer()).post('/auth/register')
      .send({ email: 'kid@school.org', password: 'a-long-password', role: 'ADMIN', id: 'forced-id', onboardingComplete: true });
    expect(res.status).toBe(201);
    expect(created[0]).toMatchObject({ email: 'kid@school.org', role: 'STUDENT' });
    expect(created[0]).not.toHaveProperty('id');
    expect(created[0]).not.toHaveProperty('onboardingComplete');
    await app.close();
  });

  it('never returns the password hash', async () => {
    const { app } = await buildApp();
    const res = await request(app.getHttpServer()).post('/auth/register').send({ email: 'kid@school.org', password: 'a-long-password' });
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
    expect(res.body.access_token).toBe('signed-token');
    await app.close();
  });

  it('rejects a bad email, a short password and an over-long password', async () => {
    const { app } = await buildApp();
    const post = (b: any) => request(app.getHttpServer()).post('/auth/register').send(b);
    expect((await post({ email: 'not-an-email', password: 'a-long-password' })).status).toBe(400);
    expect((await post({ email: 'a@b.org', password: 'short' })).status).toBe(400);
    expect((await post({ email: 'a@b.org', password: 'x'.repeat(73) })).status).toBe(400);
    await app.close();
  });

  it('answers 409 for a duplicate email and 403 when registration is closed', async () => {
    const dup = await buildApp({ existingEmail: 'taken@school.org' });
    expect((await request(dup.app.getHttpServer()).post('/auth/register').send({ email: 'taken@school.org', password: 'a-long-password' })).status).toBe(409);
    await dup.app.close();
    process.env.ALLOW_PUBLIC_REGISTRATION = 'false';
    const closed = await buildApp();
    expect((await request(closed.app.getHttpServer()).post('/auth/register').send({ email: 'x@school.org', password: 'a-long-password' })).status).toBe(403);
    expect(closed.users.create).not.toHaveBeenCalled();
    await closed.app.close();
  });

  it('allows 10 sign-ups per minute from one address, then answers 429', async () => {
    const { app } = await buildApp();
    const codes: number[] = [];
    for (let i = 0; i < 12; i++) codes.push((await request(app.getHttpServer()).post('/auth/register').send({ email: `k${i}@school.org`, password: 'a-long-password' })).status);
    expect(codes.slice(0, 10).every((c) => c === 201)).toBe(true);
    expect(codes.slice(10)).toEqual([429, 429]);
    await app.close();
  });
});

describe('POST /auth/login rate limit', () => {
  it('answers 401 for 20 wrong attempts from one address, then 429', async () => {
    const { app } = await buildApp();
    const codes: number[] = [];
    for (let i = 0; i < 22; i++) codes.push((await request(app.getHttpServer()).post('/auth/login').send({ email: 'a@school.org', password: 'wrong' })).status);
    expect(codes.slice(0, 20).every((c) => c === 401)).toBe(true);
    expect(codes.slice(20)).toEqual([429, 429]);
    await app.close();
  });
});
