import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import {
  LegislationMonitorService,
  DatabaseService,
  EventStoreService,
} from '@compliancecore/sdk';
import type { NewLegislation, ImpactReport } from '@compliancecore/shared';
import { ulid } from 'ulid';
import { AnvisaScraper } from '../../scrapers/anvisa.scraper';
import { DOUScraper } from '../../scrapers/dou.scraper';

@Injectable()
export class LegislacaoService {
  private readonly logger = new Logger(LegislacaoService.name);

  constructor(
    private readonly legislationMonitor: LegislationMonitorService,
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly anvisaScraper: AnvisaScraper,
    private readonly douScraper: DOUScraper,
  ) {}

  async getFeed(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const countResult = await this.db.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM legislation_items
       WHERE affected_verticals::jsonb ? 'estetik'`,
    );
    const total = parseInt(countResult?.count ?? '0', 10);

    const rows = await this.db.query<{
      id: string;
      title: string;
      summary: string;
      url: string;
      published_at: Date;
      source_id: string;
    }>(
      `SELECT id, title, summary, url, published_at, source_id
       FROM legislation_items
       WHERE affected_verticals::jsonb ? 'estetik'
       ORDER BY published_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    return {
      data: rows.map((r) => ({
        id: r.id,
        title: r.title,
        summary: r.summary,
        url: r.url,
        publishedAt: r.published_at,
        sourceId: r.source_id,
      })),
      total,
      page,
      limit,
      hasMore: offset + rows.length < total,
    };
  }

  async findOne(id: string) {
    const row = await this.db.queryOne<{
      id: string;
      title: string;
      summary: string;
      url: string;
      published_at: Date;
      source_id: string;
      affected_verticals: string;
    }>(
      `SELECT id, title, summary, url, published_at, source_id, affected_verticals
       FROM legislation_items WHERE id = $1`,
      [id],
    );

    if (!row) {
      throw new NotFoundException(`Legislacao ${id} nao encontrada`);
    }

    return {
      id: row.id,
      title: row.title,
      summary: row.summary,
      url: row.url,
      publishedAt: row.published_at,
      sourceId: row.source_id,
      affectedVerticals: typeof row.affected_verticals === 'string'
        ? JSON.parse(row.affected_verticals)
        : row.affected_verticals,
    };
  }

  async analyzeImpact(legislationId: string, clinicaId: string): Promise<ImpactReport> {
    return this.legislationMonitor.analyzeImpact(legislationId, clinicaId);
  }

  async forceSync(actorId: string) {
    const results = {
      anvisa: { noticias: 0, rdcs: 0 },
      dou: 0,
      total: 0,
    };

    // Scrape Anvisa
    const anvisaNoticias = await this.anvisaScraper.scrape();
    for (const item of anvisaNoticias) {
      const exists = await this.db.queryOne(
        `SELECT id FROM legislation_items WHERE title = $1`,
        [item.title],
      );
      if (!exists) {
        await this.db.query(
          `INSERT INTO legislation_items (id, source_id, title, summary, url, published_at, affected_verticals, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [ulid(), 'anvisa-noticias', item.title, item.summary, item.url, item.publishedAt, JSON.stringify(['estetik'])],
        );
        results.anvisa.noticias++;
      }
    }

    const anvisaRDCs = await this.anvisaScraper.scrapeRDCs();
    for (const item of anvisaRDCs) {
      const exists = await this.db.queryOne(
        `SELECT id FROM legislation_items WHERE title = $1`,
        [item.title],
      );
      if (!exists) {
        await this.db.query(
          `INSERT INTO legislation_items (id, source_id, title, summary, url, published_at, affected_verticals, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [ulid(), 'anvisa-rdcs', item.title, item.summary, item.url, item.publishedAt, JSON.stringify(['estetik'])],
        );
        results.anvisa.rdcs++;
      }
    }

    // Scrape DOU
    const douItems = await this.douScraper.scrape();
    for (const item of douItems) {
      const exists = await this.db.queryOne(
        `SELECT id FROM legislation_items WHERE title = $1`,
        [item.title],
      );
      if (!exists) {
        await this.db.query(
          `INSERT INTO legislation_items (id, source_id, title, summary, url, published_at, affected_verticals, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [ulid(), 'dou', item.title, item.summary, item.url, item.publishedAt, JSON.stringify(['estetik'])],
        );
        results.dou++;
      }
    }

    results.total = results.anvisa.noticias + results.anvisa.rdcs + results.dou;

    await this.eventStore.append('system', 'Legislation', 'LEGISLATION_SYNC_COMPLETED', {
      results,
    }, {
      actorId,
      actorRole: 'admin',
      ip: '0.0.0.0',
      correlationId: ulid(),
    });

    this.logger.log(`Legislation sync completed: ${results.total} new items`);
    return results;
  }
}
