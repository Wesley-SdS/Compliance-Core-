import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentManagerService } from './document-manager.service';

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
  ingest: vi.fn(),
  search: vi.fn(),
  getFileStatus: vi.fn(),
};

describe('DocumentManagerService', () => {
  let service: DocumentManagerService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DocumentManagerService(
      mockDb as any,
      mockConfig as any,
      mockLogger as any,
      mockVektus as any,
    );
  });

  describe('upload()', () => {
    it('should generate ULID and insert document', async () => {
      mockDb.queryOne
        .mockResolvedValueOnce({ version: null }) // no existing version
        .mockResolvedValueOnce({
          id: 'doc-1',
          aggregateId: 'agg-1',
          fileName: 'alvara.pdf',
          version: 1,
        });
      mockDb.query.mockResolvedValue([]); // version history insert

      const result = await service.upload(
        'alvara.pdf',
        'uploads/alvara.pdf',
        1024,
        'application/pdf',
        'user-1',
        {
          aggregateId: 'agg-1',
          aggregateType: 'Clinica',
          category: 'alvara',
        } as any,
      );

      expect(result).toBeDefined();
      // Check INSERT was called
      const insertCall = mockDb.queryOne.mock.calls[1];
      expect(insertCall[0]).toContain('INSERT INTO compliance_documents');
      // First param is ULID
      expect(insertCall[1][0]).toMatch(/^[0-9A-Z]{26}$/);
    });

    it('should increment version for existing aggregateId + fileName', async () => {
      mockDb.queryOne
        .mockResolvedValueOnce({ version: 3 }) // existing version
        .mockResolvedValueOnce({
          id: 'doc-2',
          aggregateId: 'agg-1',
          fileName: 'alvara.pdf',
          version: 4,
        });
      mockDb.query.mockResolvedValue([]);

      await service.upload(
        'alvara.pdf',
        'uploads/alvara-v4.pdf',
        2048,
        'application/pdf',
        'user-1',
        {
          aggregateId: 'agg-1',
          aggregateType: 'Clinica',
          category: 'alvara',
        } as any,
      );

      const insertParams = mockDb.queryOne.mock.calls[1][1];
      expect(insertParams[10]).toBe(4); // version should be 3 + 1
    });
  });

  describe('indexInVektus()', () => {
    it('should call vektusAdapter.ingest()', async () => {
      mockDb.queryOne.mockResolvedValue({
        id: 'doc-1',
        aggregateId: 'agg-1',
        aggregateType: 'Clinica',
        vertical: 'ESTETIK',
        fileName: 'alvara.pdf',
        category: 'alvara',
      });
      mockVektus.ingest.mockResolvedValue({ fileId: 'vektus-file-1' });
      mockDb.query.mockResolvedValue([]);

      await service.indexInVektus('doc-1', 'File content here');

      expect(mockVektus.ingest).toHaveBeenCalledWith('File content here', {
        fileName: 'alvara.pdf',
        vertical: 'ESTETIK',
        category: 'alvara',
        documentId: 'doc-1',
        aggregateId: 'agg-1',
        aggregateType: 'Clinica',
      });
      // Should update vektus_file_id
      const [sql, params] = mockDb.query.mock.calls[0];
      expect(sql).toContain('vektus_file_id = $1');
      expect(params[0]).toBe('vektus-file-1');
    });

    it('should throw if document not found', async () => {
      mockDb.queryOne.mockResolvedValue(null);

      await expect(service.indexInVektus('bad-id', 'content')).rejects.toThrow(
        'Document not found: bad-id',
      );
    });
  });

  describe('checkExpiry()', () => {
    it('should return documents expiring within N days', async () => {
      mockDb.query.mockResolvedValue([
        {
          id: 'doc-1',
          aggregateId: 'agg-1',
          aggregateType: 'Clinica',
          vertical: 'ESTETIK',
          fileName: 'alvara.pdf',
          fileKey: 'uploads/alvara.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          category: 'alvara',
          expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          vektusFileId: null,
          version: 1,
          uploadedBy: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          days_until_expiry: 10,
        },
      ]);

      const result = await service.checkExpiry(30);

      expect(result).toHaveLength(1);
      expect(result[0].daysUntilExpiry).toBe(10);
      expect(result[0].document.fileName).toBe('alvara.pdf');

      const [sql, params] = mockDb.query.mock.calls[0];
      expect(sql).toContain('expires_at IS NOT NULL');
      expect(sql).toContain('expires_at <= $1');
    });
  });

  describe('getVersionHistory()', () => {
    it('should return versions ordered by version desc', async () => {
      mockDb.queryOne.mockResolvedValue({
        aggregateId: 'agg-1',
        aggregateType: 'Clinica',
        fileName: 'alvara.pdf',
        category: 'alvara',
      });
      mockDb.query.mockResolvedValue([
        { version: 3, fileKey: 'v3.pdf', uploadedBy: 'user-1', uploadedAt: new Date() },
        { version: 2, fileKey: 'v2.pdf', uploadedBy: 'user-1', uploadedAt: new Date() },
        { version: 1, fileKey: 'v1.pdf', uploadedBy: 'user-2', uploadedAt: new Date() },
      ]);

      const result = await service.getVersionHistory('doc-1');

      expect(result).toHaveLength(3);
      expect(result[0].version).toBe(3);
      expect(result[2].version).toBe(1);

      const [sql] = mockDb.query.mock.calls[0];
      expect(sql).toContain('ORDER BY dv.version DESC');
    });

    it('should throw if document not found', async () => {
      mockDb.queryOne.mockResolvedValue(null);

      await expect(service.getVersionHistory('bad-id')).rejects.toThrow(
        'Document not found: bad-id',
      );
    });
  });
});
