"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ComplianceCoreModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceCoreModule = void 0;
const common_1 = require("@nestjs/common");
const config_js_1 = require("./shared/config.js");
const database_js_1 = require("./shared/database.js");
const logger_js_1 = require("./shared/logger.js");
const event_store_service_js_1 = require("./event-store/event-store.service.js");
const score_engine_service_js_1 = require("./score-engine/score-engine.service.js");
const vektus_adapter_service_js_1 = require("./vektus/vektus-adapter.service.js");
const legislation_monitor_service_js_1 = require("./legislation/legislation-monitor.service.js");
const alert_engine_service_js_1 = require("./alerts/alert-engine.service.js");
const evidence_generator_service_js_1 = require("./evidence/evidence-generator.service.js");
const document_manager_service_js_1 = require("./documents/document-manager.service.js");
const checklist_engine_service_js_1 = require("./checklists/checklist-engine.service.js");
const auth_module_js_1 = require("./auth/auth.module.js");
const pg_1 = require("pg");
let ComplianceCoreModule = ComplianceCoreModule_1 = class ComplianceCoreModule {
    static register(config) {
        const configService = new config_js_1.ComplianceCoreConfigService(config);
        const databaseService = new database_js_1.DatabaseService({
            host: config.database.host,
            port: config.database.port,
            database: config.database.database,
            user: config.database.user,
            password: config.database.password,
        });
        const pool = new pg_1.Pool({
            host: config.database.host,
            port: config.database.port,
            database: config.database.database,
            user: config.database.user,
            password: config.database.password,
        });
        return {
            module: ComplianceCoreModule_1,
            imports: [
                auth_module_js_1.AuthModule.register({ pool }),
            ],
            providers: [
                {
                    provide: config_js_1.ComplianceCoreConfigService,
                    useValue: configService,
                },
                {
                    provide: database_js_1.DatabaseService,
                    useValue: databaseService,
                },
                logger_js_1.ComplianceLogger,
                event_store_service_js_1.EventStoreService,
                score_engine_service_js_1.ScoreEngineService,
                vektus_adapter_service_js_1.VektusAdapterService,
                legislation_monitor_service_js_1.LegislationMonitorService,
                alert_engine_service_js_1.AlertEngineService,
                evidence_generator_service_js_1.EvidenceGeneratorService,
                document_manager_service_js_1.DocumentManagerService,
                checklist_engine_service_js_1.ChecklistEngineService,
            ],
            exports: [
                config_js_1.ComplianceCoreConfigService,
                database_js_1.DatabaseService,
                logger_js_1.ComplianceLogger,
                event_store_service_js_1.EventStoreService,
                score_engine_service_js_1.ScoreEngineService,
                vektus_adapter_service_js_1.VektusAdapterService,
                legislation_monitor_service_js_1.LegislationMonitorService,
                alert_engine_service_js_1.AlertEngineService,
                evidence_generator_service_js_1.EvidenceGeneratorService,
                document_manager_service_js_1.DocumentManagerService,
                checklist_engine_service_js_1.ChecklistEngineService,
            ],
        };
    }
};
exports.ComplianceCoreModule = ComplianceCoreModule;
exports.ComplianceCoreModule = ComplianceCoreModule = ComplianceCoreModule_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({})
], ComplianceCoreModule);
//# sourceMappingURL=compliance-core.module.js.map