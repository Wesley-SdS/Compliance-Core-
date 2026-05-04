import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventStoreModule, ComplianceCoreConfigService, DatabaseService, ComplianceLogger } from '@compliancecore/sdk';
import { VeiculoModule } from './modules/veiculo/veiculo.module';
import { MotoristaModule } from './modules/motorista/motorista.module';
import { ViagemModule } from './modules/viagem/viagem.module';
import { AbastecimentoModule } from './modules/abastecimento/abastecimento.module';
import { ManutencaoModule } from './modules/manutencao/manutencao.module';
import { FrotaModule } from './modules/frota/frota.module';
import { CustosModule } from './modules/custos/custos.module';
import { AlertaModule } from './modules/alerta/alerta.module';
import { ChecklistModule } from './modules/checklist/checklist.module';
import { LegislacaoModule } from './modules/legislacao/legislacao.module';
import { WebhookModule } from './modules/webhook/webhook.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    EventStoreModule,
    VeiculoModule,
    MotoristaModule,
    ViagemModule,
    AbastecimentoModule,
    ManutencaoModule,
    FrotaModule,
    CustosModule,
    AlertaModule,
    ChecklistModule,
    LegislacaoModule,
    WebhookModule,
  ],
  providers: [
    {
      provide: ComplianceCoreConfigService,
      useFactory: () => {
        return new ComplianceCoreConfigService(
          ComplianceCoreConfigService.fromEnv(),
        );
      },
    },
    {
      provide: DatabaseService,
      useFactory: (config: ComplianceCoreConfigService) => {
        return new DatabaseService({
          host: config.database.host,
          port: config.database.port,
          database: config.database.database,
          user: config.database.user,
          password: config.database.password,
        });
      },
      inject: [ComplianceCoreConfigService],
    },
    ComplianceLogger,
  ],
  exports: [ComplianceCoreConfigService, DatabaseService, ComplianceLogger],
})
export class AppModule {}
