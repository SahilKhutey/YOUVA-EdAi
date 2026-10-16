import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { corsOrigins, swaggerEnabled, trustProxyHops } from './security/http-config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Behind a reverse proxy (Render, nginx) every request looks like it comes from the proxy unless this is set,
  // which would make rate limiting treat the whole school as one user. Set TRUST_PROXY_HOPS=1 there.
  const hops = trustProxyHops(process.env.TRUST_PROXY_HOPS);
  if (hops > 0) app.set('trust proxy', hops);

  app.enableCors({
    origin: corsOrigins(process.env.CORS_ORIGINS),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe());

  if (swaggerEnabled(process.env.NODE_ENV, process.env.ENABLE_SWAGGER)) {
    const config = new DocumentBuilder()
      .setTitle('Youva EdAi API')
      .setDescription('The Youva EdAi Learning Platform API description')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
