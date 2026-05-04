import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import {
  ComplianceCoreModule,
  ComplianceCoreConfigService,
} from '@compliancecore/sdk';
import { ObraModule } from './modules/obra/obra.module';
import { EtapaModule } from './modules/etapa/etapa.module';
import { MaterialModule } from './modules/material/material.module';
import { FotoModule } from './modules/foto/foto.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { AlertaModule } from './modules/alerta/alerta.module';
import { JobsModule } from './modules/jobs/jobs.module';

const config = ComplianceCoreConfigService.fromEnv();

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.local', '.env'] }),
    ComplianceCoreModule.register(config),
    BullModule.forRoot({
      redis: {
        host: config.redis?.host || 'localhost',
        port: config.redis?.port || 6379,
        password: config.redis?.password || undefined,
      },
    }),
    ObraModule,
    EtapaModule,
    MaterialModule,
    FotoModule,
    WebhookModule,
    AlertaModule,
    JobsModule,
  ],
})
export class AppModule {}
