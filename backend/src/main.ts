import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as express from 'express';
import { ProductionExceptionFilter } from './security/filters/production-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });
  const configService = app.get(ConfigService);

  // Stripe Raw Body Parser for billing webhooks (must receive unmodified Buffer)
  app.use(
    '/api/v1/commercial/billing/webhook',
    express.raw({ type: 'application/json' }),
  );
  app.use(
    '/api/commercial/billing/webhook',
    express.raw({ type: 'application/json' }),
  );

  // Standard JSON and URL-encoded body parsers for all other routes
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.setGlobalPrefix('api');

  // Security Headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Secure CORS configuration
  const frontendUrl = configService.get<string>('FRONTEND_URL');
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production' && frontendUrl
        ? frontendUrl
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'Idempotency-Key',
      'stripe-signature',
      'x-tenant-id',
    ],
  });

  // Strict Request Body Validation
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

  // Production Exception Filter (prevents internal stack leaks)
  app.useGlobalFilters(new ProductionExceptionFilter());

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('YOUVA-EdAI API')
    .setDescription('Production Human-AI Learning System API')
    .setVersion('2.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Graceful shutdown hooks
  app.enableShutdownHooks();

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);
  console.log(`[BOOTSTRAP] YOUVA-EdAI production server running on port ${port}`);
}
bootstrap();
