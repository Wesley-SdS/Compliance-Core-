import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventStoreModule, ComplianceCoreConfigService, DatabaseService, ComplianceLogger } from '@compliancecore/sdk';
import { LaboratorioModule } from './modules/laboratorio/laboratorio.module';
import { LaudoModule } from './modules/laudo/laudo.module';
import { EquipamentoModule } from './modules/equipamento/equipamento.module';
import { TemplateModule } from './modules/template/template.module';
import { PortalModule } from './modules/portal/portal.module';

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
    TemplateModule,
    PortalModule,
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
