import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface AnvisaItem {
  title: string;
  summary: string;
  url: string;
  publishedAt: Date;
  tipo: string;
}

@Injectable()
export class AnvisaScraper {
  private readonly logger = new Logger(AnvisaScraper.name);
  private readonly BASE_URL = 'https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa';

  async scrape(): Promise<AnvisaItem[]> {
    try {
      const response = await axios.get(this.BASE_URL, {
        timeout: 15000,
        headers: {
          'User-Agent': 'ComplianceCore/1.0 (+https://compliancecore.com.br)',
        },
      });

      const $ = cheerio.load(response.data);
      const items: AnvisaItem[] = [];

      $('article.tileItem, .noticias-list .item, .listagem-noticias .item').each((_, el) => {
        const titleEl = $(el).find('h2, .tileHeadline a, .titulo a').first();
        const title = titleEl.text().trim();
        const href = titleEl.attr('href') || $(el).find('a').first().attr('href') || '';
        const summary = $(el).find('.tileBody p, .descricao, .resumo').first().text().trim();
        const dateStr = $(el).find('.documentPublished, .data, time').first().text().trim();

        if (title) {
          const url = href.startsWith('http') ? href : `https://www.gov.br${href}`;
          items.push({
            title,
            summary: summary || title,
            url,
            publishedAt: this.parseDate(dateStr),
            tipo: this.classifyNoticia(title),
          });
        }
      });

      this.logger.log(`Anvisa scraper: ${items.length} items found`);
      return items;
    } catch (error: any) {
      this.logger.error(`Anvisa scraper failed: ${error.message}`, error.stack);
      return [];
    }
  }

  async scrapeRDCs(): Promise<AnvisaItem[]> {
    try {
      const response = await axios.get(
        'https://www.gov.br/anvisa/pt-br/assuntos/legislacao',
        {
          timeout: 15000,
          headers: {
            'User-Agent': 'ComplianceCore/1.0 (+https://compliancecore.com.br)',
          },
        },
      );

      const $ = cheerio.load(response.data);
      const items: AnvisaItem[] = [];

      $('a[href*="resolucao"], a[href*="rdc"], .listagem a').each((_, el) => {
        const title = $(el).text().trim();
        const href = $(el).attr('href') || '';
        if (title && (title.toLowerCase().includes('rdc') || title.toLowerCase().includes('resolução'))) {
          const url = href.startsWith('http') ? href : `https://www.gov.br${href}`;
          items.push({
            title,
            summary: title,
            url,
            publishedAt: new Date(),
            tipo: 'RDC',
          });
        }
      });

      this.logger.log(`Anvisa RDC scraper: ${items.length} items found`);
      return items;
    } catch (error: any) {
      this.logger.error(`Anvisa RDC scraper failed: ${error.message}`, error.stack);
      return [];
    }
  }

  private parseDate(dateStr: string): Date {
    if (!dateStr) return new Date();
    // Brazilian date format: DD/MM/YYYY
    const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (match) {
      return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
    }
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  private classifyNoticia(title: string): string {
    const lower = title.toLowerCase();
    if (lower.includes('rdc') || lower.includes('resolução')) return 'RDC';
    if (lower.includes('nota técnica')) return 'NOTA_TECNICA';
    if (lower.includes('consulta pública')) return 'CONSULTA_PUBLICA';
    if (lower.includes('portaria')) return 'PORTARIA';
    return 'NOTICIA';
  }
}
