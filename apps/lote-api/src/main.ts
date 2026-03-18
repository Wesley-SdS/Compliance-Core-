import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3106',
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
    .setTitle('LotePro API')
    .setDescription('API de compliance para loteadores')
    .setVersion('0.1.0')
    .addBearerAuth()
    .addTag('loteamentos', 'Gerenciamento de loteamentos')
    .addTag('lotes', 'Gerenciamento de lotes individuais')
    .addTag('compradores', 'Gerenciamento de compradores')
    .addTag('contratos', 'Gestao de contratos e parcelas')
    .addTag('infraestrutura', 'Acompanhamento de obras de infraestrutura')
    .addTag('aprovacoes', 'Aprovacoes legais e regulatorias')
    .addTag('financeiro', 'Dashboard financeiro')
    .addTag('cobranca', 'Regua de cobranca e inadimplencia')
    .addTag('portal', 'Portal do comprador (acesso publico)')
    .addTag('legislacao', 'Feed de legislacao aplicavel')
    .addTag('stats', 'Estatisticas globais e score')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3006;
  await app.listen(port);
  console.log(`LotePro API running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
