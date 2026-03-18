import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SpedService } from './sped.service';
import { UploadSpedDto } from './sped.dto';

const mockQueryFn = vi.fn();
const mockDb = {
  query: vi.fn(),
  queryOne: vi.fn(),
  transaction: vi.fn((fn: any) => fn(mockQueryFn)),
};

const mockEventStore = {
  append: vi.fn(),
  getByEntity: vi.fn().mockResolvedValue([]),
};

const mockVektus = {
  ingest: vi.fn().mockResolvedValue({ fileId: 'vektus-file-001', status: 'completed' }),
  getFileStatus: vi.fn(),
};

const mockLogger = {
  setContext: vi.fn(),
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};

function createService() {
  return new SpedService(
    mockDb as any,
    mockEventStore as any,
    mockVektus as any,
    mockLogger as any,
  );
}

const VALID_SPED_CONTENT = [
  '|0000|017|0|01012025|31012025|EMPRESA TESTE LTDA|12345678000190||SP|123456789|3550308|||A|1|',
  '|C100|0|0|FORN001|55|00|001|000001|12345678901234567890123456789012345678901234|01012025|01012025|15000,00|0|500,00|0|14500,00|0|200,00|50,00|100,00|14500,00|2610,00|0|0|300,00|247,50|1140,00|0|0|',
  '|9999|3|',
].join('\n');

