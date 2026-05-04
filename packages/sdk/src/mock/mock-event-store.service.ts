import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import type {
  ComplianceEvent,
  EventMetadata,
  AuditFilters,
  PaginatedEvents,
  AggregateSnapshot,
  EventReducer,
  Vertical,
} from '@compliancecore/shared';

@Injectable()
export class MockEventStoreService {
  private events: ComplianceEvent[] = [];
  private snapshots = new Map<string, AggregateSnapshot>();
  private vertical = (process.env.VERTICAL ?? 'estetik') as Vertical;

  async append(
    aggregateId: string,
    aggregateType: string,
    eventType: string,
    payload: Record<string, unknown>,
    metadata: EventMetadata,
  ): Promise<ComplianceEvent> {
    const existing = this.events.filter(e => e.aggregateId === aggregateId);
    const eventVersion = existing.length + 1;

    const event: ComplianceEvent = {
      id: ulid(),
      aggregateId,
      aggregateType,
      eventType,
      eventVersion,
      payload,
      metadata,
      vertical: this.vertical,
      createdAt: new Date(),
    };

    this.events.push(event);
    return event;
  }

  async getEvents(aggregateId: string, since?: Date): Promise<ComplianceEvent[]> {
    return this.events
      .filter(e => e.aggregateId === aggregateId)
      .filter(e => !since || new Date(e.createdAt) > since)
      .sort((a, b) => a.eventVersion - b.eventVersion);
  }

  async getAuditTrail(filters: AuditFilters): Promise<PaginatedEvents> {
    let filtered = [...this.events];

    if (filters.aggregateId) filtered = filtered.filter(e => e.aggregateId === filters.aggregateId);
    if (filters.aggregateType) filtered = filtered.filter(e => e.aggregateType === filters.aggregateType);
    if (filters.eventType) filtered = filtered.filter(e => e.eventType === filters.eventType);
    if (filters.actorId) filtered = filtered.filter(e => (e.metadata as any)?.actorId === filters.actorId);
    if (filters.vertical) filtered = filtered.filter(e => e.vertical === filters.vertical);
    if (filters.since) filtered = filtered.filter(e => new Date(e.createdAt) >= filters.since!);
    if (filters.until) filtered = filtered.filter(e => new Date(e.createdAt) <= filters.until!);

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 50;
    const offset = (page - 1) * limit;
    const total = filtered.length;
    const events = filtered.slice(offset, offset + limit);

    return { events, total, page, limit, hasMore: offset + events.length < total };
  }

  async snapshot(aggregateId: string, aggregateType: string): Promise<AggregateSnapshot | null> {
    return this.snapshots.get(`${aggregateId}:${aggregateType}`) ?? null;
  }

  async rebuild<T = Record<string, unknown>>(
    aggregateId: string,
    aggregateType: string,
    reducer: EventReducer<T>,
    initialState: T,
  ): Promise<{ state: T; version: number }> {
    const existing = await this.snapshot(aggregateId, aggregateType);
    let state: T = initialState;
    let fromVersion = 0;

    if (existing) {
      state = existing.state as T;
      fromVersion = existing.version;
    }

    const events = this.events
      .filter(e => e.aggregateId === aggregateId && e.aggregateType === aggregateType && e.eventVersion > fromVersion)
      .sort((a, b) => a.eventVersion - b.eventVersion);

    for (const event of events) {
      state = reducer(state, event);
    }

    const latestVersion = events.length > 0 ? events[events.length - 1].eventVersion : fromVersion;

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
    this.snapshots.set(`${aggregateId}:${aggregateType}`, {
      aggregateId,
      aggregateType,
      state,
      version,
      updatedAt: new Date(),
    });
  }
}
