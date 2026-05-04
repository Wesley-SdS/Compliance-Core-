import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import type {
  SearchResult,
  IngestResult,
  FileStatus,
  SkillLevel,
  SkillsContext,
} from '@compliancecore/shared';

@Injectable()
export class MockVektusAdapterService {
  private files = new Map<string, { content: string; metadata: any; status: string }>();

  async search(
    query: string,
    options?: {
      filters?: Record<string, unknown>;
      topK?: number;
      threshold?: number;
    },
  ): Promise<SearchResult[]> {
    const topK = options?.topK ?? 10;
    const results: SearchResult[] = [];

    for (const [fileId, file] of this.files) {
      if (results.length >= topK) break;
      results.push({
        chunkId: ulid(),
        fileId,
        fileName: file.metadata?.fileName ?? 'mock-file.txt',
        content: file.content.substring(0, 500),
        score: 0.85 - results.length * 0.05,
        metadata: { ...file.metadata, fileId },
      });
    }

    if (results.length === 0) {
      results.push({
        chunkId: ulid(),
        fileId: ulid(),
        fileName: 'mock-compliance.md',
        content: `Requisitos de compliance aplicáveis: ${query.substring(0, 100)}`,
        score: 0.9,
        metadata: { source: 'mock', category: 'compliance' },
      });
    }

    return results;
  }

  async ingest(
    content: string,
    metadata: {
      fileName: string;
      vertical: string;
      category?: string;
      tags?: string[];
      [key: string]: unknown;
    },
  ): Promise<IngestResult> {
    const fileId = ulid();
    this.files.set(fileId, { content, metadata, status: 'completed' });
    return { fileId, status: 'queued' };
  }

  async getFileStatus(fileId: string): Promise<FileStatus> {
    const file = this.files.get(fileId);
    return { fileId, status: file ? 'completed' : 'failed' };
  }

  async injectSkills(
    level: SkillLevel,
    context: string,
    options?: {
      maxTokens?: number;
      vertical?: string;
    },
  ): Promise<SkillsContext> {
    return {
      context: `[Mock Skills L${level}] Análise de compliance baseada no contexto fornecido. ${context.substring(0, 500)}`,
      tokens: Math.min(options?.maxTokens ?? 4096, context.length),
      level,
    };
  }
}
