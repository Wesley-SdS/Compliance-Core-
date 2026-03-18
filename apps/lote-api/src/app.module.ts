import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventStoreModule } from '@compliancecore/sdk/event-store/event-store.module';
import { ComplianceCoreConfigService } from '@compliancecore/sdk/shared/config';
import { DatabaseService } from '@compliancecore/sdk/shared/database';
import { ComplianceLogger } from '@compliancecore/sdk/shared/logger';
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
    EventStoreModule,
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
