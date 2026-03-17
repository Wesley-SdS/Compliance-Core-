import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3102',
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
    .setTitle('ObraMaster API')
    .setDescription('API de compliance para construtores')
    .setVersion('0.2.0')
    .addBearerAuth()
    .addTag('obras', 'Gerenciamento de obras')
    .addTag('etapas', 'Etapas da construcao')
    .addTag('materiais', 'Rastreamento de materiais')
    .addTag('fotos', 'Registro fotografico geolocalizado')
    .addTag('webhooks', 'Callbacks do Vektus')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // BullMQ cron schedulers
  try {
    const { Queue } = await import('bullmq');
    const redisConnection = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
    };

    const scraperQueue = new Queue('obra-scraper', { connection: redisConnection });
    const alertQueue = new Queue('obra-alerts', { connection: redisConnection });

    await scraperQueue.upsertJobScheduler('mte-nrs', { pattern: '0 8 * * 1' }, { name: 'mte-nrs' });
    await scraperQueue.upsertJobScheduler('dou-obra', { pattern: '0 9 * * 1-5' }, { name: 'dou-obra' });
    await alertQueue.upsertJobScheduler('check-due', { pattern: '0 7 * * *' }, { name: 'check-due' });

    console.log('BullMQ cron schedulers registered');
  } catch (err) {
    console.warn('Redis unavailable, cron schedulers not registered:', (err as Error).message);
  }

  const port = process.env.PORT || 3002;
  await app.listen(port);
  console.log(`ObraMaster API v0.2.0 running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
