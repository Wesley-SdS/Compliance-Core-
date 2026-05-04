import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('AnvisaScraper', () => {
  let scraper: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { AnvisaScraper } = await import('../scrapers/anvisa.scraper');
    scraper = new AnvisaScraper();
  });

  it('should parse Anvisa news HTML', async () => {
    const mockHtml = `
      <html>
        <body>
          <article class="tileItem">
            <h2><a href="/anvisa/pt-br/noticias/rdc-nova-2025">RDC 500/2025 - Novas regras para clinicas</a></h2>
            <div class="tileBody"><p>Anvisa publica nova resolucao para clinicas de estetica</p></div>
            <span class="documentPublished">15/03/2025</span>
          </article>
          <article class="tileItem">
            <h2><a href="/anvisa/pt-br/noticias/nota-tecnica-123">Nota Tecnica sobre procedimentos</a></h2>
            <div class="tileBody"><p>Orientacoes tecnicas para procedimentos esteticos</p></div>
            <span class="documentPublished">14/03/2025</span>
          </article>
        </body>
      </html>
    `;

    mockedAxios.get.mockResolvedValueOnce({ data: mockHtml });

    const items = await scraper.scrape();

    expect(items).toHaveLength(2);
    expect(items[0].title).toBe('RDC 500/2025 - Novas regras para clinicas');
    expect(items[0].tipo).toBe('RDC');
    expect(items[0].url).toContain('gov.br');
    expect(items[1].title).toContain('Nota Tecnica');
    expect(items[1].tipo).toBe('NOTA_TECNICA');
  });

  it('should return empty array on network error', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

    const items = await scraper.scrape();

    expect(items).toEqual([]);
  });
});

describe('DOUScraper', () => {
  let scraper: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { DOUScraper } = await import('../scrapers/dou.scraper');
    scraper = new DOUScraper();
  });

  it('should parse DOU API response', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        gazettes: [
          {
            excerpt: 'Resolucao sobre vigilancia sanitaria em clinicas de estetica',
            url: 'https://example.com/gazette/1',
            date: '2025-03-15',
            territory_name: 'Federal',
            source_text: 'DOU',
          },
        ],
      },
    });

    const items = await scraper.scrape(['estética']);

    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(items[0].title).toContain('vigilancia sanitaria');
    expect(items[0].secao).toBe('Federal');
  });

  it('should deduplicate results by URL', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        gazettes: [
          {
            excerpt: 'Same gazette',
            url: 'https://example.com/gazette/same',
            date: '2025-03-15',
            territory_name: 'Federal',
            source_text: 'DOU',
          },
        ],
      },
    });

    // Multiple keywords will return the same gazette
    const items = await scraper.scrape(['estética', 'clínica']);

    // Should deduplicate by URL
    const urls = items.map((i: any) => i.url);
    const uniqueUrls = new Set(urls);
    expect(urls.length).toBe(uniqueUrls.size);
  });

  it('should return empty array on network error', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network error'));

    const items = await scraper.scrape();

    expect(items).toEqual([]);
  });
});