describe('SpedService', () => {
  let service: SpedService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryFn.mockReset();
    service = createService();
  });

  describe('upload', () => {
    const dto = {
      empresaId: 'emp-001',
      tipoSped: 'FISCAL' as const,
      competencia: '2025-01',
      fileName: 'sped_fiscal_202501.txt',
      content: VALID_SPED_CONTENT,
    } as UploadSpedDto;

    it('parseia arquivo, ingere no vektus e persiste na transacao', async () => {
      const result = await service.upload(dto, 'actor-1');

      // Deve chamar vektus.ingest
      expect(mockVektus.ingest).toHaveBeenCalledWith(
        dto.content,
        expect.objectContaining({
          fileName: dto.fileName,
          vertical: 'tributo',
          category: 'sped_fiscal',
          tags: ['sped', 'FISCAL', 'emp-001'],
        }),
      );

      // Deve executar transacao
      expect(mockDb.transaction).toHaveBeenCalledTimes(1);

      // Insere sped_file e sped_notas dentro da transacao
      expect(mockQueryFn).toHaveBeenCalled();
      const insertSpedCall = mockQueryFn.mock.calls[0];
      expect(insertSpedCall[0]).toContain('INSERT INTO sped_files');

      // Deve inserir notas fiscais (1 nota no sample)
      const insertNotaCalls = mockQueryFn.mock.calls.filter(
        (c: any) => typeof c[0] === 'string' && c[0].includes('INSERT INTO sped_notas'),
      );
      expect(insertNotaCalls).toHaveLength(1);

      // Deve emitir evento
      expect(mockEventStore.append).toHaveBeenCalledWith(
        'emp-001',
        'empresa',
        'SPED_UPLOADED',
        expect.objectContaining({
          tipoSped: 'FISCAL',
          competencia: '2025-01',
          totalNotas: 1,
        }),
        expect.objectContaining({ actorId: 'actor-1' }),
      );

      // Resultado
      expect(result.id).toBeDefined();
      expect(result.vektusFileId).toBe('vektus-file-001');
      expect(result.status).toBe('PROCESSADO');
      expect(result.resumo.totalNotas).toBe(1);
      expect(result.resumo.cnpj).toBe('12345678000190');
    });

    it('lanca BadRequestException para arquivo invalido sem abertura', async () => {
      // Mock the parser to simulate a file with errors and no abertura
      const parserSpy = vi.spyOn(service['parser'], 'parse').mockReturnValue({
        abertura: null,
        notasFiscais: [],
        itensNF: [],
        transportes: [],
        comunicacoes: [],
        resumo: {
          totalNotas: 0, totalItens: 0, valorTotalEntradas: 0, valorTotalSaidas: 0,
          icmsTotal: 0, pisTotal: 0, cofinsTotal: 0, ipiTotal: 0,
          cnpj: null, razaoSocial: null, periodoInicio: null, periodoFim: null,
        },
        totalRegistros: 0,
        erros: ['Registro invalido na linha 1', 'Formato nao reconhecido'],
      } as any);

      await expect(service.upload(dto, 'actor-1')).rejects.toThrow(BadRequestException);

      parserSpy.mockRestore();
    });

    it('retorna erros parciais quando parse tem warnings', async () => {
      const contentWithBadLine = [
        '|0000|017|0|01012025|31012025|EMPRESA||||||||||',
        '||',
        '|C100|0|0|F001|55|00|001|001||01012025|01012025|1000,00|0|0|0|1000,00|0|0|0|0|1000,00|180,00|0|0|0|16,50|76,00|0|0|',
        '|9999|4|',
      ].join('\n');

      const result = await service.upload(
        { ...dto, content: contentWithBadLine } as UploadSpedDto,
        'actor-1',
      );

      expect(result.status).toBe('PROCESSADO');
    });
  });

  describe('validate', () => {
    it('atualiza status para VALIDADO quando vektus completed', async () => {
      mockDb.queryOne.mockResolvedValue({
        id: 'sped-001',
        empresa_id: 'emp-001',
        tipo_sped: 'FISCAL',
        competencia: '2025-01',
        vektus_file_id: 'vk-001',
      });
      mockVektus.getFileStatus.mockResolvedValue({ status: 'completed' });

      const result = await service.validate('sped-001', 'actor-1');

      expect(result).toEqual({ id: 'sped-001', status: 'VALIDADO' });
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("SET status = 'VALIDADO'"),
        ['sped-001'],
      );
      expect(mockEventStore.append).toHaveBeenCalledWith(
        'emp-001',
        'empresa',
        'SPED_VALIDATED',
        expect.objectContaining({ spedId: 'sped-001' }),
        expect.any(Object),
      );
    });

    it('retorna AGUARDANDO_PROCESSAMENTO quando vektus nao concluiu', async () => {
      mockDb.queryOne.mockResolvedValue({
        id: 'sped-001',
        empresa_id: 'emp-001',
        vektus_file_id: 'vk-001',
      });
      mockVektus.getFileStatus.mockResolvedValue({ status: 'processing' });

      const result = await service.validate('sped-001', 'actor-1');

      expect(result.status).toBe('AGUARDANDO_PROCESSAMENTO');
      expect(mockEventStore.append).not.toHaveBeenCalled();
    });

    it('valida diretamente se nao tem vektus_file_id', async () => {
      mockDb.queryOne.mockResolvedValue({
        id: 'sped-001',
        empresa_id: 'emp-001',
        tipo_sped: 'FISCAL',
        competencia: '2025-01',
        vektus_file_id: null,
      });

      const result = await service.validate('sped-001', 'actor-1');

      expect(result.status).toBe('VALIDADO');
      expect(mockVektus.getFileStatus).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('remove notas e arquivo via transacao e emite evento', async () => {
      mockDb.queryOne.mockResolvedValue({
        id: 'sped-001',
        empresa_id: 'emp-001',
      });
      mockEventStore.append.mockResolvedValue(undefined);

      await service.delete('sped-001', 'actor-1');

      // findById was called
      expect(mockDb.queryOne).toHaveBeenCalledTimes(1);

      // Should use transaction to delete notas + file
      expect(mockDb.transaction).toHaveBeenCalledTimes(1);

      // Transaction callback deletes sped_notas then sped_files
      const txCalls = mockQueryFn.mock.calls;
      expect(txCalls.length).toBeGreaterThanOrEqual(2);
      expect(txCalls[0][0]).toContain('DELETE FROM sped_notas');
      expect(txCalls[1][0]).toContain('DELETE FROM sped_files');

      expect(mockEventStore.append).toHaveBeenCalledWith(
        'emp-001',
        'empresa',
        'SPED_DELETED',
        expect.objectContaining({ spedId: 'sped-001' }),
        expect.any(Object),
      );
    });

    it('lanca NotFoundException quando sped nao existe', async () => {
      mockDb.queryOne.mockResolvedValue(null);

      await expect(service.delete('inexistente', 'actor-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmpresa', () => {
    it('retorna arquivos SPED filtrados por empresa ordenados por competencia DESC', async () => {
      const rows = [
        { id: 'sped-2', competencia: '2025-02' },
        { id: 'sped-1', competencia: '2025-01' },
      ];
      mockDb.query.mockResolvedValue(rows);

      const result = await service.findByEmpresa('emp-001');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE empresa_id = $1 ORDER BY competencia DESC'),
        ['emp-001'],
      );
      expect(result).toEqual(rows);
    });

    it('retorna array vazio quando empresa nao tem SPEDs', async () => {
      mockDb.query.mockResolvedValue([]);

      const result = await service.findByEmpresa('emp-sem-sped');

      expect(result).toEqual([]);
    });
  });
});
