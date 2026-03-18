import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ComplianceCoreModule } from '@compliancecore/sdk';
import { EmpresaModule } from './modules/empresa/empresa.module';
import { CalculoModule } from './modules/calculo/calculo.module';
import { SpedModule } from './modules/sped/sped.module';
import { DecisaoModule } from './modules/decisao/decisao.module';
import { ObrigacaoModule } from './modules/obrigacao/obrigacao.module';
import { LegislacaoModule } from './modules/legislacao/legislacao.module';
import { OtimizadorModule } from './modules/otimizador/otimizador.module';
import { WebhookModule } from './modules/webhook/webhook.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ComplianceCoreModule.register({
      database: {
        host: process.env.DATABASE_HOST ?? 'localhost',
        port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
        database: process.env.DATABASE_NAME ?? 'compliancecore',
        user: process.env.DATABASE_USER ?? 'postgres',
        password: process.env.DATABASE_PASSWORD ?? 'postgres',
      },
      redis: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      },
      vektus: {
        baseUrl: process.env.VEKTUS_API_URL ?? 'http://localhost:3100',
        apiKey: process.env.VEKTUS_API_KEY ?? '',
        webhookSecret: process.env.VEKTUS_WEBHOOK_SECRET ?? '',
        projectId: process.env.VEKTUS_PROJECT_ID ?? 'tributo',
      },
      storage: {
        endpoint: process.env.STORAGE_ENDPOINT ?? 'http://localhost:9000',
        accessKey: process.env.STORAGE_ACCESS_KEY ?? 'minioadmin',
        secretKey: process.env.STORAGE_SECRET_KEY ?? 'minioadmin',
        bucket: process.env.STORAGE_BUCKET ?? 'compliancecore',
        publicUrl: process.env.STORAGE_PUBLIC_URL ?? 'http://localhost:9000/compliancecore',
      },
      vertical: 'tributo',
      selfUrl: process.env.SELF_URL ?? 'http://localhost:3003',
    }),
    EmpresaModule,
    CalculoModule,
    SpedModule,
    DecisaoModule,
    ObrigacaoModule,
    LegislacaoModule,
    OtimizadorModule,
    WebhookModule,
  ],
})
export class AppModule {}
