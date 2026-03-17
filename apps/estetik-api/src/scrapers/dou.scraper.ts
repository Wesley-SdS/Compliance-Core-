import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface DOUItem {
  title: string;
  summary: string;
  url: string;
  publishedAt: Date;
  secao: string;
  orgao: string;
}

@Injectable()
export class DOUScraper {
  private readonly logger = new Logger(DOUScraper.name);
  private readonly API_URL = 'https://querido-diario.nyc3.cdn.digitaloceanspaces.com';
  private readonly SEARCH_URL = 'https://queridodiario.ok.org.br/api/gazettes';

  async scrape(keywords: string[] = ['estética', 'clínica', 'anvisa', 'vigilância sanitária', 'saúde']): Promise<DOUItem[]> {
    const items: DOUItem[] = [];

    for (const keyword of keywords) {
      try {
        const response = await axios.get(this.SEARCH_URL, {
          params: {
            querystring: keyword,
            published_since: this.getDateNDaysAgo(7),
            size: 10,
          },
          timeout: 15000,
          headers: {
            'User-Agent': 'ComplianceCore/1.0 (+https://compliancecore.com.br)',
          },
        });

        if (response.data?.gazettes) {
          for (const gazette of response.data.gazettes) {
            items.push({
              title: gazette.excerpt || `Diário Oficial - ${keyword}`,
              summary: (gazette.excerpt || '').substring(0, 500),
              url: gazette.url || gazette.txt_url || '',
              publishedAt: new Date(gazette.date || Date.now()),
              secao: gazette.territory_name || 'Federal',
              orgao: gazette.source_text || 'DOU',
            });
          }
        }
      } catch (error: any) {
        this.logger.warn(`DOU scraper failed for keyword "${keyword}": ${error.message}`);
      }
    }

    // Deduplicate by URL
    const unique = new Map<string, DOUItem>();
    for (const item of items) {
      if (item.url && !unique.has(item.url)) {
        unique.set(item.url, item);
      }
    }

    const result = Array.from(unique.values());
    this.logger.log(`DOU scraper: ${result.length} unique items found`);
    return result;
  }

  private getDateNDaysAgo(n: number): string {
    const date = new Date();
    date.setDate(date.getDate() - n);
    return date.toISOString().split('T')[0];
  }
}
