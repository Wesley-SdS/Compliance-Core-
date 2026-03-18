import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { DecisaoService } from './decisao.service';

const mockTransactionQueryFn = vi.fn();
const mockDb = {
  query: vi.fn(),
  queryOne: vi.fn(),
  transaction: vi.fn((fn: any) => fn(mockTransactionQueryFn)),
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
  return new DecisaoService(
    mockDb as any,
    mockEventStore as any,
    mockLogger as any,
  );
}

describe('DecisaoService', () => {
  let service: DecisaoService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTransactionQueryFn.mockReset();
    service = createService();
  });

  describe('create', () => {
    const dto = {
      empresaId: 'emp-001',
      descricao: 'Optar por credito presumido de ICMS',
      fundamentacaoLegal: 'Art. 20 da LC 87/96',
      simulacaoId: 'sim-001',
    };

    it('gera assinatura SHA256, insere via transacao e emite evento', async () => {
      const decisaoRow = { id: 'dec-001', ...dto, assinatura: 'abc123' };
      mockDb.queryOne.mockResolvedValue(decisaoRow);

      const result = await service.create(dto, 'actor-1');

      // Deve usar transacao
      expect(mockDb.transaction).toHaveBeenCalledTimes(1);

      // Deve inserir decisao
      const insertCall = mockTransactionQueryFn.mock.calls[0];
      expect(insertCall[0]).toContain('INSERT INTO decisoes_fiscais');
      const insertParams = insertCall[1];
      expect(insertParams).toContain('emp-001');
      expect(insertParams).toContain('Optar por credito presumido de ICMS');
      expect(insertParams).toContain('Art. 20 da LC 87/96');
      expect(insertParams).toContain('sim-001');
      // Assinatura deve ser um hash hex de 64 chars (SHA256)
      const assinatura = insertParams[5];
      expect(assinatura).toMatch(/^[a-f0-9]{64}$/);

      // Deve vincular simulacao (update calculos_tributarios)
      const updateCall = mockTransactionQueryFn.mock.calls[1];
      expect(updateCall[0]).toContain('UPDATE calculos_tributarios SET decisao_id');
      expect(updateCall[1]).toContain('sim-001');

      // Deve emitir evento
      expect(mockEventStore.append).toHaveBeenCalledWith(
        'emp-001',
        'empresa',
        'DECISAO_FISCAL_REGISTRADA',
        expect.objectContaining({
          fundamentacaoLegal: 'Art. 20 da LC 87/96',
          assinatura: expect.stringMatching(/^[a-f0-9]{64}$/),
        }),
        expect.objectContaining({ actorId: 'actor-1' }),
      );

      expect(result).toEqual(decisaoRow);
    });

    it('nao vincula simulacao quando simulacaoId nao fornecido', async () => {
      const dtoSemSim = {
        empresaId: 'emp-001',
        descricao: 'Decisao sem simulacao',
        fundamentacaoLegal: 'Art. 1',
      };

      mockDb.queryOne.mockResolvedValue({ id: 'dec-002' });

      await service.create(dtoSemSim as any, 'actor-1');

      // Apenas 1 chamada na transacao (INSERT), sem UPDATE
      expect(mockTransactionQueryFn).toHaveBeenCalledTimes(1);
      expect(mockTransactionQueryFn.mock.calls[0][0]).toContain('INSERT INTO decisoes_fiscais');
    });

    it('gera assinaturas diferentes para payloads diferentes', async () => {
      mockDb.queryOne.mockResolvedValue({ id: 'dec-001' });

      await service.create(dto, 'actor-1');
      const assinatura1 = mockTransactionQueryFn.mock.calls[0][1][5];

      vi.clearAllMocks();
      mockTransactionQueryFn.mockReset();

      mockDb.queryOne.mockResolvedValue({ id: 'dec-002' });

      await service.create(
        { ...dto, descricao: 'Outra decisao diferente' },
        'actor-2',
      );
      const assinatura2 = mockTransactionQueryFn.mock.calls[0][1][5];

      expect(assinatura1).not.toBe(assinatura2);
    });
  });

  describe('findByEmpresa', () => {
    it('retorna decisoes da empresa ordenadas por created_at DESC', async () => {
      const rows = [
        { id: 'dec-2', created_at: '2025-02-01' },
        { id: 'dec-1', created_at: '2025-01-01' },
      ];
      mockDb.query.mockResolvedValue(rows);

      const result = await service.findByEmpresa('emp-001');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE empresa_id = $1 ORDER BY created_at DESC'),
        ['emp-001'],
      );
      expect(result).toEqual(rows);
    });

    it('retorna array vazio quando empresa nao tem decisoes', async () => {
      mockDb.query.mockResolvedValue([]);

      const result = await service.findByEmpresa('emp-sem-decisoes');

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('retorna decisao encontrada', async () => {
      const decisao = { id: 'dec-001', descricao: 'Teste' };
      mockDb.queryOne.mockResolvedValue(decisao);

      const result = await service.findById('dec-001');

      expect(result).toEqual(decisao);
    });

    it('lanca NotFoundException quando decisao nao existe', async () => {
      mockDb.queryOne.mockResolvedValue(null);

      await expect(service.findById('inexistente')).rejects.toThrow(NotFoundException);
    });
  });
});
