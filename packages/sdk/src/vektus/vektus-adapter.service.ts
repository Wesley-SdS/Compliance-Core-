import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { ComplianceCoreConfigService } from '../shared/config.js';
import { ComplianceLogger } from '../shared/logger.js';
import type {
  SearchResult,
  IngestResult,
  FileStatus,
  SkillLevel,
  SkillsContext,
  IDocumentSearchService,
} from '@compliancecore/shared';

@Injectable()
export class VektusAdapterService implements IDocumentSearchService {
  private client: AxiosInstance;

  constructor(
    private readonly config: ComplianceCoreConfigService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('VektusAdapterService');

    this.client = axios.create({
      baseURL: this.config.vektus.baseUrl,
      headers: {
        Authorization: `Bearer ${this.config.vektus.apiKey}`,
        'Content-Type': 'application/json',
        'X-Project-Id': this.config.vektus.projectId,
      },
      timeout: 30000,
    });
  }

  async search(
    query: string,
    options?: {
      filters?: Record<string, unknown>;
      topK?: number;
      threshold?: number;
    },
  ): Promise<SearchResult[]> {
    try {
      const response = await this.client.post('/api/rag/search', {
        query,
        filters: options?.filters,
        topK: options?.topK ?? 10,
        threshold: options?.threshold ?? 0.7,
      });

      this.logger.log(`Vektus search completed: ${response.data.results?.length ?? 0} results`, {
        query: query.substring(0, 100),
      });

      return response.data.results ?? [];
    } catch (error: any) {
      this.logger.error(`Vektus search failed: ${error.message}`, error.stack);
      throw error;
    }
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
    try {
      const response = await this.client.post('/api/rag/ingest', {
        content,
        metadata,
      });

      this.logger.log(`Vektus ingest queued: ${metadata.fileName}`, {
        fileId: response.data.fileId,
      });

      return response.data;
    } catch (error: any) {
      this.logger.error(`Vektus ingest failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getFileStatus(fileId: string): Promise<FileStatus> {
    try {
      const response = await this.client.get(`/api/rag/files/${fileId}/status`);
      return response.data;
    } catch (error: any) {
      this.logger.error(`Vektus getFileStatus failed for ${fileId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async injectSkills(
    level: SkillLevel,
    context: string,
    options?: {
      maxTokens?: number;
      vertical?: string;
    },
  ): Promise<SkillsContext> {
    try {
      const response = await this.client.post('/api/rag/skills/inject', {
        level,
        context,
        maxTokens: options?.maxTokens ?? 4096,
        vertical: options?.vertical ?? this.config.vertical,
      });

      this.logger.log(`Vektus skills injected at level ${level}`, {
        tokens: response.data.tokens,
      });

      return response.data;
    } catch (error: any) {
      this.logger.error(`Vektus skills injection failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
