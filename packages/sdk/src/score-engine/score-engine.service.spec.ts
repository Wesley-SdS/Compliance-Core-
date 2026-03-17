import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScoreEngineService } from './score-engine.service';

const mockDb = {
  query: vi.fn(),
  queryOne: vi.fn(),
  transaction: vi.fn((fn: any) => fn((text: string, params?: any[]) => mockDb.query(text, params))),
};

const mockLogger = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  setContext: vi.fn(),
};

function makeCriterion(id: string, weight: number, evaluate: (entity: any) => any) {
  return { id, name: id, weight, category: 'test', evaluate };
}

describe('ScoreEngineService', () => {
  let service: ScoreEngineService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ScoreEngineService(mockDb as any, mockLogger as any);
    // saveScore is called after calculate; mock the INSERT
    mockDb.query.mockResolvedValue([]);
  });

  describe('calculate()', () => {
    it('with all CONFORME criteria returns score 100 and level EXCELENTE', async () => {
      // determineTrend needs recent scores
      mockDb.query.mockResolvedValueOnce([]); // determineTrend: no recent scores
      mockDb.query.mockResolvedValueOnce([]); // saveScore

      const criteria = [
        makeCriterion('c1', 10, () => ({ criterionId: 'c1', status: 'CONFORME', score: 100 })),
        makeCriterion('c2', 10, () => ({ criterionId: 'c2', status: 'CONFORME', score: 100 })),
      ];

      const result = await service.calculate('agg-1', criteria, {});

      expect(result.overall).toBe(100);
      expect(result.level).toBe('EXCELENTE');
    });

    it('with all NAO_CONFORME returns score 0 and level CRITICO', async () => {
      mockDb.query.mockResolvedValueOnce([]);
      mockDb.query.mockResolvedValueOnce([]);

      const criteria = [
        makeCriterion('c1', 10, () => ({ criterionId: 'c1', status: 'NAO_CONFORME', score: 0 })),
        makeCriterion('c2', 10, () => ({ criterionId: 'c2', status: 'NAO_CONFORME', score: 0 })),
      ];

      const result = await service.calculate('agg-1', criteria, {});

      expect(result.overall).toBe(0);
      expect(result.level).toBe('CRITICO');
    });

    it('with mixed results returns weighted average', async () => {
      mockDb.query.mockResolvedValueOnce([]);
      mockDb.query.mockResolvedValueOnce([]);

      const criteria = [
        makeCriterion('c1', 20, () => ({ criterionId: 'c1', status: 'CONFORME', score: 100 })),
        makeCriterion('c2', 10, () => ({ criterionId: 'c2', status: 'NAO_CONFORME', score: 0 })),
      ];

      const result = await service.calculate('agg-1', criteria, {});

      // weighted: (100*20 + 0*10) / 30 = 66.67
      expect(result.overall).toBeCloseTo(66.67, 1);
      expect(result.level).toBe('BOM');
    });

    it('with NAO_APLICAVEL still uses weight in calculation (score=100)', async () => {
      mockDb.query.mockResolvedValueOnce([]);
      mockDb.query.mockResolvedValueOnce([]);

      const criteria = [
        makeCriterion('c1', 10, () => ({ criterionId: 'c1', status: 'CONFORME', score: 100 })),
        makeCriterion('c2', 10, () => ({ criterionId: 'c2', status: 'NAO_APLICAVEL', score: 100 })),
      ];

      const result = await service.calculate('agg-1', criteria, {});

      // Both have score 100, so overall = 100
      expect(result.overall).toBe(100);
      expect(result.level).toBe('EXCELENTE');
    });

    it('assigns CRITICO level for score < 40', async () => {
      mockDb.query.mockResolvedValueOnce([]);
      mockDb.query.mockResolvedValueOnce([]);

      const criteria = [
        makeCriterion('c1', 10, () => ({ criterionId: 'c1', score: 30 })),
      ];

      const result = await service.calculate('agg-1', criteria, {});

      expect(result.overall).toBe(30);
      expect(result.level).toBe('CRITICO');
    });

    it('assigns ATENCAO level for score 40-59', async () => {
      mockDb.query.mockResolvedValueOnce([]);
      mockDb.query.mockResolvedValueOnce([]);

      const criteria = [
        makeCriterion('c1', 10, () => ({ criterionId: 'c1', score: 50 })),
      ];

      const result = await service.calculate('agg-1', criteria, {});

      expect(result.overall).toBe(50);
      expect(result.level).toBe('ATENCAO');
    });

    it('assigns BOM level for score 60-79', async () => {
      mockDb.query.mockResolvedValueOnce([]);
      mockDb.query.mockResolvedValueOnce([]);

      const criteria = [
        makeCriterion('c1', 10, () => ({ criterionId: 'c1', score: 70 })),
      ];

      const result = await service.calculate('agg-1', criteria, {});

      expect(result.overall).toBe(70);
      expect(result.level).toBe('BOM');
    });

    it('assigns EXCELENTE level for score >= 80', async () => {
      mockDb.query.mockResolvedValueOnce([]);
      mockDb.query.mockResolvedValueOnce([]);

      const criteria = [
        makeCriterion('c1', 10, () => ({ criterionId: 'c1', score: 85 })),
      ];

      const result = await service.calculate('agg-1', criteria, {});

      expect(result.overall).toBe(85);
      expect(result.level).toBe('EXCELENTE');
    });
  });

  describe('determineTrend()', () => {
    it('increasing scores -> MELHORANDO', async () => {
      // scores returned DESC: most recent first. Current=90, previous [80, 70]
      // allScores = [90, 80, 70]. diff[0]=90-80=10>1 (increasing), diff[1]=80-70=10>1 (increasing)
      mockDb.query.mockResolvedValue([{ overall: 80 }, { overall: 70 }]);

      const result = await service.determineTrend('agg-1', 90);

      expect(result).toBe('MELHORANDO');
    });

    it('decreasing scores -> PIORANDO', async () => {
      // allScores = [50, 70, 80]. diff[0]=50-70=-20<-1 (decreasing), diff[1]=70-80=-10<-1 (decreasing)
      mockDb.query.mockResolvedValue([{ overall: 70 }, { overall: 80 }]);

      const result = await service.determineTrend('agg-1', 50);

      expect(result).toBe('PIORANDO');
    });

    it('stable scores -> ESTAVEL', async () => {
      // allScores = [70, 70, 70]. diff[0]=0 (neither), diff[1]=0 (neither)
      mockDb.query.mockResolvedValue([{ overall: 70 }, { overall: 70 }]);

      const result = await service.determineTrend('agg-1', 70);

      expect(result).toBe('ESTAVEL');
    });

    it('returns ESTAVEL when fewer than 2 recent scores', async () => {
      mockDb.query.mockResolvedValue([]);

      const result = await service.determineTrend('agg-1', 80);

      expect(result).toBe('ESTAVEL');
    });
  });

  describe('getHistory()', () => {
    it('queries scores within date range', async () => {
      const start = new Date('2025-01-01');
      const end = new Date('2025-12-31');
      mockDb.query.mockResolvedValue([
        { id: 's1', overall: 80, level: 'EXCELENTE', calculatedAt: new Date('2025-03-01') },
        { id: 's2', overall: 60, level: 'BOM', calculatedAt: new Date('2025-06-01') },
      ]);

      const result = await service.getHistory('agg-1', { start, end });

      expect(result.scores).toHaveLength(2);
      expect(result.average).toBe(70);
      expect(result.min).toBe(60);
      expect(result.max).toBe(80);
      const [sql, params] = mockDb.query.mock.calls[0];
      expect(sql).toContain('calculated_at >= $2');
      expect(sql).toContain('calculated_at <= $3');
      expect(params).toEqual(['agg-1', start, end]);
    });

    it('returns empty history when no scores found', async () => {
      mockDb.query.mockResolvedValue([]);

      const result = await service.getHistory('agg-1', {
        start: new Date('2025-01-01'),
        end: new Date('2025-12-31'),
      });

      expect(result.scores).toHaveLength(0);
      expect(result.trend).toBe('ESTAVEL');
      expect(result.average).toBe(0);
    });
  });
});
