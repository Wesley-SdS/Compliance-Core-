import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3100',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('EstetikComply API')
    .setDescription('API de compliance para clinicas de estetica')
    .setVersion('0.2.0')
    .addBearerAuth()
    .addTag('clinicas', 'Gerenciamento de clinicas')
    .addTag('procedimentos', 'Tipos de procedimentos esteticos')
    .addTag('pops', 'Procedimentos Operacionais Padrao')
    .addTag('legislacao', 'Monitoramento legislativo')
    .addTag('webhooks', 'Webhooks de integracao')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Register cron jobs for scrapers and alerts
  try {
    const scraperQueue = app.get<Queue>(getQueueToken('scraper'));
    const alertQueue = app.get<Queue>(getQueueToken('alerts'));

    // Anvisa noticias: every day at 8:00 AM
    await scraperQueue.upsertJobScheduler(
      'anvisa-noticias-daily',
      { pattern: '0 8 * * *' },
      { name: 'anvisa-noticias' },
    );

    // Anvisa RDCs: every Monday at 7:00 AM
    await scraperQueue.upsertJobScheduler(
      'anvisa-rdcs-weekly',
      { pattern: '0 7 * * 1' },
      { name: 'anvisa-rdcs' },
    );

    // DOU: every weekday at 9:00 AM
    await scraperQueue.upsertJobScheduler(
      'dou-daily',
      { pattern: '0 9 * * 1-5' },
      { name: 'dou-busca' },
    );

    // Alert check: every day at 7:00 AM
    await alertQueue.upsertJobScheduler(
      'alerts-daily-check',
      { pattern: '0 7 * * *' },
      { name: 'check-due' },
    );

    console.log('BullMQ cron jobs registered successfully');
  } catch (error) {
    console.warn('Failed to register BullMQ cron jobs (Redis may not be available):', (error as Error).message);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`EstetikComply API running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
