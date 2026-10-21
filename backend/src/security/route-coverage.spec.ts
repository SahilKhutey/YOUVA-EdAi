import * as fs from 'fs';
import * as path from 'path';
import { Test } from '@nestjs/testing';
import { ModulesContainer } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { collectRoutes } from './route-inventory';

/**
 * Guardrail: every route must require login, except this short, reviewed list.
 * A new route without JwtAuthGuard makes this test fail until someone decides, in code review, that it is public.
 */
const PUBLIC_ROUTES = [
  'GET /',                              // hello/health
  'POST /auth/login',                   // credentials are the authentication
  'POST /auth/register',                // creates STUDENT accounts only, rate limited
  'GET /global-verification/:hash',     // public credential lookup by hash (reviewed: returns skill and an anonymous hash)
  'POST /subscription/webhook',         // authenticated by Stripe signature; disabled without STRIPE_WEBHOOK_SECRET
];

describe('route coverage', () => {
  let routes: ReturnType<typeof collectRoutes>;
  beforeAll(async () => {
    process.env.JWT_SECRET = 'route-test-secret';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService).useValue({ $connect: async () => undefined, $disconnect: async () => undefined })
      .compile();
    routes = collectRoutes(moduleRef.get(ModulesContainer));
    await moduleRef.close();
  }, 60_000);

  it('finds the routes (sanity: the inventory is not empty)', () => {
    expect(routes.length).toBeGreaterThan(100);
  });

  it('has no route without login other than the reviewed public list', () => {
    const open = routes.filter((r) => !r.authenticated).map((r) => `${r.method} ${r.path}`).sort();
    expect(open).toEqual([...PUBLIC_ROUTES].sort());
  });

  it('keeps consent erasure and export restricted by role', () => {
    const find = (m: string, p: string) => routes.find((r) => r.method === m && r.path === p)!;
    expect(find('POST', '/consent/student/:studentId/erase').roles).toEqual(['ADMIN']);
    expect(find('GET', '/consent/student/:studentId/export').roles).toEqual(['TEACHER', 'ADMIN']);
  });

  it('keeps teacher tools and publishing restricted to teachers and admins', () => {
    const find = (m: string, p: string) => routes.find((r) => r.method === m && r.path === p);
    const staff = ['TEACHER', 'ADMIN'];
    for (const [m, p] of [
      ['POST', '/classroom/session/start'], ['POST', '/classroom/lesson-plan/generate'], ['PUT', '/classroom/lesson-plan/:id/publish'],
      ['POST', '/classroom/worksheet/generate'], ['PUT', '/classroom/worksheet/:id/publish'],
      ['PUT', '/content-gen/publish/:draftId'], ['POST', '/content-gen/generate'], ['POST', '/assessment-intelligence/assign'],
    ]) {
      expect(find(m, p)?.roles).toEqual(staff);
    }
    // seeding the badge catalogue is an admin action; the forum is behind its own switch
    expect(find('POST', '/gamification/seed-badges')?.roles).toEqual(['ADMIN']);
    for (const r of routes.filter((x) => x.path.startsWith('/forum'))) expect(r.guards).toContain('ForumFeatureGuard');
    // the AI-sending evaluation route also needs the AI switch
    expect(find('POST', '/assessment-intelligence/evaluate/:id')?.guards).toContain('AiFeaturesGuard');
  });

  it('has no controller class that exists in the code but is silently not registered', () => {
    // EdgeSyncController is imported in app.module.ts but its module is never added to `imports`, so its routes
    // do not exist at runtime. It is listed here on purpose; remove it from this list if you register the module.
    const NOT_REGISTERED = ['EdgeSyncController'];
    const declared: string[] = [];
    const walk = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) walk(full);
        else if (e.name.endsWith('.controller.ts')) {
          for (const m of fs.readFileSync(full, 'utf8').matchAll(/export class (\w+Controller)\b/g)) declared.push(m[1]);
        }
      }
    };
    walk(path.join(__dirname, '..'));
    const live = new Set(routes.map((r) => r.controller));
    expect(declared.filter((c) => !live.has(c)).sort()).toEqual(NOT_REGISTERED);
  });
});
