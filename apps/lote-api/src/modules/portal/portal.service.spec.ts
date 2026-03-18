import { describe, it, expect, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { PortalService } from './portal.service';

function createMockDb() {
  return {
    query: vi.fn().mockResolvedValue([]),
    queryOne: vi.fn().mockResolvedValue(null),
  };
}

function createMockLogger() {
  return { setContext: vi.fn(), log: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

function createService() {
  const db = createMockDb();
  const logger = createMockLogger();
  const service = new PortalService(db as any, logger as any);
  return { service, db };
}

const comprador = {
  id: 'comp-001',
  nome: 'Maria Santos',
  email: 'maria@example.com',
  access_token: 'valid-token-123',
  status: 'ATIVO',
  loteamento_id: 'lot-001',
};

const lote = {
  id: 'lote-001',
  loteamento_id: 'lot-001',
  comprador_id: 'comp-001',
  quadra: 'A',
  numero: '15',
  area_m2: 300,
  status: 'VENDIDO',
};

const contrato = {
  id: 'ctr-001',
  lote_id: 'lote-001',
  comprador_id: 'comp-001',
  valor_total: 120000,
  valor_entrada: 20000,
  numero_parcelas: 120,
  sistema: 'PRICE',
  status: 'ATIVO',
};

const parcelas = [
  { id: 'par-001', numero: 1, valor_prestacao: 1520.85, status: 'PAGO' },
  { id: 'par-002', numero: 2, valor_prestacao: 1520.85, status: 'PENDENTE' },
];

const infraestrutura = [
  { item: 'agua', percentual: 100 },
  { item: 'esgoto', percentual: 80 },
  { item: 'energia', percentual: 100 },
];

const documentos = [
  { id: 'doc-001', file_name: 'licenca.pdf', category: 'licenca_ambiental', created_at: '2026-01-01' },
];

describe('PortalService', () => {
  describe('getByToken — valid token with full data', () => {
    it('returns comprador data, lote, contrato, parcelas, infraestrutura and documentos', async () => {
      const { service, db } = createService();

      // queryOne calls: comprador, lote, contrato
      db.queryOne
        .mockResolvedValueOnce(comprador)
        .mockResolvedValueOnce(lote)
        .mockResolvedValueOnce(contrato);

      // query calls: parcelas, infraestrutura, documentos
      db.query
        .mockResolvedValueOnce(parcelas)
        .mockResolvedValueOnce(infraestrutura)
        .mockResolvedValueOnce(documentos);

      const result = await service.getByToken('valid-token-123');

      // Comprador data (only nome and email exposed)
      expect(result.comprador.nome).toBe('Maria Santos');
      expect(result.comprador.email).toBe('maria@example.com');

      // Lote info
      expect(result.lote).not.toBeNull();
      expect(result.lote!.quadra).toBe('A');
      expect(result.lote!.numero).toBe('15');
      expect(result.lote!.areaM2).toBe(300);
      expect(result.lote!.status).toBe('VENDIDO');

      // Contrato info
      expect(result.contrato).not.toBeNull();
      expect(result.contrato!.id).toBe('ctr-001');
      expect(result.contrato!.valorTotal).toBe(120000);
      expect(result.contrato!.sistema).toBe('PRICE');
      expect(result.contrato!.status).toBe('ATIVO');

      // Parcelas
      expect(result.parcelas).toHaveLength(2);

      // Infraestrutura
      expect(result.infraestrutura).toHaveLength(3);

      // Documentos
      expect(result.documentos).toHaveLength(1);
    });
  });

  describe('getByToken — invalid token', () => {
    it('throws NotFoundException for unknown token', async () => {
      const { service, db } = createService();
      db.queryOne.mockResolvedValueOnce(null);

      await expect(service.getByToken('invalid-token'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getByToken — comprador without lote', () => {
    it('returns null for lote, contrato, and empty parcelas/infraestrutura', async () => {
      const { service, db } = createService();

      db.queryOne
        .mockResolvedValueOnce(comprador)  // comprador found
        .mockResolvedValueOnce(null);      // no lote

      // query for documentos
      db.query.mockResolvedValueOnce(documentos);

      const result = await service.getByToken('valid-token-123');

      expect(result.comprador.nome).toBe('Maria Santos');
      expect(result.lote).toBeNull();
      expect(result.contrato).toBeNull();
      expect(result.parcelas).toEqual([]);
      expect(result.infraestrutura).toEqual([]);
    });
  });

  describe('getByToken — comprador with lote but no active contrato', () => {
    it('returns lote data but null contrato and empty parcelas', async () => {
      const { service, db } = createService();

      db.queryOne
        .mockResolvedValueOnce(comprador)
        .mockResolvedValueOnce(lote)
        .mockResolvedValueOnce(null); // no active contrato

      db.query
        .mockResolvedValueOnce(infraestrutura)
        .mockResolvedValueOnce(documentos);

      const result = await service.getByToken('valid-token-123');

      expect(result.lote).not.toBeNull();
      expect(result.contrato).toBeNull();
      expect(result.parcelas).toEqual([]);
      expect(result.infraestrutura).toHaveLength(3);
    });
  });

  describe('getByToken — comprador without loteamento_id', () => {
    it('returns empty documentos when comprador has no loteamento_id', async () => {
      const { service, db } = createService();
      const compradorSemLoteamento = { ...comprador, loteamento_id: null };

      db.queryOne
        .mockResolvedValueOnce(compradorSemLoteamento)
        .mockResolvedValueOnce(null); // no lote

      const result = await service.getByToken('valid-token-123');

      expect(result.documentos).toEqual([]);
    });
  });

  describe('getByToken — queries use correct parameters', () => {
    it('queries compradores by access_token and ATIVO status', async () => {
      const { service, db } = createService();
      db.queryOne.mockResolvedValueOnce(null);

      await expect(service.getByToken('my-token')).rejects.toThrow();

      expect(db.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('access_token'),
        ['my-token'],
      );
    });
  });
});
