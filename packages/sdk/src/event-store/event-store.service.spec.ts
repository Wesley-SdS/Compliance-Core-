import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventStoreService } from './event-store.service';

const mockDb = {
  query: vi.fn(),
  queryOne: vi.fn(),
  transaction: vi.fn((fn: any) => fn((text: string, params?: any[]) => mockDb.query(text, params))),
};

const mockConfig = {
  vertical: 'ESTETIK',
};

const mockLogger = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  setContext: vi.fn(),
};

describe('EventStoreService', () => {
  let service: EventStoreService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EventStoreService(mockDb as any, mockConfig as any, mockLogger as any);
  });

  describe('append()', () => {
    it('should insert event with ULID and return event ID', async () => {
      mockDb.queryOne
        .mockResolvedValueOnce({ max_version: 2 }) // getNextVersion
        .mockResolvedValueOnce({
          id: 'evt-1',
          aggregateId: 'agg-1',
          aggregateType: 'Clinica',
          eventType: 'CREATED',
          eventVersion: 3,
          payload: {},
          metadata: {},
          vertical: 'ESTETIK',
          createdAt: new Date(),
        });

      const result = await service.append('agg-1', 'Clinica', 'CREATED', { foo: 'bar' }, {
        actorId: 'user-1',
        correlationId: 'corr-1',
      } as any);

      expect(result).toBeDefined();
      expect(result.id).toBe('evt-1');
      expect(mockDb.queryOne).toHaveBeenCalledTimes(2);
      // First call is getNextVersion, second is the INSERT
      const insertCall = mockDb.queryOne.mock.calls[1];
      expect(insertCall[0]).toContain('INSERT INTO compliance_events');
      // Check ULID was generated (first param)
      expect(insertCall[1][0]).toMatch(/^[0-9A-Z]{26}$/);
    });

    it('should include all required fields (aggregateId, eventType, actorId, correlationId, vertical)', async () => {
      mockDb.queryOne
        .mockResolvedValueOnce({ max_version: 0 })
        .mockResolvedValueOnce({
          id: 'evt-2',
          aggregateId: 'agg-2',
          aggregateType: 'Clinica',
          eventType: 'UPDATED',
          eventVersion: 1,
          payload: { name: 'Test' },
          metadata: { actorId: 'user-2', correlationId: 'corr-2' },
          vertical: 'ESTETIK',
          createdAt: new Date(),
        });

      await service.append('agg-2', 'Clinica', 'UPDATED', { name: 'Test' }, {
        actorId: 'user-2',
        correlationId: 'corr-2',
      } as any);

      const insertParams = mockDb.queryOne.mock.calls[1][1];
      expect(insertParams[1]).toBe('agg-2'); // aggregateId
      expect(insertParams[3]).toBe('UPDATED'); // eventType
      expect(insertParams[4]).toBe(1); // eventVersion
      expect(insertParams[7]).toBe('ESTETIK'); // vertical
      expect(JSON.parse(insertParams[6])).toEqual({ actorId: 'user-2', correlationId: 'corr-2' });
    });
  });

  describe('getEvents()', () => {
    it('should query by aggregateId', async () => {
      const events = [
        { id: 'e1', aggregateId: 'agg-1', eventType: 'CREATED', eventVersion: 1 },
        { id: 'e2', aggregateId: 'agg-1', eventType: 'UPDATED', eventVersion: 2 },
      ];
      mockDb.query.mockResolvedValue(events);

      const result = await service.getEvents('agg-1');

      expect(result).toHaveLength(2);
      expect(mockDb.query).toHaveBeenCalledTimes(1);
      const [sql, params] = mockDb.query.mock.calls[0];
      expect(sql).toContain('WHERE aggregate_id = $1');
      expect(params).toEqual(['agg-1']);
    });

    it('should add date condition when since filter is provided', async () => {
      mockDb.query.mockResolvedValue([]);
      const since = new Date('2025-01-01');

      await service.getEvents('agg-1', since);

      const [sql, params] = mockDb.query.mock.calls[0];
      expect(sql).toContain('AND created_at > $2');
      expect(params).toEqual(['agg-1', since]);
    });
  });

  describe('getAuditTrail()', () => {
    it('should return paginated results with correct total', async () => {
      mockDb.queryOne.mockResolvedValue({ count: '15' });
      mockDb.query.mockResolvedValue([
        { id: 'e1', eventType: 'CREATED' },
        { id: 'e2', eventType: 'UPDATED' },
      ]);

      const result = await service.getAuditTrail({ page: 1, limit: 10 });

      expect(result.total).toBe(15);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.events).toHaveLength(2);
      expect(result.hasMore).toBe(true);
    });

    it('should apply all filters (eventType, actorId, vertical, since, until)', async () => {
      mockDb.queryOne.mockResolvedValue({ count: '3' });
      mockDb.query.mockResolvedValue([]);
      const since = new Date('2025-01-01');
      const until = new Date('2025-12-31');

      await service.getAuditTrail({
        eventType: 'CREATED',
        actorId: 'user-1',
        vertical: 'ESTETIK',
        since,
        until,
        page: 1,
        limit: 50,
      });

      const countSql = mockDb.queryOne.mock.calls[0][0] as string;
      expect(countSql).toContain("event_type = $");
      expect(countSql).toContain("metadata->>'actorId' = $");
      expect(countSql).toContain("vertical = $");
      expect(countSql).toContain("created_at >= $");
      expect(countSql).toContain("created_at <= $");
    });
  });

  describe('snapshot()', () => {
    it('should return existing snapshot from DB', async () => {
      const snap = {
        aggregateId: 'agg-1',
        aggregateType: 'Clinica',
        state: { name: 'Test' },
        version: 5,
        updatedAt: new Date(),
      };
      mockDb.queryOne.mockResolvedValue(snap);

      const result = await service.snapshot('agg-1', 'Clinica');

      expect(result).toEqual(snap);
      expect(mockDb.queryOne).toHaveBeenCalledTimes(1);
      const [sql, params] = mockDb.queryOne.mock.calls[0];
      expect(sql).toContain('compliance_snapshots');
      expect(params).toEqual(['agg-1', 'Clinica']);
    });
  });

  describe('rebuild()', () => {
    it('should replay events through reducer and save snapshot', async () => {
      // No existing snapshot
      mockDb.queryOne.mockResolvedValue(null);
      // Events to replay
      mockDb.query.mockResolvedValueOnce([
        { id: 'e1', eventType: 'INCREMENT', eventVersion: 1, payload: { value: 10 } },
        { id: 'e2', eventType: 'INCREMENT', eventVersion: 2, payload: { value: 20 } },
      ]);
      // saveSnapshot query
      mockDb.query.mockResolvedValueOnce([]);

      const reducer = (state: { total: number }, event: any) => ({
        total: state.total + (event.payload?.value ?? 0),
      });

      const result = await service.rebuild('agg-1', 'Clinica', reducer, { total: 0 });

      expect(result.state).toEqual({ total: 30 });
      expect(result.version).toBe(2);
      // saveSnapshot should have been called
      const saveCalls = mockDb.query.mock.calls.filter((c: any) =>
        c[0].includes('compliance_snapshots'),
      );
      expect(saveCalls.length).toBe(1);
      expect(saveCalls[0][0]).toContain('ON CONFLICT');
    });
  });

  describe('saveSnapshot()', () => {
    it('should upsert with ON CONFLICT', async () => {
      mockDb.query.mockResolvedValue([]);

      await service.saveSnapshot('agg-1', 'Clinica', { name: 'Test' }, 5);

      const [sql, params] = mockDb.query.mock.calls[0];
      expect(sql).toContain('INSERT INTO compliance_snapshots');
      expect(sql).toContain('ON CONFLICT (aggregate_id, aggregate_type)');
      expect(sql).toContain('DO UPDATE SET');
      expect(params[0]).toBe('agg-1');
      expect(params[1]).toBe('Clinica');
      expect(params[3]).toBe(5);
    });
  });
});
