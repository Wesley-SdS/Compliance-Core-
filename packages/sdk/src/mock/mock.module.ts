import { Module, DynamicModule, Global } from '@nestjs/common';
import { ComplianceCoreConfig, ComplianceCoreConfigService } from '../shared/config.js';
import { DatabaseService } from '../shared/database.js';
import { ComplianceLogger } from '../shared/logger.js';
import { EventStoreService } from '../event-store/event-store.service.js';
import { ScoreEngineService } from '../score-engine/score-engine.service.js';
import { VektusAdapterService } from '../vektus/vektus-adapter.service.js';
import { LegislationMonitorService } from '../legislation/legislation-monitor.service.js';
import { AlertEngineService } from '../alerts/alert-engine.service.js';
import { EvidenceGeneratorService } from '../evidence/evidence-generator.service.js';
import { DocumentManagerService } from '../documents/document-manager.service.js';
import { ChecklistEngineService } from '../checklists/checklist-engine.service.js';
import { BETTER_AUTH_INSTANCE } from '../auth/better-auth.guard.js';
import { BetterAuthGuard } from '../auth/better-auth.guard.js';
import { RBACGuard } from '../auth/rbac.guard.js';
import { VektusWebhookGuard } from '../auth/vektus-webhook.guard.js';

import { MockDatabaseService } from './mock-database.service.js';
import { MockComplianceLogger } from './mock-logger.service.js';
import { MockEventStoreService } from './mock-event-store.service.js';
import { MockScoreEngineService } from './mock-score-engine.service.js';
import { MockVektusAdapterService } from './mock-vektus-adapter.service.js';
import { MockAlertEngineService } from './mock-alert-engine.service.js';
import { MockLegislationMonitorService } from './mock-legislation-monitor.service.js';
import { MockEvidenceGeneratorService } from './mock-evidence-generator.service.js';
import { MockDocumentManagerService } from './mock-document-manager.service.js';
import { MockChecklistEngineService } from './mock-checklist-engine.service.js';

/**
 * Mock auth guard that always allows access and injects a fake user.
 */
const MockBetterAuthGuard = {
  canActivate: (context: any) => {
    const request = context.switchToHttp().getRequest();
    request.user = {
      id: 'mock-user-001',
      email: 'dev@compliancecore.local',
      name: 'Dev User',
      role: 'admin',
      vertical: process.env.VERTICAL ?? 'mock',
      tenantId: 'mock-tenant-001',
    };
    return true;
  },
};

/**
 * MockComplianceCoreModule — drop-in replacement for ComplianceCoreModule.
 *
 * Controlled by MOCK_MODE=true in .env
 * All services use in-memory implementations, no external dependencies.
 * Zero changes needed in business code.
 */
@Global()
@Module({})
export class MockComplianceCoreModule {
  static register(config: ComplianceCoreConfig): DynamicModule {
    const configService = new ComplianceCoreConfigService(config);
    const mockDb = new MockDatabaseService();

    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║  🔶 MOCK MODE ACTIVE — No real DB/APIs  ║');
    console.log('╚══════════════════════════════════════════╝\n');

    return {
      module: MockComplianceCoreModule,
      providers: [
        { provide: ComplianceCoreConfigService, useValue: configService },
        { provide: DatabaseService, useValue: mockDb },
        { provide: ComplianceLogger, useClass: MockComplianceLogger },
        { provide: EventStoreService, useClass: MockEventStoreService },
        { provide: ScoreEngineService, useClass: MockScoreEngineService },
        { provide: VektusAdapterService, useClass: MockVektusAdapterService },
        { provide: LegislationMonitorService, useClass: MockLegislationMonitorService },
        { provide: AlertEngineService, useClass: MockAlertEngineService },
        { provide: EvidenceGeneratorService, useClass: MockEvidenceGeneratorService },
        { provide: DocumentManagerService, useClass: MockDocumentManagerService },
        { provide: ChecklistEngineService, useClass: MockChecklistEngineService },
        { provide: BETTER_AUTH_INSTANCE, useValue: {} },
        { provide: BetterAuthGuard, useValue: MockBetterAuthGuard },
        { provide: RBACGuard, useValue: { canActivate: () => true } },
        { provide: VektusWebhookGuard, useValue: { canActivate: () => true } },
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
        BETTER_AUTH_INSTANCE,
        BetterAuthGuard,
        RBACGuard,
        VektusWebhookGuard,
      ],
    };
  }
}
