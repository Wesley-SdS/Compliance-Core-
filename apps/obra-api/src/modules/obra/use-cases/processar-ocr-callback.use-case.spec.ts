import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProcessarOCRCallbackUseCase } from './processar-ocr-callback.use-case';

const mockDb = {
  query: vi.fn(),
  queryOne: vi.fn(),
};
const mockEventStore = { append: vi.fn() };

describe('ProcessarOCRCallbackUseCase', () => {
  let useCase: ProcessarOCRCallbackUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new ProcessarOCRCallbackUseCase(mockDb as any, mockEventStore as any);
  });

  describe('when status is failed', () => {
    it('should update nota fiscal status to ERRO', async () => {
      mockDb.query.mockResolvedValue([]);

      const result = await useCase.execute({
        fileId: 'vektus-123',
        status: 'failed',
      });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("status_ocr = 'ERRO'"),
        ['vektus-123'],
      );
      expect(result.status).toBe('failed');
    });

    it('should not create materials or update gasto', async () => {
      mockDb.query.mockResolvedValue([]);

      await useCase.execute({ fileId: 'vektus-123', status: 'failed' });

      // Only one query call: the status update
      expect(mockDb.query).toHaveBeenCalledTimes(1);
      expect(mockEventStore.append).not.toHaveBeenCalled();
    });
  });

  describe('when status is completed', () => {
    const payload = {
      fileId: 'vektus-456',
      status: 'completed' as const,
      extractedData: {
        fornecedor: 'Materiais ABC Ltda',
        valorTotal: 15000.50,
        itens: [
          { descricao: 'Cimento Portland CP-II', quantidade: 100, unidade: 'saco' },
          { descricao: 'Vergalhao 10mm', quantidade: 50, unidade: 'barra', lote: 'L2026-001' },
        ],
      },
    };

    it('should update nota fiscal with extracted data', async () => {
      mockDb.queryOne
        .mockResolvedValueOnce({ id: 'nf-1', obra_id: 'obra-1' }) // NF lookup
        .mockResolvedValueOnce({ total: '15000.50' }); // gasto total
      mockDb.query.mockResolvedValue([]);
      mockEventStore.append.mockResolvedValue(undefined);

      await useCase.execute(payload);

      const updateCall = mockDb.query.mock.calls[0];
      expect(updateCall[0]).toContain("status_ocr = 'CONCLUIDO'");
      expect(updateCall[1]).toContain('Materiais ABC Ltda');
      expect(updateCall[1]).toContain(15000.50);
    });

    it('should create material entries for each extracted item', async () => {
      mockDb.queryOne
        .mockResolvedValueOnce({ id: 'nf-1', obra_id: 'obra-1' })
        .mockResolvedValueOnce({ total: '15000.50' });
      mockDb.query.mockResolvedValue([]);
      mockEventStore.append.mockResolvedValue(undefined);

      await useCase.execute(payload);

      // Calls: 1 update NF + 2 insert materials + 1 update gasto
      const insertCalls = mockDb.query.mock.calls.filter(
        (call: any) => call[0].includes('INSERT INTO materiais'),
      );
      expect(insertCalls).toHaveLength(2);

      // First material
      expect(insertCalls[0][1]).toContain('Cimento Portland CP-II');
      expect(insertCalls[0][1]).toContain(100);
      expect(insertCalls[0][1]).toContain('saco');

      // Second material
      expect(insertCalls[1][1]).toContain('Vergalhao 10mm');
      expect(insertCalls[1][1]).toContain(50);
      expect(insertCalls[1][1]).toContain('barra');
      expect(insertCalls[1][1]).toContain('L2026-001');
    });

    it('should update gasto_atual on obra from all completed NFs', async () => {
      mockDb.queryOne
        .mockResolvedValueOnce({ id: 'nf-1', obra_id: 'obra-1' })
        .mockResolvedValueOnce({ total: '45000.00' });
      mockDb.query.mockResolvedValue([]);
      mockEventStore.append.mockResolvedValue(undefined);

      await useCase.execute(payload);

      const gastoCall = mockDb.query.mock.calls.find(
        (call: any) => call[0].includes('UPDATE obras SET gasto_atual'),
      );
      expect(gastoCall).toBeDefined();
      expect(gastoCall![1]).toContain(45000);
      expect(gastoCall![1]).toContain('obra-1');
    });

    it('should append NF_PROCESSADA event', async () => {
      mockDb.queryOne
        .mockResolvedValueOnce({ id: 'nf-1', obra_id: 'obra-1' })
        .mockResolvedValueOnce({ total: '15000.50' });
      mockDb.query.mockResolvedValue([]);
      mockEventStore.append.mockResolvedValue(undefined);

      await useCase.execute(payload);

      expect(mockEventStore.append).toHaveBeenCalledWith(
        'obra-1', 'obra', 'NF_PROCESSADA',
        expect.objectContaining({
          notaFiscalId: 'nf-1',
          itensCount: 2,
          valorTotal: 15000.50,
        }),
        expect.objectContaining({ actorId: 'vektus-webhook', actorRole: 'system' }),
      );
    });

    it('should return count of created materials', async () => {
      mockDb.queryOne
        .mockResolvedValueOnce({ id: 'nf-1', obra_id: 'obra-1' })
        .mockResolvedValueOnce({ total: '15000.50' });
      mockDb.query.mockResolvedValue([]);
      mockEventStore.append.mockResolvedValue(undefined);

      const result = await useCase.execute(payload);

      expect(result.status).toBe('processed');
      expect(result.materiaisCriados).toBe(2);
    });

    it('should handle NF not found gracefully', async () => {
      mockDb.queryOne.mockResolvedValue(null);

      const result = await useCase.execute(payload);

      expect(result.status).toBe('nf_not_found');
      expect(mockEventStore.append).not.toHaveBeenCalled();
    });

    it('should handle empty itens array', async () => {
      mockDb.queryOne
        .mockResolvedValueOnce({ id: 'nf-1', obra_id: 'obra-1' })
        .mockResolvedValueOnce({ total: '5000' });
      mockDb.query.mockResolvedValue([]);
      mockEventStore.append.mockResolvedValue(undefined);

      const result = await useCase.execute({
        fileId: 'vektus-789',
        status: 'completed',
        extractedData: { fornecedor: 'Test', valorTotal: 5000, itens: [] },
      });

      const insertCalls = mockDb.query.mock.calls.filter(
        (call: any) => call[0].includes('INSERT INTO materiais'),
      );
      expect(insertCalls).toHaveLength(0);
      expect(result.materiaisCriados).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should ignore non-completed/non-failed status', async () => {
      const result = await useCase.execute({
        fileId: 'vektus-000',
        status: 'completed' as any,
        // no extractedData
      });
      expect(result.status).toBe('ignored');
    });
  });
});
