/** Usage (from backend/): npx ts-node scripts/route-audit.ts > ../docs/ROUTE_AUDIT.generated.md
 *  Boots the app's dependency graph with a stubbed database and prints every route with its real guards. */
import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { ModulesContainer } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { collectRoutes } from '../src/security/route-inventory';

async function main() {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'audit-only';
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService).useValue({ $connect: async () => undefined, $disconnect: async () => undefined })
    .compile();
  const routes = collectRoutes(moduleRef.get(ModulesContainer));
  console.log(`# Route inventory (generated, ${routes.length} routes)\n`);
  console.log('Read from decorator metadata. "Login" = JwtAuthGuard present. "Knows caller" = the handler receives the request object, so it can tell who is calling; a login-only route that does not can only be safe if it serves the same public data to everyone. Ownership checks inside handlers are NOT shown here.\n');
  console.log('| Method | Path | Login | Roles | Knows caller | Controller |\n|---|---|---|---|---|---|');
  for (const r of routes) console.log(`| ${r.method} | ${r.path} | ${r.authenticated ? 'yes' : '**NO**'} | ${r.roles.join(', ') || '-'} | ${r.usesRequest ? 'yes' : 'no'} | ${r.controller} |`);
  await moduleRef.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
