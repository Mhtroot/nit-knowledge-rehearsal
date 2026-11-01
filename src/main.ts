import 'reflect-metadata';
import { existsSync, mkdirSync } from 'node:fs';
if (existsSync('.env')) process.loadEnvFile();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({ origin: process.env.CORS_ORIGIN?.split(',') ?? '*' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Serve static frontend files from /frontend
  app.useStaticAssets(join(__dirname, '..', 'frontend'));

  // Serve uploaded static assets (news images, etc.) from /assets
  const assetsDir = join(process.cwd(), 'assets');
  if (!existsSync(assetsDir)) {
    mkdirSync(assetsDir, { recursive: true });
  }
  const imagesDir = join(assetsDir, 'images');
  if (!existsSync(imagesDir)) {
    mkdirSync(imagesDir, { recursive: true });
  }
  app.useStaticAssets(assetsDir, {
    prefix: '/assets/',
  });

  //swagger-config
  const swaggerConfig = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs/json',
    yamlDocumentUrl: 'docs/yaml',
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
