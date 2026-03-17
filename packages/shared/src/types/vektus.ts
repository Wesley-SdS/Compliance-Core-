export interface SearchResult {
  chunkId: string;
  fileId: string;
  fileName: string;
  content: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface IngestResult {
  fileId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
}

export interface FileStatus {
  fileId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  chunksCount?: number;
  error?: string;
}

export type SkillLevel = 'L1' | 'L2' | 'L3';

export interface SkillsContext {
  level: SkillLevel;
  context: string;
  tokens: number;
}

export interface IDocumentSearchService {
  search(query: string, options?: { filters?: Record<string, unknown>; topK?: number; threshold?: number }): Promise<SearchResult[]>;
  ingest(content: string, metadata: { fileName: string; vertical: string; category?: string; tags?: string[]; [key: string]: unknown }): Promise<IngestResult>;
  getFileStatus(fileId: string): Promise<FileStatus>;
  injectSkills(level: SkillLevel, context: string, options?: { maxTokens?: number; vertical?: string }): Promise<SkillsContext>;
}
