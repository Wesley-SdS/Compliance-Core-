import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChecklistEngineService } from './checklist-engine.service';

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

const mockVektus = {
  search: vi.fn(),
  ingest: vi.fn(),
};

describe('ChecklistEngineService', () => {
  let service: ChecklistEngineService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ChecklistEngineService(
      mockDb as any,
      mockConfig as any,
      mockLogger as any,
      mockVektus as any,
    );
  });

  describe('generate()', () => {
    it('should call Vektus search for requirements', async () => {
      mockVektus.search.mockResolvedValue([]);
      mockDb.query.mockResolvedValue([]);

      await service.generate('agg-1', 'Clinica');

      expect(mockVektus.search).toHaveBeenCalledTimes(1);
      const searchQuery = mockVektus.search.mock.calls[0][0];
      expect(searchQuery).toContain('Clinica');
      expect(searchQuery).toContain('ESTETIK');
    });

    it('should return checklist with items from Vektus results', async () => {
      mockVektus.search.mockResolvedValue([
        {
          content: '1. A clínica deve possuir alvará de funcionamento válido?',
          metadata: { category: 'Licencas', regulationRef: 'RDC-50' },
        },
      ]);
      mockDb.query.mockResolvedValue([]);

      const result = await service.generate('agg-1', 'Clinica');

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.status).toBe('PENDING');
      expect(result.aggregateId).toBe('agg-1');
      expect(result.vertical).toBe('ESTETIK');
    });

    it('should use fallback items when Vektus returns empty', async () => {
      mockVektus.search.mockResolvedValue([]);
      mockDb.query.mockResolvedValue([]);

      const result = await service.generate('agg-1', 'Clinica');

      // Should have default items
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items[0].question).toContain('alvarás');
    });
  });

  describe('evaluate()', () => {
    const mockChecklist = {
      id: 'chk-1',
      aggregateId: 'agg-1',
      entityType: 'Clinica',
      vertical: 'ESTETIK',
      items: [
        { id: 'item-1', question: 'Q1', category: 'Cat1', required: true },
        { id: 'item-2', question: 'Q2', category: 'Cat2', required: true },
        { id: 'item-3', question: 'Q3', category: 'Cat3', required: false },
      ],
      status: 'PENDING',
      createdAt: new Date(),
    };

    it('should calculate correct score (conforme=1, parcial=0.5, nao_conforme=0)', async () => {
      mockDb.queryOne.mockResolvedValue(mockChecklist);
      mockDb.query.mockResolvedValue([]);

      const responses = [
        { itemId: 'item-1', answer: 'SIM' },      // conforme
        { itemId: 'item-2', answer: 'PARCIAL' },   // 0.5
        { itemId: 'item-3', answer: 'NAO' },        // 0
      ];

      const result = await service.evaluate('chk-1', responses as any);

      // score = (1 + 0.5) / 3 * 100 = 50
      expect(result.score).toBe(50);
      expect(result.conformeCount).toBe(1);
      expect(result.parcialCount).toBe(1);
      expect(result.naoConformeCount).toBe(1);
    });

    it('should exclude NA items from denominator', async () => {
      mockDb.queryOne.mockResolvedValue(mockChecklist);
      mockDb.query.mockResolvedValue([]);

      const responses = [
        { itemId: 'item-1', answer: 'SIM' },
        { itemId: 'item-2', answer: 'SIM' },
        { itemId: 'item-3', answer: 'NA' },
      ];

      const result = await service.evaluate('chk-1', responses as any);

      // score = (2) / (3-1) * 100 = 100
      expect(result.score).toBe(100);
      expect(result.naCount).toBe(1);
    });

    it('should wrap inserts in transaction (verify transaction was called)', async () => {
      mockDb.queryOne.mockResolvedValue(mockChecklist);
      mockDb.query.mockResolvedValue([]);

      const responses = [
        { itemId: 'item-1', answer: 'SIM' },
      ];

      await service.evaluate('chk-1', responses as any);

      expect(mockDb.transaction).toHaveBeenCalledTimes(1);
      // The transaction callback should have called query multiple times:
      // 1 for checklist_results INSERT, 1 for each response INSERT, 1 for status UPDATE
      const queryCalls = mockDb.query.mock.calls;
      const insertResultCall = queryCalls.find((c: any) => c[0].includes('checklist_results'));
      const insertResponseCall = queryCalls.find((c: any) => c[0].includes('checklist_responses'));
      const updateStatusCall = queryCalls.find((c: any) => c[0].includes('UPDATE compliance_checklists'));
      expect(insertResultCall).toBeDefined();
      expect(insertResponseCall).toBeDefined();
      expect(updateStatusCall).toBeDefined();
    });

    it('should throw if checklist not found', async () => {
      mockDb.queryOne.mockResolvedValue(null);

      await expect(service.evaluate('bad-id', [])).rejects.toThrow(
        'Checklist not found: bad-id',
      );
    });
  });
});
