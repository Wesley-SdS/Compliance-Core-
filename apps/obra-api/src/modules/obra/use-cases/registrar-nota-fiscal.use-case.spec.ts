import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegistrarNotaFiscalUseCase } from './registrar-nota-fiscal.use-case';

const mockDb = {
  query: vi.fn(),
  queryOne: vi.fn(),
};
const mockEventStore = { append: vi.fn() };
const mockVektus = { ingest: vi.fn() };
const mockLogger = { setContext: vi.fn(), log: vi.fn(), warn: vi.fn(), error: vi.fn() };

describe('RegistrarNotaFiscalUseCase', () => {
  let useCase: RegistrarNotaFiscalUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new RegistrarNotaFiscalUseCase(
      mockDb as any,
      mockEventStore as any,
      mockVektus as any,
      mockLogger as any,
    );
  });

  it('should validate obra exists before uploading', async () => {
    mockDb.queryOne.mockResolvedValue(null);

    await expect(
      useCase.execute('non-existent', { imagemUrl: 'https://example.com/nf.jpg' }, 'actor-1'),
    ).rejects.toThrow('Obra non-existent nao encontrada');
  });

  it('should ingest image via Vektus with correct params', async () => {
    mockDb.queryOne.mockResolvedValue({ id: 'obra-1' });
    mockDb.query.mockResolvedValue([]);
    mockVektus.ingest.mockResolvedValue({ fileId: 'vektus-123', status: 'processing' });
    mockEventStore.append.mockResolvedValue(undefined);

    await useCase.execute('obra-1', { imagemUrl: 'https://example.com/nf.jpg' }, 'actor-1');

    expect(mockVektus.ingest).toHaveBeenCalledWith(
      'https://example.com/nf.jpg',
      expect.objectContaining({
        vertical: 'obra',
        category: 'nota_fiscal_material',
        tags: expect.arrayContaining(['obra', 'obra-1', 'nota_fiscal']),
      }),
    );
  });

  it('should insert nota fiscal with status PENDENTE', async () => {
    mockDb.queryOne.mockResolvedValue({ id: 'obra-1' });
    mockDb.query.mockResolvedValue([]);
    mockVektus.ingest.mockResolvedValue({ fileId: 'vektus-456' });
    mockEventStore.append.mockResolvedValue(undefined);

    await useCase.execute('obra-1', { imagemUrl: 'https://example.com/nf.jpg' }, 'actor-1');

    const insertCall = mockDb.query.mock.calls[0];
    expect(insertCall[0]).toContain('INSERT INTO notas_fiscais');
    expect(insertCall[0]).toContain('PENDENTE');
    expect(insertCall[1]).toContain('obra-1');
    expect(insertCall[1]).toContain('vektus-456');
  });

  it('should append NF_UPLOADED event', async () => {
    mockDb.queryOne.mockResolvedValue({ id: 'obra-1' });
    mockDb.query.mockResolvedValue([]);
    mockVektus.ingest.mockResolvedValue({ fileId: 'vektus-789' });
    mockEventStore.append.mockResolvedValue(undefined);

    await useCase.execute('obra-1', { imagemUrl: 'https://example.com/nf.jpg' }, 'actor-1');

    expect(mockEventStore.append).toHaveBeenCalledWith(
      'obra-1', 'obra', 'NF_UPLOADED',
      expect.objectContaining({ vektusFileId: 'vektus-789' }),
      expect.objectContaining({ actorId: 'actor-1' }),
    );
  });

  it('should return NF id, status PENDENTE, and vektus file id', async () => {
    mockDb.queryOne.mockResolvedValue({ id: 'obra-1' });
    mockDb.query.mockResolvedValue([]);
    mockVektus.ingest.mockResolvedValue({ fileId: 'vektus-abc' });
    mockEventStore.append.mockResolvedValue(undefined);

    const result = await useCase.execute('obra-1', { imagemUrl: 'https://example.com/nf.jpg' }, 'actor-1');

    expect(result.status).toBe('PENDENTE');
    expect(result.vektusFileId).toBe('vektus-abc');
    expect(result.id).toBeDefined();
  });
});
