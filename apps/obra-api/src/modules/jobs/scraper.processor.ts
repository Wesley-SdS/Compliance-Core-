import { Processor, WorkerHost } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { VektusAdapterService } from '@compliancecore/sdk';

@Processor('obra-scraper')
export class ScraperProcessor extends WorkerHost {
  private readonly logger = new Logger('ScraperProcessor');

  constructor(private readonly vektus: VektusAdapterService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing scraper job: ${job.name}`);

    switch (job.name) {
      case 'mte-nrs':
        await this.scrapeMTE();
        break;
      case 'dou-obra':
        await this.scrapeDOU();
        break;
      default:
        this.logger.warn(`Unknown job: ${job.name}`);
    }
  }

  private async scrapeMTE(): Promise<void> {
    try {
      const axios = (await import('axios')).default;
      const cheerio = await import('cheerio');

      const { data: html } = await axios.get('https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/seguranca-e-saude-no-trabalho/normas-regulamentadoras', {
        timeout: 15000,
        headers: { 'User-Agent': 'ComplianceCore/1.0 ObraMaster Scraper' },
      });

      const $ = cheerio.load(html);
      const items: Array<{ title: string; url: string; date: string }> = [];

      $('a[href*="norma-regulamentadora"]').each((_, el) => {
        const title = $(el).text().trim();
        const url = $(el).attr('href') || '';
        if (title && url) {
          items.push({ title, url, date: new Date().toISOString().split('T')[0] });
        }
      });

      this.logger.log(`MTE scraper: ${items.length} NRs found`);

      for (const item of items.slice(0, 10)) {
        try {
          await this.vektus.ingest(item.url, {
            fileName: `mte_${item.title.substring(0, 50)}.html`,
            vertical: 'obra',
            category: 'legislacao',
            tags: ['mte', 'nr', 'construcao'],
          });
        } catch (err) {
          this.logger.warn(`Failed to ingest ${item.title}: ${(err as Error).message}`);
        }
      }
    } catch (err) {
      this.logger.error(`MTE scraper failed: ${(err as Error).message}`);
    }
  }

  private async scrapeDOU(): Promise<void> {
    try {
      const axios = (await import('axios')).default;
      const keywords = ['construção civil', 'NR-18', 'NR-35', 'alvará construção', 'segurança canteiro'];

      for (const keyword of keywords) {
        const { data } = await axios.get('https://queridodiario.ok.org.br/api/gazettes', {
          params: { querystring: keyword, territory_id: '3550308', published_since: this.getLastWeekDate(), size: 5 },
          timeout: 15000,
        });

        if (data.gazettes?.length > 0) {
          this.logger.log(`DOU obra: ${data.gazettes.length} results for "${keyword}"`);
        }
      }
    } catch (err) {
      this.logger.error(`DOU obra scraper failed: ${(err as Error).message}`);
    }
  }

  private getLastWeekDate(): string {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  }
}
