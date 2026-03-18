"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertEngineService = void 0;
const common_1 = require("@nestjs/common");
const ulid_1 = require("ulid");
const database_js_1 = require("../shared/database.js");
const config_js_1 = require("../shared/config.js");
const logger_js_1 = require("../shared/logger.js");
let AlertEngineService = class AlertEngineService {
    db;
    config;
    logger;
    constructor(db, config, logger) {
        this.db = db;
        this.config = config;
        this.logger = logger;
        this.logger.setContext('AlertEngineService');
    }
    async register(alertConfig) {
        const id = (0, ulid_1.ulid)();
        await this.db.query(`INSERT INTO compliance_alerts (id, entity_id, entity_type, vertical, alert_type, due_date, days_before_alert, channels, metadata, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING', NOW())`, [
            id,
            alertConfig.entityId,
            alertConfig.entityType,
            alertConfig.vertical,
            alertConfig.alertType,
            alertConfig.dueDate,
            JSON.stringify(alertConfig.daysBeforeAlert),
            JSON.stringify(alertConfig.channels),
            JSON.stringify(alertConfig.metadata ?? {}),
        ]);
        this.logger.log(`Alert registered: ${alertConfig.alertType} for ${alertConfig.entityId}`, {
            alertId: id,
            dueDate: alertConfig.dueDate.toISOString(),
        });
        return id;
    }
    async checkDue() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const alerts = await this.db.query(`SELECT id, entity_id, entity_type, alert_type, due_date, days_before_alert, channels, status
       FROM compliance_alerts
       WHERE status = 'PENDING'
         AND due_date >= NOW()`);
        const dueAlerts = [];
        for (const alert of alerts) {
            const dueDate = new Date(alert.due_date);
            const diffMs = dueDate.getTime() - today.getTime();
            const daysUntilDue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            const daysBeforeAlert = typeof alert.days_before_alert === 'string'
                ? JSON.parse(alert.days_before_alert)
                : alert.days_before_alert;
            if (daysBeforeAlert.includes(daysUntilDue)) {
                const channels = typeof alert.channels === 'string'
                    ? JSON.parse(alert.channels)
                    : alert.channels;
                dueAlerts.push({
                    id: alert.id,
                    entityId: alert.entity_id,
                    entityType: alert.entity_type,
                    alertType: alert.alert_type,
                    dueDate,
                    daysUntilDue,
                    status: 'SENT',
                    channels,
                });
            }
        }
        // Update all due alert statuses in a single transaction
        if (dueAlerts.length > 0) {
            await this.db.transaction(async (query) => {
                for (const alert of dueAlerts) {
                    await query(`UPDATE compliance_alerts SET status = 'SENT', updated_at = NOW() WHERE id = $1`, [alert.id]);
                }
            });
            this.logger.log(`Found ${dueAlerts.length} due alerts`);
        }
        return dueAlerts;
    }
    async acknowledge(alertId) {
        await this.db.query(`UPDATE compliance_alerts SET status = 'ACKNOWLEDGED', updated_at = NOW() WHERE id = $1`, [alertId]);
        this.logger.log(`Alert acknowledged: ${alertId}`);
    }
    async getUpcoming(entityId, days = 30) {
        const now = new Date();
        const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        const alerts = await this.db.query(`SELECT id, entity_id, entity_type, alert_type, due_date, status, channels
       FROM compliance_alerts
       WHERE entity_id = $1
         AND due_date >= $2
         AND due_date <= $3
         AND status IN ('PENDING', 'SENT')
       ORDER BY due_date ASC`, [entityId, now, futureDate]);
        return alerts.map(alert => {
            const dueDate = new Date(alert.due_date);
            const diffMs = dueDate.getTime() - now.getTime();
            const daysUntilDue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            const channels = typeof alert.channels === 'string'
                ? JSON.parse(alert.channels)
                : alert.channels;
            return {
                id: alert.id,
                entityId: alert.entity_id,
                entityType: alert.entity_type,
                alertType: alert.alert_type,
                dueDate,
                daysUntilDue,
                status: alert.status,
                channels,
            };
        });
    }
};
exports.AlertEngineService = AlertEngineService;
exports.AlertEngineService = AlertEngineService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_js_1.DatabaseService,
        config_js_1.ComplianceCoreConfigService,
        logger_js_1.ComplianceLogger])
], AlertEngineService);
//# sourceMappingURL=alert-engine.service.js.map