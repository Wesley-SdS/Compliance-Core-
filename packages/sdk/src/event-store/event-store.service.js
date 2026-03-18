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
exports.EventStoreService = void 0;
const common_1 = require("@nestjs/common");
const ulid_1 = require("ulid");
const database_js_1 = require("../shared/database.js");
const config_js_1 = require("../shared/config.js");
const logger_js_1 = require("../shared/logger.js");
let EventStoreService = class EventStoreService {
    db;
    config;
    logger;
    constructor(db, config, logger) {
        this.db = db;
        this.config = config;
        this.logger = logger;
        this.logger.setContext('EventStoreService');
    }
    async append(aggregateId, aggregateType, eventType, payload, metadata) {
        const id = (0, ulid_1.ulid)();
        const vertical = this.config.vertical;
        const eventVersion = await this.getNextVersion(aggregateId);
        const row = await this.db.queryOne(`INSERT INTO compliance_events (id, aggregate_id, aggregate_type, event_type, event_version, payload, metadata, vertical, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id, aggregate_id AS "aggregateId", aggregate_type AS "aggregateType",
                 event_type AS "eventType", event_version AS "eventVersion",
                 payload, metadata, vertical, created_at AS "createdAt"`, [id, aggregateId, aggregateType, eventType, eventVersion, JSON.stringify(payload), JSON.stringify(metadata), vertical]);
        this.logger.log(`Event appended: ${eventType} for ${aggregateType}/${aggregateId}`, { eventId: id });
        return row;
    }
    async getEvents(aggregateId, since) {
        const params = [aggregateId];
        let query = `
      SELECT id, aggregate_id AS "aggregateId", aggregate_type AS "aggregateType",
             event_type AS "eventType", event_version AS "eventVersion",
             payload, metadata, vertical, created_at AS "createdAt"
      FROM compliance_events
      WHERE aggregate_id = $1`;
        if (since) {
            params.push(since);
            query += ` AND created_at > $${params.length}`;
        }
        query += ' ORDER BY event_version ASC';
        return this.db.query(query, params);
    }
    async getAuditTrail(filters) {
        const conditions = [];
        const params = [];
        let paramIndex = 0;
        if (filters.aggregateId) {
            paramIndex++;
            conditions.push(`aggregate_id = $${paramIndex}`);
            params.push(filters.aggregateId);
        }
        if (filters.aggregateType) {
            paramIndex++;
            conditions.push(`aggregate_type = $${paramIndex}`);
            params.push(filters.aggregateType);
        }
        if (filters.eventType) {
            paramIndex++;
            conditions.push(`event_type = $${paramIndex}`);
            params.push(filters.eventType);
        }
        if (filters.actorId) {
            paramIndex++;
            conditions.push(`metadata->>'actorId' = $${paramIndex}`);
            params.push(filters.actorId);
        }
        if (filters.vertical) {
            paramIndex++;
            conditions.push(`vertical = $${paramIndex}`);
            params.push(filters.vertical);
        }
        if (filters.since) {
            paramIndex++;
            conditions.push(`created_at >= $${paramIndex}`);
            params.push(filters.since);
        }
        if (filters.until) {
            paramIndex++;
            conditions.push(`created_at <= $${paramIndex}`);
            params.push(filters.until);
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 50;
        const offset = (page - 1) * limit;
        const countResult = await this.db.queryOne(`SELECT COUNT(*) as count FROM compliance_events ${whereClause}`, params);
        const total = parseInt(countResult?.count ?? '0', 10);
        paramIndex++;
        params.push(limit);
        paramIndex++;
        params.push(offset);
        const events = await this.db.query(`SELECT id, aggregate_id AS "aggregateId", aggregate_type AS "aggregateType",
              event_type AS "eventType", event_version AS "eventVersion",
              payload, metadata, vertical, created_at AS "createdAt"
       FROM compliance_events
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex - 1} OFFSET $${paramIndex}`, params);
        return {
            events,
            total,
            page,
            limit,
            hasMore: offset + events.length < total,
        };
    }
    async snapshot(aggregateId, aggregateType) {
        return this.db.queryOne(`SELECT aggregate_id AS "aggregateId", aggregate_type AS "aggregateType",
              state, version, updated_at AS "updatedAt"
       FROM compliance_snapshots
       WHERE aggregate_id = $1 AND aggregate_type = $2`, [aggregateId, aggregateType]);
    }
    async rebuild(aggregateId, aggregateType, reducer, initialState) {
        const existingSnapshot = await this.snapshot(aggregateId, aggregateType);
        let state = initialState;
        let fromVersion = 0;
        if (existingSnapshot) {
            state = existingSnapshot.state;
            fromVersion = existingSnapshot.version;
        }
        const events = await this.db.query(`SELECT id, aggregate_id AS "aggregateId", aggregate_type AS "aggregateType",
              event_type AS "eventType", event_version AS "eventVersion",
              payload, metadata, vertical, created_at AS "createdAt"
       FROM compliance_events
       WHERE aggregate_id = $1 AND aggregate_type = $2 AND event_version > $3
       ORDER BY event_version ASC`, [aggregateId, aggregateType, fromVersion]);
        for (const event of events) {
            state = reducer(state, event);
        }
        const latestVersion = events.length > 0
            ? events[events.length - 1].eventVersion
            : fromVersion;
        if (events.length > 0) {
            await this.saveSnapshot(aggregateId, aggregateType, state, latestVersion);
        }
        return { state, version: latestVersion };
    }
    async saveSnapshot(aggregateId, aggregateType, state, version) {
        await this.db.query(`INSERT INTO compliance_snapshots (aggregate_id, aggregate_type, state, version, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (aggregate_id, aggregate_type)
       DO UPDATE SET state = $3, version = $4, updated_at = NOW()`, [aggregateId, aggregateType, JSON.stringify(state), version]);
    }
    async getNextVersion(aggregateId) {
        const result = await this.db.queryOne(`SELECT MAX(event_version) as max_version FROM compliance_events WHERE aggregate_id = $1`, [aggregateId]);
        return (result?.max_version ?? 0) + 1;
    }
};
exports.EventStoreService = EventStoreService;
exports.EventStoreService = EventStoreService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_js_1.DatabaseService,
        config_js_1.ComplianceCoreConfigService,
        logger_js_1.ComplianceLogger])
], EventStoreService);
//# sourceMappingURL=event-store.service.js.map