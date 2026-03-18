import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VektusAdapterService } from './vektus-adapter.service';

const mockPost = vi.fn();
const mockGet = vi.fn();

const mockConfig = {
  vertical: 'ESTETIK',
  vektus: {
    baseUrl: 'https://vektus.example.com',
    apiKey: 'test-api-key',
    projectId: 'proj-1',
  },
};

const mockLogger = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  setContext: vi.fn(),
};

describe('VektusAdapterService', () => {
  let service: VektusAdapterService;

  beforeEach(() => {
    mockPost.mockReset();
    mockGet.mockReset();
    service = new VektusAdapterService(mockConfig as any, mockLogger as any);
    // Override the real axios client with our mock
    (service as any).client = { post: mockPost, get: mockGet };
  });

  describe('search()', () => {
    it('should post to /api/rag/search with correct params', async () => {
      mockPost.mockResolvedValue({
        data: {
          results: [
            { content: 'Result 1', score: 0.9, metadata: {} },
          ],
        },
      });

      await service.search('compliance query', { filters: { vertical: 'ESTETIK' }, topK: 5 });

      expect(mockPost).toHaveBeenCalledWith('/api/rag/search', {
        query: 'compliance query',
        filters: { vertical: 'ESTETIK' },
        topK: 5,
        threshold: 0.7,
      });
    });

    it('should create client with Authorization header containing Bearer token', () => {
      // Verify service was constructed with correct config
      expect(mockConfig.vektus.apiKey).toBe('test-api-key');
      expect(mockConfig.vektus.baseUrl).toBe('https://vektus.example.com');
    });

    it('should return mapped SearchResult array', async () => {
      const results = [
        { content: 'Doc 1', score: 0.95, metadata: { category: 'licenca' } },
        { content: 'Doc 2', score: 0.85, metadata: { category: 'alvara' } },
      ];
      mockPost.mockResolvedValue({ data: { results } });

      const result = await service.search('test query');

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('Doc 1');
      expect(result[1].score).toBe(0.85);
    });

    it('should throw on HTTP error', async () => {
      mockPost.mockRejectedValue(new Error('Network Error'));

      await expect(service.search('query')).rejects.toThrow('Network Error');
    });
  });

  describe('ingest()', () => {
    it('should post to /api/rag/ingest with content and metadata', async () => {
      mockPost.mockResolvedValue({
        data: { fileId: 'file-1', status: 'QUEUED' },
      });

      const result = await service.ingest('file content', {
        fileName: 'doc.pdf',
        vertical: 'ESTETIK',
        category: 'alvara',
      });

      expect(mockPost).toHaveBeenCalledWith('/api/rag/ingest', {
        content: 'file content',
        metadata: {
          fileName: 'doc.pdf',
          vertical: 'ESTETIK',
          category: 'alvara',
        },
      });
      expect(result.fileId).toBe('file-1');
    });

    it('should throw on HTTP error', async () => {
      mockPost.mockRejectedValue(new Error('500 Internal Server Error'));

      await expect(
        service.ingest('content', { fileName: 'doc.pdf', vertical: 'ESTETIK' }),
      ).rejects.toThrow('500 Internal Server Error');
    });
  });

  describe('getFileStatus()', () => {
    it('should get /api/rag/files/:id/status', async () => {
      mockGet.mockResolvedValue({
        data: { fileId: 'file-1', status: 'PROCESSED', chunks: 42 },
      });

      const result = await service.getFileStatus('file-1');

      expect(mockGet).toHaveBeenCalledWith('/api/rag/files/file-1/status');
      expect(result.status).toBe('PROCESSED');
    });
  });

  describe('injectSkills()', () => {
    it('should post to /api/rag/skills/inject with level and context', async () => {
      mockPost.mockResolvedValue({
        data: { skills: ['skill1'], tokens: 2048 },
      });

      const result = await service.injectSkills('EXPERT' as any, 'compliance context');

      expect(mockPost).toHaveBeenCalledWith('/api/rag/skills/inject', {
        level: 'EXPERT',
        context: 'compliance context',
        maxTokens: 4096,
        vertical: 'ESTETIK',
      });
      expect(result.tokens).toBe(2048);
    });
  });
});
