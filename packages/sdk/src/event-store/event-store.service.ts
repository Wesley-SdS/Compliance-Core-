import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { DatabaseService } from '../shared/database.js';
import { ComplianceCoreConfigService } from '../shared/config.js';
import { ComplianceLogger } from '../shared/logger.js';
import type {
  ComplianceEvent,
  EventMetadata,
  AuditFilters,
  PaginatedEvents,
  AggregateSnapshot,
  EventReducer,
} from '@compliancecore/shared';

@Injectable()
export class EventStoreService {
  constructor(
    private readonly db: DatabaseService,
    private readonly config: ComplianceCoreConfigService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('EventStoreService');
  }

  async append(
    aggregateId: string,
    aggregateType: string,
    eventType: string,
    payload: Record<string, unknown>,
    metadata: EventMetadata,
  ): Promise<ComplianceEvent> {
    const id = ulid();
    const vertical = this.config.vertical;
    const eventVersion = await this.getNextVersion(aggregateId);

    const row = await this.db.queryOne<ComplianceEvent>(
      `INSERT INTO compliance_events (id, aggregate_id, aggregate_type, event_type, event_version, payload, metadata, vertical, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id, aggregate_id AS "aggregateId", aggregate_type AS "aggregateType",
                 event_type AS "eventType", event_version AS "eventVersion",
                 payload, metadata, vertical, created_at AS "createdAt"`,
      [id, aggregateId, aggregateType, eventType, eventVersion, JSON.stringify(payload), JSON.stringify(metadata), vertical],
    );

    this.logger.log(`Event appended: ${eventType} for ${aggregateType}/${aggregateId}`, { eventId: id });
    return row!;
  }

  async getEvents(aggregateId: string, since?: Date): Promise<ComplianceEvent[]> {
    const params: any[] = [aggregateId];
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

    return this.db.query<ComplianceEvent>(query, params);
  }

  async getAuditTrail(filters: AuditFilters): Promise<PaginatedEvents> {
    const conditions: string[] = [];
    const params: any[] = [];
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

    const countResult = await this.db.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM compliance_events ${whereClause}`,
      params,
    );
    const total = parseInt(countResult?.count ?? '0', 10);

    paramIndex++;
    params.push(limit);
    paramIndex++;
    params.push(offset);

    const events = await this.db.query<ComplianceEvent>(
      `SELECT id, aggregate_id AS "aggregateId", aggregate_type AS "aggregateType",
              event_type AS "eventType", event_version AS "eventVersion",
              payload, metadata, vertical, created_at AS "createdAt"
       FROM compliance_events
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex - 1} OFFSET $${paramIndex}`,
      params,
    );

    return {
      events,
      total,
      page,
      limit,
      hasMore: offset + events.length < total,
    };
  }

  async snapshot(aggregateId: string, aggregateType: string): Promise<AggregateSnapshot | null> {
    return this.db.queryOne<AggregateSnapshot>(
      `SELECT aggregate_id AS "aggregateId", aggregate_type AS "aggregateType",
              state, version, updated_at AS "updatedAt"
       FROM compliance_snapshots
       WHERE aggregate_id = $1 AND aggregate_type = $2`,
      [aggregateId, aggregateType],
    );
  }

  async rebuild<T = Record<string, unknown>>(
    aggregateId: string,
    aggregateType: string,
    reducer: EventReducer<T>,
    initialState: T,
  ): Promise<{ state: T; version: number }> {
    const existingSnapshot = await this.snapshot(aggregateId, aggregateType);
    let state: T = initialState;
    let fromVersion = 0;

    if (existingSnapshot) {
      state = existingSnapshot.state as T;
      fromVersion = existingSnapshot.version;
    }

    const events = await this.db.query<ComplianceEvent>(
      `SELECT id, aggregate_id AS "aggregateId", aggregate_type AS "aggregateType",
              event_type AS "eventType", event_version AS "eventVersion",
              payload, metadata, vertical, created_at AS "createdAt"
       FROM compliance_events
       WHERE aggregate_id = $1 AND aggregate_type = $2 AND event_version > $3
       ORDER BY event_version ASC`,
      [aggregateId, aggregateType, fromVersion],
    );

    for (const event of events) {
      state = reducer(state, event);
    }

    const latestVersion = events.length > 0
      ? events[events.length - 1].eventVersion
      : fromVersion;

    if (events.length > 0) {
      await this.saveSnapshot(aggregateId, aggregateType, state as Record<string, unknown>, latestVersion);
    }

    return { state, version: latestVersion };
  }

  async saveSnapshot(
    aggregateId: string,
    aggregateType: string,
    state: Record<string, unknown>,
    version: number,
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO compliance_snapshots (aggregate_id, aggregate_type, state, version, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (aggregate_id, aggregate_type)
       DO UPDATE SET state = $3, version = $4, updated_at = NOW()`,
      [aggregateId, aggregateType, JSON.stringify(state), version],
    );
  }

  private async getNextVersion(aggregateId: string): Promise<number> {
    const result = await this.db.queryOne<{ max_version: number | null }>(
      `SELECT MAX(event_version) as max_version FROM compliance_events WHERE aggregate_id = $1`,
      [aggregateId],
    );
    return (result?.max_version ?? 0) + 1;
  }
}
