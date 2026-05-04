import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ComplianceCoreModule, ComplianceCoreConfigService } from '@compliancecore/sdk';
import { LoteamentoModule } from './modules/loteamento/loteamento.module';
import { LoteModule } from './modules/lote/lote.module';
import { CompradorModule } from './modules/comprador/comprador.module';
import { ContratoModule } from './modules/contrato/contrato.module';
import { InfraestruturaModule } from './modules/infraestrutura/infraestrutura.module';
import { AprovacaoModule } from './modules/aprovacao/aprovacao.module';
import { FinanceiroModule } from './modules/financeiro/financeiro.module';
import { CobrancaModule } from './modules/cobranca/cobranca.module';
import { PortalModule } from './modules/portal/portal.module';
import { LegislacaoModule } from './modules/legislacao/legislacao.module';
import { StatsModule } from './modules/stats/stats.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ComplianceCoreModule.register(ComplianceCoreConfigService.fromEnv()),
    LoteamentoModule,
    LoteModule,
    CompradorModule,
    ContratoModule,
    InfraestruturaModule,
    AprovacaoModule,
    FinanceiroModule,
    CobrancaModule,
    PortalModule,
    LegislacaoModule,
    StatsModule,
  ],
})
export class AppModule {}
