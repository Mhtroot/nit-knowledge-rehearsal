import 'reflect-metadata';
import { existsSync, mkdirSync } from 'node:fs';
if (existsSync('.env')) process.loadEnvFile();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { initAdmin } from './auth/core/init';
import basicAuth from 'express-basic-auth';

async function bootstrap() {
  const logger = new Logger(bootstrap.name);
  
  const ADMIN_USER = process.env.ADMIN_USER;
  const ADMIN_PASS = process.env.ADMIN_PASS;
  if (!ADMIN_USER || !ADMIN_PASS) {
    logger.error(`ADMIN USERNAME AND PASSWORD ARE NOT SET FOR INIT STATE`);
    return;
  }

  const SWAGG_USER = process.env.SWAGG_USER;
  const SWAGG_PASS = process.env.SWAGG_PASS;
  if (!SWAGG_USER || !SWAGG_PASS) {
    logger.error(`SWAGGER USERNAME AND PASSWORD ARE NOT SET FOR INIT STATE`);
    return;
  }
  
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  await initAdmin(ADMIN_USER, ADMIN_PASS);
  logger.log('INIT ADMIN HAS BEEN CREATED')

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

  app.use(
    ['/admin-dash/docs', '/admin-dash/docs/json', '/admin-dash/docs/yaml'],
    basicAuth({
      challenge: true,
      users: { [SWAGG_USER]: SWAGG_PASS },
    }),
  );
  //swagger-config
  const swaggerConfig = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('admin-dash/docs', app, document, {
    jsonDocumentUrl: 'admin-dash/docs/json',
    yamlDocumentUrl: 'admin-dash/docs/yaml',
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
