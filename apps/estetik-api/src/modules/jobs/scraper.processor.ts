import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  LegislationMonitorService,
  DatabaseService,
} from '@compliancecore/sdk';
import { ulid } from 'ulid';
import { AnvisaScraper } from '../../scrapers/anvisa.scraper';
import { DOUScraper } from '../../scrapers/dou.scraper';

@Processor('scraper')
export class ScraperProcessor extends WorkerHost {
  private readonly logger = new Logger(ScraperProcessor.name);

  constructor(
    private readonly legislationMonitor: LegislationMonitorService,
    private readonly db: DatabaseService,
    private readonly anvisaScraper: AnvisaScraper,
    private readonly douScraper: DOUScraper,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing scraper job: ${job.name}`);

    switch (job.name) {
      case 'anvisa-noticias':
        return this.processAnvisaNoticias();
      case 'anvisa-rdcs':
        return this.processAnvisaRDCs();
      case 'dou-busca':
        return this.processDOU(job.data?.keywords);
      case 'full-sync':
        return this.processFullSync();
      default:
        this.logger.warn(`Unknown scraper job: ${job.name}`);
        return { skipped: true };
    }
  }

  private async processAnvisaNoticias() {
    const items = await this.anvisaScraper.scrape();
    let inserted = 0;

    for (const item of items) {
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
        inserted++;
      }
    }

    this.logger.log(`Anvisa noticias: ${inserted} new items from ${items.length} scraped`);
    return { scraped: items.length, inserted };
  }

  private async processAnvisaRDCs() {
    const items = await this.anvisaScraper.scrapeRDCs();
    let inserted = 0;

    for (const item of items) {
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
        inserted++;
      }
    }

    this.logger.log(`Anvisa RDCs: ${inserted} new items from ${items.length} scraped`);
    return { scraped: items.length, inserted };
  }

  private async processDOU(keywords?: string[]) {
    const items = await this.douScraper.scrape(keywords);
    let inserted = 0;

    for (const item of items) {
      const exists = await this.db.queryOne(
        `SELECT id FROM legislation_items WHERE url = $1`,
        [item.url],
      );
      if (!exists) {
        await this.db.query(
          `INSERT INTO legislation_items (id, source_id, title, summary, url, published_at, affected_verticals, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [ulid(), 'dou', item.title, item.summary, item.url, item.publishedAt, JSON.stringify(['estetik'])],
        );
        inserted++;
      }
    }

    this.logger.log(`DOU: ${inserted} new items from ${items.length} scraped`);
    return { scraped: items.length, inserted };
  }

  private async processFullSync() {
    const anvisa = await this.processAnvisaNoticias();
    const rdcs = await this.processAnvisaRDCs();
    const dou = await this.processDOU();

    return {
      anvisa,
      rdcs,
      dou,
      total: anvisa.inserted + rdcs.inserted + dou.inserted,
    };
  }
}
