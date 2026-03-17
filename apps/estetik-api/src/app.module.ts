import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ComplianceCoreModule, ComplianceCoreConfigService } from '@compliancecore/sdk';
import { ClinicaModule } from './modules/clinica/clinica.module';
import { ProcedimentoModule } from './modules/procedimento/procedimento.module';
import { PopModule } from './modules/pop/pop.module';
import { LegislacaoModule } from './modules/legislacao/legislacao.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { JobsModule } from './modules/jobs/jobs.module';

const config = ComplianceCoreConfigService.fromEnv();

@Module({
  imports: [
    ComplianceCoreModule.register(config),
    BullModule.forRoot({
      connection: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password || undefined,
      },
    }),
    ClinicaModule,
    ProcedimentoModule,
    PopModule,
    LegislacaoModule,
    WebhookModule,
    JobsModule,
  ],
})
export class AppModule {}
