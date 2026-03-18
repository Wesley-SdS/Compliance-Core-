import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { CalculoService } from './calculo.service';
import { SimularCalculoDto } from './calculo.dto';

const mockDb = {
  query: vi.fn(),
  queryOne: vi.fn(),
  transaction: vi.fn((fn: any) => fn(vi.fn())),
};

const mockEventStore = {
  append: vi.fn(),
  getByEntity: vi.fn().mockResolvedValue([]),
};

const mockLogger = {
  setContext: vi.fn(),
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};

function createService() {
  return new CalculoService(
    mockDb as any,
    mockEventStore as any,
    mockLogger as any,
  );
}

describe('CalculoService', () => {
  let service: CalculoService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = createService();
  });

  describe('simular', () => {
    const dto = {
      empresaId: 'emp-001',
      faturamentoBruto: 100000,
      tipoOperacao: 'VENDA_MERCADORIA' as const,
      competencia: '2033-01',
    } as SimularCalculoDto;

    it('busca regime da empresa, calcula via engine e persiste no DB', async () => {
      mockDb.queryOne.mockResolvedValue({ regime_tributario: 'LUCRO_PRESUMIDO' });

      const result = await service.simular(dto, 'actor-1');

      // Deve buscar regime da empresa
      expect(mockDb.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('SELECT regime_tributario FROM empresas'),
        ['emp-001'],
      );

      // Deve persistir via transaction
      expect(mockDb.transaction).toHaveBeenCalledTimes(1);

      // Deve emitir evento
      expect(mockEventStore.append).toHaveBeenCalledWith(
        'emp-001',
        'empresa',
        'CALCULO_SIMULADO',
        expect.objectContaining({ tipoOperacao: 'VENDA_MERCADORIA' }),
        expect.objectContaining({ actorId: 'actor-1' }),
      );

      // Resultado do engine
      expect(result.id).toBeDefined();
      expect(result.empresaId).toBe('emp-001');
      expect(result.faturamentoBruto).toBe(100000);
      expect(result.cbs).toBe(8800);
      expect(result.ibs).toBe(17700);
      expect(result.totalTributos).toBe(26500);
      expect(result.cargaTributariaEfetiva).toBe(26.5);
      expect(result.valorLiquido).toBe(73500);
      expect(result.competencia).toBe('2033-01');
      expect(result.simuladoEm).toBeInstanceOf(Date);
    });

    it('aplica fator de transicao usando ano da competencia', async () => {
      mockDb.queryOne.mockResolvedValue(null);

      const result = await service.simular(
        { ...dto, competencia: '2026-06' } as SimularCalculoDto,
        'actor-1',
      );

      // 2026: cbsFator=0.1, ibsFator=0.05
      expect(result.cbs).toBe(880);
      expect(result.ibs).toBe(885);
    });

    it('usa ano 2033 quando competencia nao informada', async () => {
      mockDb.queryOne.mockResolvedValue(null);

      const result = await service.simular(
        { ...dto, competencia: undefined as any } as SimularCalculoDto,
        'actor-1',
      );

      // Aliquotas cheias de 2033
      expect(result.cbs).toBe(8800);
      expect(result.ibs).toBe(17700);
    });
  });

  describe('getHistorico', () => {
    it('retorna resultados paginados', async () => {
      const rows = [{ id: 'c1' }, { id: 'c2' }];
      mockDb.query.mockResolvedValue(rows);
      mockDb.queryOne.mockResolvedValue({ count: '5' });

      const result = await service.getHistorico('emp-001', 1, 2);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $2 OFFSET $3'),
        ['emp-001', 2, 0],
      );
      expect(result).toEqual({
        data: rows,
        total: 5,
        page: 1,
        limit: 2,
        hasMore: true,
      });
    });

    it('retorna hasMore false quando nao ha mais itens', async () => {
      mockDb.query.mockResolvedValue([{ id: 'c1' }]);
      mockDb.queryOne.mockResolvedValue({ count: '1' });

      const result = await service.getHistorico('emp-001', 1, 20);

      expect(result.hasMore).toBe(false);
    });

    it('usa defaults para page e limit', async () => {
      mockDb.query.mockResolvedValue([]);
      mockDb.queryOne.mockResolvedValue({ count: '0' });

      const result = await service.getHistorico('emp-001');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.any(String),
        ['emp-001', 20, 0],
      );
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  describe('projetar', () => {
    it('retorna projecao de 8 anos (2026-2033)', async () => {
      mockDb.queryOne
        .mockResolvedValueOnce({ regime_tributario: 'LUCRO_PRESUMIDO' }) // empresa
        .mockResolvedValueOnce({ faturamento_bruto: 200000, tipo_operacao: 'VENDA_MERCADORIA' }); // ultimo calculo

      const result = await service.projetar('emp-001');

      expect(result).toHaveLength(8);
      expect(result[0].ano).toBe(2026);
      expect(result[7].ano).toBe(2033);
    });

    it('usa valores default quando nao ha calculo anterior', async () => {
      mockDb.queryOne
        .mockResolvedValueOnce({ regime_tributario: 'SIMPLES_NACIONAL' })
        .mockResolvedValueOnce(null);

      const result = await service.projetar('emp-001');

      expect(result).toHaveLength(8);
      // Deve usar faturamentoBruto=100000 e tipoOperacao=VENDA_MERCADORIA
      expect(result[0].regimeAtual).toBeGreaterThanOrEqual(0);
    });

    it('lanca NotFoundException quando empresa nao existe', async () => {
      mockDb.queryOne.mockResolvedValue(null);

      await expect(service.projetar('inexistente')).rejects.toThrow(NotFoundException);
    });
  });
});
