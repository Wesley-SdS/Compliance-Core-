import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ComplianceCoreModule, ComplianceCoreConfigService } from '@compliancecore/sdk';
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
    ComplianceCoreModule.register(ComplianceCoreConfigService.fromEnv()),
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
})
export class AppModule {}
