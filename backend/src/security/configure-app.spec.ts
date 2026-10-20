import { Body, Controller, Get, INestApplication, Post } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { IsString } from 'class-validator';
import request from 'supertest';
import { configureApp } from './configure-app';

class PingDto {
  @IsString()
  msg: string;
}

@Controller('ping')
class PingController {
  @Get() ping() { return { ok: true }; }
  @Post() create(@Body() body: PingDto) { return { received: body }; }
}

async function build(env: NodeJS.ProcessEnv): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ controllers: [PingController] }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>();
  const saved = { c: process.env.CORS_ORIGINS, f: process.env.FRONTEND_URL };
  process.env.CORS_ORIGINS = env.CORS_ORIGINS ?? ''; process.env.FRONTEND_URL = env.FRONTEND_URL ?? '';
  configureApp(app, env);
  if (saved.c === undefined) delete process.env.CORS_ORIGINS; else process.env.CORS_ORIGINS = saved.c;
  if (saved.f === undefined) delete process.env.FRONTEND_URL; else process.env.FRONTEND_URL = saved.f;
  await app.init();
  return app;
}

describe('configureApp (what the real server uses)', () => {
  it('sends security headers and hides the framework banner', async () => {
    const app = await build({});
    const res = await request(app.getHttpServer()).get('/ping');
    expect(res.status).toBe(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
    expect(res.headers['strict-transport-security']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
    await app.close();
  });

  it('allows only the configured browser origin (FRONTEND_URL when CORS_ORIGINS is unset)', async () => {
    const app = await build({ FRONTEND_URL: 'https://app.example.org' });
    const ok = await request(app.getHttpServer()).get('/ping').set('Origin', 'https://app.example.org');
    const bad = await request(app.getHttpServer()).get('/ping').set('Origin', 'https://evil.example.com');
    expect(ok.headers['access-control-allow-origin']).toBe('https://app.example.org');
    expect(bad.headers['access-control-allow-origin']).toBeUndefined();
    const pre = await request(app.getHttpServer()).options('/ping').set('Origin', 'https://app.example.org').set('Access-Control-Request-Method', 'POST');
    expect(pre.headers['access-control-allow-methods']).toMatch(/POST/);
    await app.close();
  });

  it('serves routes at the root by default and under /api when API_PREFIX=api (what render.yaml needs)', async () => {
    const root = await build({});
    expect((await request(root.getHttpServer()).get('/ping')).status).toBe(200);
    expect((await request(root.getHttpServer()).get('/api/ping')).status).toBe(404);
    await root.close();
    const prefixed = await build({ API_PREFIX: 'api' });
    expect((await request(prefixed.getHttpServer()).get('/api/ping')).status).toBe(200);
    expect((await request(prefixed.getHttpServer()).get('/ping')).status).toBe(404);
    await prefixed.close();
  });

  it('refuses to start with an invalid setting instead of silently running unprotected', async () => {
    await expect(build({ TRUST_PROXY_HOPS: '9' })).rejects.toThrow(/TRUST_PROXY_HOPS/);
    await expect(build({ API_PREFIX: 'a/b' })).rejects.toThrow(/API_PREFIX/);
  });

  it('strips unknown body fields via global validation pipe whitelist', async () => {
    const app = await build({});
    const res = await request(app.getHttpServer()).post('/ping').send({ msg: 'hello', maliciousExtraField: 'bad' });
    expect(res.status).toBe(201);
    expect(res.body.received).toEqual({ msg: 'hello' });
    expect(res.body.received.maliciousExtraField).toBeUndefined();
    await app.close();
  });
});
