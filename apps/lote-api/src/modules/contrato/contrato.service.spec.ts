import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';

let ulidCounter = 0;
vi.mock('ulid', () => ({
  ulid: () => `MOCK-ULID-${++ulidCounter}`,
}));

import { ContratoService } from './contrato.service';
import { SistemaAmortizacao } from './contrato.dto';

const mockDb = {
  query: vi.fn(),
  queryOne: vi.fn(),
};

const mockEventStore = {
  append: vi.fn(),
};

const mockLogger = {
  setContext: vi.fn(),
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

function createService() {
  return new ContratoService(
    mockDb as any,
    mockEventStore as any,
    mockLogger as any,
  );
}

describe('ContratoService', () => {
  let service: ContratoService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = createService();
  });

  describe('create — PRICE system', () => {
    const dto = {
      loteamentoId: 'lot-001',
      loteId: 'lote-001',
      compradorId: 'comp-001',
      valorTotal: 120000,
      valorEntrada: 20000,
      numeroParcelas: 120,
      taxaJurosMensal: 1,
      sistema: SistemaAmortizacao.PRICE,
    };

    it('inserts contrato and generates parcelas with correct PRICE math', async () => {
      const contratoRow = {
        id: 'ctr-001',
        loteamento_id: 'lot-001',
        lote_id: 'lote-001',
        comprador_id: 'comp-001',
        valor_total: 120000,
        valor_entrada: 20000,
        valor_financiado: 100000,
        numero_parcelas: 120,
        taxa_juros_mensal: 1,
        sistema: 'PRICE',
        status: 'ATIVO',
      };

      // findById calls: queryOne for contrato, query for parcelas
      mockDb.queryOne.mockResolvedValue(contratoRow);
      mockDb.query.mockResolvedValue([]);

      await service.create(dto, 'actor-1');

      // INSERT contrato
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO contratos'),
        expect.arrayContaining(['lot-001', 'lote-001', 'comp-001', 120000, 20000]),
      );

      // 120 parcelas + contrato insert + lote update = 122 db.query calls
      // Plus the final findById query for parcelas
      const insertParcelaCalls = mockDb.query.mock.calls.filter(
        (c: any[]) => typeof c[0] === 'string' && c[0].includes('INSERT INTO parcelas'),
      );
      expect(insertParcelaCalls).toHaveLength(120);

      // Verify PRICE formula: PMT = PV * [i(1+i)^n / ((1+i)^n - 1)]
      const valorFinanciado = 100000;
      const taxaMensal = 0.01;
      const n = 120;
      const coeficiente = (taxaMensal * Math.pow(1 + taxaMensal, n)) / (Math.pow(1 + taxaMensal, n) - 1);
      const prestacaoFixa = valorFinanciado * coeficiente;

      // First parcela: juros = 100000 * 0.01 = 1000
      const firstParcelaArgs = insertParcelaCalls[0][1];
      const firstJuros = firstParcelaArgs[4]; // valor_juros
      const firstPrestacao = firstParcelaArgs[5]; // valor_prestacao
      const firstAmortizacao = firstParcelaArgs[3]; // valor_amortizacao

      expect(firstJuros).toBeCloseTo(1000, 1);
      expect(firstPrestacao).toBeCloseTo(prestacaoFixa, 1);
      expect(firstAmortizacao).toBeCloseTo(prestacaoFixa - 1000, 1);

      // All prestacoes should be the same (PRICE = fixed installment)
      for (const call of insertParcelaCalls) {
        expect(call[1][5]).toBeCloseTo(prestacaoFixa, 0);
      }

      // Last saldo_devedor should be 0
      const lastParcelaArgs = insertParcelaCalls[119][1];
      const lastSaldo = lastParcelaArgs[6]; // saldo_devedor
      expect(lastSaldo).toBeCloseTo(0, 1);

      // Lote updated to VENDIDO
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("SET status = 'VENDIDO'"),
        expect.arrayContaining(['comp-001', 'lote-001']),
      );

      // Event emitted
      expect(mockEventStore.append).toHaveBeenCalledWith(
        'lot-001',
        'loteamento',
        'CONTRATO_CREATED',
        expect.objectContaining({ loteId: 'lote-001', compradorId: 'comp-001' }),
        expect.any(Object),
      );
    });
  });

  describe('create — SAC system', () => {
    const dto = {
      loteamentoId: 'lot-001',
      loteId: 'lote-002',
      compradorId: 'comp-002',
      valorTotal: 120000,
      valorEntrada: 20000,
      numeroParcelas: 120,
      taxaJurosMensal: 1,
      sistema: SistemaAmortizacao.SAC,
    };

    it('generates parcelas with constant amortizacao and decreasing prestacao', async () => {
      const contratoRow = {
        id: 'ctr-002',
        loteamento_id: 'lot-001',
        lote_id: 'lote-002',
        comprador_id: 'comp-002',
        valor_total: 120000,
        valor_financiado: 100000,
        numero_parcelas: 120,
        sistema: 'SAC',
        status: 'ATIVO',
      };

      mockDb.queryOne.mockResolvedValue(contratoRow);
      mockDb.query.mockResolvedValue([]);

      await service.create(dto, 'actor-1');

      const insertParcelaCalls = mockDb.query.mock.calls.filter(
        (c: any[]) => typeof c[0] === 'string' && c[0].includes('INSERT INTO parcelas'),
      );
      expect(insertParcelaCalls).toHaveLength(120);

      const valorFinanciado = 100000;
      const amortizacaoFixa = valorFinanciado / 120; // 833.33...

      // All amortizacao values should be constant
      for (const call of insertParcelaCalls) {
        expect(call[1][3]).toBeCloseTo(amortizacaoFixa, 1); // valor_amortizacao
      }

      // First parcela: juros = 100000 * 0.01 = 1000, prestacao = 833.33 + 1000 = 1833.33
      const firstArgs = insertParcelaCalls[0][1];
      expect(firstArgs[4]).toBeCloseTo(1000, 1); // juros
      expect(firstArgs[5]).toBeCloseTo(1833.33, 0); // prestacao

      // Last parcela: saldo ~= amortizacao, juros ~= saldo * 0.01
      const lastArgs = insertParcelaCalls[119][1];
      expect(lastArgs[6]).toBeCloseTo(0, 1); // saldo_devedor
      // Last juros should be approximately amortizacaoFixa * 0.01 = ~8.33
      expect(lastArgs[4]).toBeCloseTo(8.33, 0);
      // Last prestacao = amortizacao + juros ~= 833.33 + 8.33 = 841.67
      expect(lastArgs[5]).toBeCloseTo(841.67, 0);

      // Prestacao should decrease over time (SAC characteristic)
      const firstPrestacao = insertParcelaCalls[0][1][5];
      const lastPrestacao = insertParcelaCalls[119][1][5];
      expect(firstPrestacao).toBeGreaterThan(lastPrestacao);
    });
  });

  describe('registrarPagamento', () => {
    it('updates parcela status to PAGO', async () => {
      const contrato = {
        id: 'ctr-001',
        loteamento_id: 'lot-001',
        lote_id: 'lote-001',
        comprador_id: 'comp-001',
        status: 'ATIVO',
      };
      const parcela = {
        id: 'par-001',
        contrato_id: 'ctr-001',
        numero: 1,
        valor_prestacao: 1520.85,
        status: 'PENDENTE',
      };

      // findById (queryOne for contrato), then queryOne for parcela
      mockDb.queryOne
        .mockResolvedValueOnce(contrato)   // findById -> contrato
        .mockResolvedValueOnce(parcela)    // parcela lookup
        .mockResolvedValueOnce({ count: '119' }) // pendentes count
        .mockResolvedValueOnce(contrato);  // final findById
      mockDb.query.mockResolvedValue([]);  // parcelas list in findById

      await service.registrarPagamento('ctr-001', {
        parcelaNumero: 1,
        valorPago: 1520.85,
        dataPagamento: '2026-04-01',
      }, 'actor-1');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("SET status = 'PAGO'"),
        expect.arrayContaining([1520.85, '2026-04-01', 'ctr-001', 1]),
      );

      expect(mockEventStore.append).toHaveBeenCalledWith(
        'lot-001',
        'loteamento',
        'PAGAMENTO_REGISTRADO',
        expect.objectContaining({ parcelaNumero: 1, quitado: false }),
        expect.any(Object),
      );
    });

    it('sets contrato to QUITADO when all parcelas are paid', async () => {
      const contrato = {
        id: 'ctr-001',
        loteamento_id: 'lot-001',
        lote_id: 'lote-001',
        status: 'ATIVO',
      };
      const parcela = {
        id: 'par-120',
        contrato_id: 'ctr-001',
        numero: 120,
        valor_prestacao: 841.67,
        status: 'PENDENTE',
      };

      mockDb.queryOne
        .mockResolvedValueOnce(contrato)   // findById
        .mockResolvedValueOnce(parcela)    // parcela lookup
        .mockResolvedValueOnce({ count: '0' }) // 0 pendentes = all paid
        .mockResolvedValueOnce({ ...contrato, status: 'QUITADO' }); // final findById
      mockDb.query.mockResolvedValue([]);

      await service.registrarPagamento('ctr-001', {
        parcelaNumero: 120,
        valorPago: 841.67,
        dataPagamento: '2036-03-01',
      }, 'actor-1');

      // Should update contrato to QUITADO
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("SET status = 'QUITADO'"),
        expect.arrayContaining(['ctr-001']),
      );

      expect(mockEventStore.append).toHaveBeenCalledWith(
        'lot-001',
        'loteamento',
        'PAGAMENTO_REGISTRADO',
        expect.objectContaining({ quitado: true }),
        expect.any(Object),
      );
    });

    it('throws NotFoundException when parcela does not exist', async () => {
      const contrato = {
        id: 'ctr-001',
        loteamento_id: 'lot-001',
        status: 'ATIVO',
      };

      mockDb.queryOne
        .mockResolvedValueOnce(contrato) // findById
        .mockResolvedValueOnce(null);    // parcela not found
      mockDb.query.mockResolvedValue([]);

      await expect(
        service.registrarPagamento('ctr-001', {
          parcelaNumero: 999,
          valorPago: 1000,
          dataPagamento: '2026-04-01',
        }, 'actor-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when parcela is already paid', async () => {
      const contrato = {
        id: 'ctr-001',
        loteamento_id: 'lot-001',
        status: 'ATIVO',
      };
      const parcelaPaga = {
        id: 'par-001',
        contrato_id: 'ctr-001',
        numero: 1,
        status: 'PAGO',
      };

      mockDb.queryOne
        .mockResolvedValueOnce(contrato)
        .mockResolvedValueOnce(parcelaPaga);
      mockDb.query.mockResolvedValue([]);

      await expect(
        service.registrarPagamento('ctr-001', {
          parcelaNumero: 1,
          valorPago: 1000,
          dataPagamento: '2026-04-01',
        }, 'actor-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('distratar', () => {
    it('sets contrato to DISTRATADO and lote back to DISPONIVEL', async () => {
      const contrato = {
        id: 'ctr-001',
        loteamento_id: 'lot-001',
        lote_id: 'lote-001',
        comprador_id: 'comp-001',
        status: 'ATIVO',
      };

      mockDb.queryOne
        .mockResolvedValueOnce(contrato)   // first findById
        .mockResolvedValueOnce({ ...contrato, status: 'DISTRATADO' }); // final findById
      mockDb.query.mockResolvedValue([]);

      await service.distratar('ctr-001', 'actor-1');

      // Contrato set to DISTRATADO
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("SET status = 'DISTRATADO'"),
        expect.arrayContaining(['ctr-001']),
      );

      // Lote set back to DISPONIVEL
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("SET status = 'DISPONIVEL'"),
        expect.arrayContaining(['lote-001']),
      );

      // Event emitted
      expect(mockEventStore.append).toHaveBeenCalledWith(
        'lot-001',
        'loteamento',
        'CONTRATO_DISTRATADO',
        expect.objectContaining({ contratoId: 'ctr-001', loteId: 'lote-001' }),
        expect.any(Object),
      );
    });

    it('throws NotFoundException when contrato does not exist', async () => {
      mockDb.queryOne.mockResolvedValue(null);

      await expect(service.distratar('ctr-999', 'actor-1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('returns contrato with parcelas', async () => {
      const contrato = {
        id: 'ctr-001',
        loteamento_id: 'lot-001',
        status: 'ATIVO',
        comprador_nome: 'Joao Silva',
      };
      const parcelas = [
        { id: 'par-001', numero: 1, status: 'PAGO' },
        { id: 'par-002', numero: 2, status: 'PENDENTE' },
      ];

      mockDb.queryOne.mockResolvedValue(contrato);
      mockDb.query.mockResolvedValue(parcelas);

      const result = await service.findById('ctr-001');

      expect(result.id).toBe('ctr-001');
      expect(result.parcelas).toHaveLength(2);
    });

    it('throws NotFoundException when contrato not found', async () => {
      mockDb.queryOne.mockResolvedValue(null);

      await expect(service.findById('ctr-999'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getParcelas', () => {
    it('returns parcelas ordered by numero', async () => {
      mockDb.queryOne.mockResolvedValue({ id: 'ctr-001' });
      const parcelas = [
        { id: 'par-001', numero: 1 },
        { id: 'par-002', numero: 2 },
      ];
      mockDb.query.mockResolvedValue(parcelas);

      const result = await service.getParcelas('ctr-001');

      expect(result).toHaveLength(2);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY numero'),
        ['ctr-001'],
      );
    });

    it('throws NotFoundException when contrato not found', async () => {
      mockDb.queryOne.mockResolvedValue(null);

      await expect(service.getParcelas('ctr-999'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
