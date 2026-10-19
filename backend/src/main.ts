import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { swaggerEnabled } from './security/http-config';
import { configureApp } from './security/configure-app';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureApp(app);

  if (swaggerEnabled(process.env.NODE_ENV, process.env.ENABLE_SWAGGER)) {
    const config = new DocumentBuilder()
      .setTitle('Youva EdAi API')
      .setDescription('The Youva EdAi Learning Platform API description')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    // Served at /docs so it never collides with an API prefix of "api".
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
