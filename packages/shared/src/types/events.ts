import type { Vertical } from './common.js';

export interface ComplianceEvent {
  id: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  eventVersion: number;
  payload: Record<string, unknown>;
  metadata: EventMetadata;
  vertical: Vertical;
  createdAt: Date;
}

export interface EventMetadata {
  actorId: string;
  actorRole: string;
  ip: string;
  userAgent?: string;
  correlationId: string;
}

export interface AuditFilters {
  aggregateId?: string;
  aggregateType?: string;
  eventType?: string;
  actorId?: string;
  vertical?: Vertical;
  since?: Date;
  until?: Date;
  page?: number;
  limit?: number;
}

export interface PaginatedEvents {
  events: ComplianceEvent[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface AggregateSnapshot {
  aggregateId: string;
  aggregateType: string;
  state: Record<string, unknown>;
  version: number;
  updatedAt: Date;
}

export type EventReducer<T = any> = (state: T, event: ComplianceEvent) => T;
