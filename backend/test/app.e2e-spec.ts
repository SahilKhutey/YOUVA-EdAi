process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-secret-key-that-is-at-least-32-characters-long';
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://youva:youvapassword@localhost:5432/youva';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Application E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api');

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('boots the full Nest application against the integration database', async () => {
    await request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect('Hello World!');
  });

  it('rejects an unknown API route with 404', async () => {
    await request(app.getHttpServer())
      .get('/api/__e2e_missing_route__')
      .expect(404);
  });
});
