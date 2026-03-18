import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { EmpresaService } from './empresa.service';

const mockDb = {
  query: vi.fn(),
  queryOne: vi.fn(),
};

const mockEventStore = {
  append: vi.fn(),
  getByEntity: vi.fn().mockResolvedValue([]),
  getAuditTrail: vi.fn().mockResolvedValue({ data: [], total: 0 }),
};

const mockScoreEngine = {
  calculate: vi.fn(),
};

const mockVektus = {
  ingest: vi.fn().mockResolvedValue({ fileId: 'vk-001', status: 'completed' }),
};

const mockEvidenceGenerator = {
  generateDossier: vi.fn().mockResolvedValue(Buffer.from('pdf-content')),
};

const mockLogger = {
  setContext: vi.fn(),
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};

function createService() {
  return new EmpresaService(
    mockDb as any,
    mockEventStore as any,
    mockScoreEngine as any,
    mockVektus as any,
    mockEvidenceGenerator as any,
    mockLogger as any,
  );
}

describe('EmpresaService', () => {
  let service: EmpresaService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = createService();
  });

  describe('create', () => {
    const dto = {
      razaoSocial: 'Empresa Teste LTDA',
      nomeFantasia: 'Teste',
      cnpj: '12345678000190',
      regimeTributario: 'LUCRO_PRESUMIDO',
    };

    it('insere empresa e emite evento EMPRESA_CREATED', async () => {
      const empresaRow = { id: 'emp-001', ...dto, status: 'ATIVA' };
      // Primeiro queryOne: findById retornado apos insert
      mockDb.queryOne.mockResolvedValue(empresaRow);

      const result = await service.create(dto as any, 'actor-1');

      // Insert na tabela empresas
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO empresas'),
        expect.arrayContaining(['Empresa Teste LTDA', 'Teste', '12345678000190']),
      );

      // Evento emitido
      expect(mockEventStore.append).toHaveBeenCalledWith(
        expect.any(String), // id gerado com ulid
        'empresa',
        'EMPRESA_CREATED',
        expect.objectContaining({ razaoSocial: 'Empresa Teste LTDA' }),
        expect.objectContaining({ actorId: 'actor-1' }),
      );

      expect(result).toEqual(empresaRow);
    });
  });

  describe('findAll', () => {
    it('retorna resultados paginados sem filtros', async () => {
      const rows = [{ id: 'emp-001' }, { id: 'emp-002' }];
      mockDb.query.mockResolvedValue(rows);
      mockDb.queryOne.mockResolvedValue({ count: '10' });

      const result = await service.findAll(1, 2);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY created_at DESC LIMIT'),
        [2, 0],
      );
      expect(result).toEqual({
        data: rows,
        total: 10,
        page: 1,
        limit: 2,
        hasMore: true,
      });
    });

    it('aplica filtro de search (razao_social, cnpj, nome_fantasia)', async () => {
      mockDb.query.mockResolvedValue([]);
      mockDb.queryOne.mockResolvedValue({ count: '0' });

      await service.findAll(1, 20, { search: 'teste' });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('razao_social ILIKE'),
        expect.arrayContaining(['%teste%']),
      );
    });

    it('aplica filtro de regime', async () => {
      mockDb.query.mockResolvedValue([]);
      mockDb.queryOne.mockResolvedValue({ count: '0' });

      await service.findAll(1, 20, { regime: 'SIMPLES_NACIONAL' });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('regime_tributario ='),
        expect.arrayContaining(['SIMPLES_NACIONAL']),
      );
    });

    it('aplica ambos os filtros juntos', async () => {
      mockDb.query.mockResolvedValue([]);
      mockDb.queryOne.mockResolvedValue({ count: '0' });

      await service.findAll(1, 20, { search: 'abc', regime: 'LUCRO_REAL' });

      const sql = mockDb.query.mock.calls[0][0];
      expect(sql).toContain('razao_social ILIKE');
      expect(sql).toContain('regime_tributario =');
    });
  });

  describe('calculateScore (getScore)', () => {
    it('busca dados relacionados e calcula score via engine', async () => {
      const empresa = { id: 'emp-001', regime_tributario: 'LUCRO_PRESUMIDO' };
      const documents = [{ id: 'doc-1', category: 'certidao_negativa' }];
      const spedFiles = [{ id: 'sped-1', status: 'VALIDADO' }];
      const obrigacoes = [{ id: 'obr-1', status: 'CUMPRIDA' }];

      mockDb.queryOne.mockResolvedValue(empresa);
      mockDb.query
        .mockResolvedValueOnce(documents)  // documents
        .mockResolvedValueOnce(spedFiles)  // sped_files
        .mockResolvedValueOnce(obrigacoes); // obrigacoes

      mockScoreEngine.calculate.mockResolvedValue({
        overall: 85,
        level: 'EXCELENTE',
        breakdown: [],
      });

      const result = await service.calculateScore('emp-001');

      expect(mockScoreEngine.calculate).toHaveBeenCalledWith(
        'emp-001',
        expect.any(Array), // TRIBUTO_CRITERIA
        expect.objectContaining({
          id: 'emp-001',
          documents,
          spedFiles,
          obrigacoes,
        }),
      );
      expect(result.overall).toBe(85);
    });

    it('lanca NotFoundException quando empresa nao existe', async () => {
      mockDb.queryOne.mockResolvedValue(null);

      await expect(service.calculateScore('inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAlerts', () => {
    it('retorna alertas ativos da empresa ordenados por due_date', async () => {
      const empresa = { id: 'emp-001' };
      const alerts = [
        { id: 'a1', due_date: '2025-03-01', status: 'PENDING' },
        { id: 'a2', due_date: '2025-04-01', status: 'PENDING' },
      ];

      mockDb.queryOne.mockResolvedValue(empresa);
      mockDb.query.mockResolvedValue(alerts);

      const result = await service.getAlerts('emp-001');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("status != 'EXPIRED'"),
        ['emp-001'],
      );
      expect(result).toEqual(alerts);
    });

    it('lanca NotFoundException quando empresa nao existe', async () => {
      mockDb.queryOne.mockResolvedValue(null);

      await expect(service.getAlerts('inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getChecklist', () => {
    it('retorna checklist mais recente da empresa', async () => {
      const empresa = { id: 'emp-001' };
      const checklist = [{ id: 'ck-1', items: [] }];

      mockDb.queryOne.mockResolvedValue(empresa);
      mockDb.query.mockResolvedValue(checklist);

      const result = await service.getChecklist('emp-001');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('checklists'),
        ['emp-001'],
      );
      expect(result).toEqual(checklist);
    });
  });

  describe('getTimeline', () => {
    it('busca audit trail do EventStore para a empresa', async () => {
      const empresa = { id: 'emp-001' };
      const trail = { data: [{ event: 'EMPRESA_CREATED' }], total: 1 };

      mockDb.queryOne.mockResolvedValue(empresa);
      mockEventStore.getAuditTrail.mockResolvedValue(trail);

      const result = await service.getTimeline('emp-001', 1, 50);

      expect(mockEventStore.getAuditTrail).toHaveBeenCalledWith({
        aggregateId: 'emp-001',
        aggregateType: 'empresa',
        page: 1,
        limit: 50,
      });
      expect(result).toEqual(trail);
    });

    it('lanca NotFoundException quando empresa nao existe', async () => {
      mockDb.queryOne.mockResolvedValue(null);

      await expect(service.getTimeline('inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDossier', () => {
    it('compila dossier completo com empresa, docs, score, alerts e SPEDs', async () => {
      const empresa = { id: 'emp-001', razao_social: 'Teste' };

      // findById is called multiple times (getDossier, getDocuments, calculateScore, getAlerts)
      mockDb.queryOne.mockResolvedValue(empresa);
      // All db.query calls return empty arrays by default
      mockDb.query.mockResolvedValue([]);
      mockScoreEngine.calculate.mockResolvedValue({ overall: 90, level: 'EXCELENTE', breakdown: [] });

      const result = await service.getDossier('emp-001');

      expect(result.empresa).toEqual(empresa);
      expect(result.documents).toBeDefined();
      expect(result.score).toBeDefined();
      expect(result.score!.overall).toBe(90);
      expect(result.alerts).toBeDefined();
      expect(result.spedFiles).toBeDefined();
      expect(result.docCategories).toBeDefined();
      expect(result.generatedAt).toBeInstanceOf(Date);
    });

    it('retorna score null quando calculateScore falha', async () => {
      const empresa = { id: 'emp-001' };
      mockDb.queryOne.mockResolvedValue(empresa);
      mockDb.query.mockResolvedValue([]);
      mockScoreEngine.calculate.mockRejectedValue(new Error('score error'));

      const result = await service.getDossier('emp-001');

      expect(result.score).toBeNull();
    });
  });
});
