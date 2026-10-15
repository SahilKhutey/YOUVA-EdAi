import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

/**
 * Builds the whole application's dependency graph with the database replaced by a stub.
 * Catches missing providers, circular imports and bad module wiring that unit tests with
 * hand-built objects cannot. It does NOT touch a real database or start an HTTP server.
 */
describe('application boot (dependency graph)', () => {
  const OLD = { ...process.env };
  beforeAll(() => { process.env.JWT_SECRET = 'boot-test-secret'; process.env.GEMINI_API_KEY = 'x'; });
  afterAll(() => { process.env = OLD; });

  it('resolves every module and provider', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService).useValue({ $connect: async () => undefined, $disconnect: async () => undefined })
      .compile();
    expect(moduleRef).toBeDefined();
    await moduleRef.close();
  }, 60_000);
});
