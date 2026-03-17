import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3103',
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
    .setTitle('TributoSim API')
    .setDescription('API de compliance tributario para escritorios contabeis')
    .setVersion('0.1.0')
    .addBearerAuth()
    .addTag('empresas', 'Gerenciamento de empresas clientes')
    .addTag('calculos', 'Calculos e simulacoes tributarias')
    .addTag('sped', 'Gestao de arquivos SPED')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3003;
  await app.listen(port);
  console.log(`TributoSim API running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
