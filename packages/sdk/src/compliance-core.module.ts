import { Module, DynamicModule, Global } from '@nestjs/common';
import { ComplianceCoreConfig, ComplianceCoreConfigService } from './shared/config.js';
import { DatabaseService } from './shared/database.js';
import { ComplianceLogger } from './shared/logger.js';
import { EventStoreService } from './event-store/event-store.service.js';
import { ScoreEngineService } from './score-engine/score-engine.service.js';
import { VektusAdapterService } from './vektus/vektus-adapter.service.js';
import { LegislationMonitorService } from './legislation/legislation-monitor.service.js';
import { AlertEngineService } from './alerts/alert-engine.service.js';
import { EvidenceGeneratorService } from './evidence/evidence-generator.service.js';
import { DocumentManagerService } from './documents/document-manager.service.js';
import { ChecklistEngineService } from './checklists/checklist-engine.service.js';
import { AuthModule } from './auth/auth.module.js';
import { Pool } from 'pg';

@Global()
@Module({})
export class ComplianceCoreModule {
  static register(config: ComplianceCoreConfig): DynamicModule {
    const configService = new ComplianceCoreConfigService(config);
    const databaseService = new DatabaseService({
      host: config.database.host,
      port: config.database.port,
      database: config.database.database,
      user: config.database.user,
      password: config.database.password,
    });

    const pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.database,
      user: config.database.user,
      password: config.database.password,
    });

    return {
      module: ComplianceCoreModule,
      imports: [
        AuthModule.register({ pool }),
      ],
      providers: [
        {
          provide: ComplianceCoreConfigService,
          useValue: configService,
        },
        {
          provide: DatabaseService,
          useValue: databaseService,
        },
        ComplianceLogger,
        EventStoreService,
        ScoreEngineService,
        VektusAdapterService,
        LegislationMonitorService,
        AlertEngineService,
        EvidenceGeneratorService,
        DocumentManagerService,
        ChecklistEngineService,
      ],
      exports: [
        ComplianceCoreConfigService,
        DatabaseService,
        ComplianceLogger,
        EventStoreService,
        ScoreEngineService,
        VektusAdapterService,
        LegislationMonitorService,
        AlertEngineService,
        EvidenceGeneratorService,
        DocumentManagerService,
        ChecklistEngineService,
      ],
    };
  }
}
