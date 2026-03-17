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
        apiUrl: process.env.VEKTUS_API_URL ?? 'http://localhost:3100',
        apiKey: process.env.VEKTUS_API_KEY ?? '',
      },
      storage: {
        provider: (process.env.STORAGE_PROVIDER as 'local' | 's3') ?? 'local',
        basePath: process.env.STORAGE_BASE_PATH ?? './uploads',
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
  ],
})
export class AppModule {}
