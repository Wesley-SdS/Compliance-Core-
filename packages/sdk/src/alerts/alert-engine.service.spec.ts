import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AlertEngineService } from './alert-engine.service';

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

describe('AlertEngineService', () => {
  let service: AlertEngineService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AlertEngineService(mockDb as any, mockConfig as any, mockLogger as any);
  });

  describe('register()', () => {
    it('should insert alert with PENDING status and return ID', async () => {
      mockDb.query.mockResolvedValue([]);

      const id = await service.register({
        entityId: 'entity-1',
        entityType: 'Clinica',
        vertical: 'ESTETIK',
        alertType: 'DOC_EXPIRY',
        dueDate: new Date('2025-06-01'),
        daysBeforeAlert: [30, 7, 1],
        channels: ['email', 'push'],
      } as any);

      expect(id).toMatch(/^[0-9A-Z]{26}$/);
      const [sql, params] = mockDb.query.mock.calls[0];
      expect(sql).toContain('INSERT INTO compliance_alerts');
      expect(sql).toContain("'PENDING'");
      expect(params[1]).toBe('entity-1');
    });

    it('should store daysBeforeAlert and channels correctly', async () => {
      mockDb.query.mockResolvedValue([]);

      await service.register({
        entityId: 'entity-1',
        entityType: 'Clinica',
        vertical: 'ESTETIK',
        alertType: 'LICENSE_RENEWAL',
        dueDate: new Date('2025-06-01'),
        daysBeforeAlert: [30, 14, 7],
        channels: ['email', 'sms'],
      } as any);

      const params = mockDb.query.mock.calls[0][1];
      expect(JSON.parse(params[6])).toEqual([30, 14, 7]); // daysBeforeAlert
      expect(JSON.parse(params[7])).toEqual(['email', 'sms']); // channels
    });
  });

  describe('checkDue()', () => {
    it('should return alerts where current date matches alert window', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from today

      mockDb.query.mockResolvedValueOnce([
        {
          id: 'alert-1',
          entity_id: 'entity-1',
          entity_type: 'Clinica',
          alert_type: 'DOC_EXPIRY',
          due_date: dueDate,
          days_before_alert: [30, 7, 1],
          channels: ['email'],
          status: 'PENDING',
        },
      ]);
      // transaction mock already handles the update calls

      const result = await service.checkDue();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('alert-1');
      expect(result[0].daysUntilDue).toBe(7);
      expect(result[0].status).toBe('SENT');
    });

    it('should not return already acknowledged alerts', async () => {
      // The query only fetches PENDING alerts, so acknowledged ones are excluded
      mockDb.query.mockResolvedValueOnce([]); // no PENDING alerts

      const result = await service.checkDue();

      expect(result).toHaveLength(0);
      const [sql] = mockDb.query.mock.calls[0];
      expect(sql).toContain("status = 'PENDING'");
    });

    it('should not return alerts where daysUntilDue does not match daysBeforeAlert', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days

      mockDb.query.mockResolvedValueOnce([
        {
          id: 'alert-2',
          entity_id: 'entity-2',
          entity_type: 'Clinica',
          alert_type: 'DOC_EXPIRY',
          due_date: dueDate,
          days_before_alert: [30, 7, 1], // 5 not in this list
          channels: ['email'],
          status: 'PENDING',
        },
      ]);

      const result = await service.checkDue();

      expect(result).toHaveLength(0);
    });
  });

  describe('acknowledge()', () => {
    it('should update status to ACKNOWLEDGED with timestamp', async () => {
      mockDb.query.mockResolvedValue([]);

      await service.acknowledge('alert-1');

      const [sql, params] = mockDb.query.mock.calls[0];
      expect(sql).toContain("status = 'ACKNOWLEDGED'");
      expect(sql).toContain('updated_at = NOW()');
      expect(params).toEqual(['alert-1']);
    });
  });

  describe('getUpcoming()', () => {
    it('should return alerts within specified days range', async () => {
      mockDb.query.mockResolvedValue([
        {
          id: 'alert-1',
          entity_id: 'entity-1',
          entity_type: 'Clinica',
          alert_type: 'DOC_EXPIRY',
          due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          status: 'PENDING',
          channels: ['email'],
        },
      ]);

      const result = await service.getUpcoming('entity-1', 30);

      expect(result).toHaveLength(1);
      expect(result[0].entityId).toBe('entity-1');
      expect(result[0].daysUntilDue).toBeGreaterThan(0);
    });

    it('should filter by entityId', async () => {
      mockDb.query.mockResolvedValue([]);

      await service.getUpcoming('entity-99', 15);

      const [sql, params] = mockDb.query.mock.calls[0];
      expect(sql).toContain('entity_id = $1');
      expect(params[0]).toBe('entity-99');
    });
  });
});
