// Shared
export { DatabaseService } from './shared/database.js';
export { ComplianceLogger } from './shared/logger.js';
export { ComplianceCoreConfigService } from './shared/config.js';
export type { ComplianceCoreConfig } from './shared/config.js';

// Event Store
export { EventStoreService } from './event-store/event-store.service.js';
export { EventStoreModule } from './event-store/event-store.module.js';

// Score Engine
export { ScoreEngineService } from './score-engine/score-engine.service.js';
export { ScoreEngineModule } from './score-engine/score-engine.module.js';

// Vektus Adapter
export { VektusAdapterService } from './vektus/vektus-adapter.service.js';
export { VektusAdapterModule } from './vektus/vektus-adapter.module.js';

// Legislation Monitor
export { LegislationMonitorService } from './legislation/legislation-monitor.service.js';
export { LegislationMonitorModule } from './legislation/legislation-monitor.module.js';

// Alert Engine
export { AlertEngineService } from './alerts/alert-engine.service.js';
export { AlertEngineModule } from './alerts/alert-engine.module.js';

// Evidence Generator
export { EvidenceGeneratorService } from './evidence/evidence-generator.service.js';
export { EvidenceGeneratorModule } from './evidence/evidence-generator.module.js';

// Document Manager
export { DocumentManagerService } from './documents/document-manager.service.js';
export { DocumentManagerModule } from './documents/document-manager.module.js';

// Checklist Engine
export { ChecklistEngineService } from './checklists/checklist-engine.service.js';
export { ChecklistEngineModule } from './checklists/checklist-engine.module.js';

// Auth
export { BetterAuthGuard, BETTER_AUTH_INSTANCE } from './auth/better-auth.guard.js';
export { RBACGuard, ROLES_KEY, Roles } from './auth/rbac.guard.js';
export { VektusWebhookGuard } from './auth/vektus-webhook.guard.js';
export { CurrentUser } from './auth/user.decorator.js';
export type { AuthUser } from './auth/user.decorator.js';
export { AuthModule } from './auth/auth.module.js';
export { createBetterAuthInstance } from './auth/better-auth.config.js';
export type { BetterAuthInstance, BetterAuthOptions, SendEmailFn, SendEmailParams } from './auth/better-auth.config.js';

// Main Module
export { ComplianceCoreModule } from './compliance-core.module.js';
