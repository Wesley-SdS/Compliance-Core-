import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventStoreModule } from '@compliancecore/sdk/event-store/event-store.module';
import { ComplianceCoreConfigService } from '@compliancecore/sdk/shared/config';
import { DatabaseService } from '@compliancecore/sdk/shared/database';
import { ComplianceLogger } from '@compliancecore/sdk/shared/logger';
import { LaboratorioModule } from './modules/laboratorio/laboratorio.module';
import { LaudoModule } from './modules/laudo/laudo.module';
import { EquipamentoModule } from './modules/equipamento/equipamento.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    EventStoreModule,
    LaboratorioModule,
    LaudoModule,
    EquipamentoModule,
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
