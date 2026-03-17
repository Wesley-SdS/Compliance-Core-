import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import axios from 'axios';
import { DatabaseService } from '../shared/database.js';
import { ComplianceCoreConfigService } from '../shared/config.js';
import { ComplianceLogger } from '../shared/logger.js';
import { VektusAdapterService } from '../vektus/vektus-adapter.service.js';
import type {
  LegislationSource,
  NewLegislation,
  ImpactReport,
} from '@compliancecore/shared';

@Injectable()
export class LegislationMonitorService {
  private sources: Map<string, LegislationSource> = new Map();

  constructor(
    private readonly db: DatabaseService,
    private readonly config: ComplianceCoreConfigService,
    private readonly logger: ComplianceLogger,
    private readonly vektus: VektusAdapterService,
  ) {
    this.logger.setContext('LegislationMonitorService');
  }

  async registerSource(source: Omit<LegislationSource, 'id'>): Promise<LegislationSource> {
    const id = ulid();
    const fullSource: LegislationSource = { id, ...source };

    await this.db.query(
      `INSERT INTO legislation_sources (id, name, affected_verticals, cron_expression, url)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET name = $2, affected_verticals = $3, cron_expression = $4, url = $5`,
      [id, source.name, JSON.stringify(source.affectedVerticals), source.cronExpression, source.url ?? null],
    );

    this.sources.set(id, fullSource);
    this.logger.log(`Legislation source registered: ${source.name}`, { sourceId: id });

    return fullSource;
  }

  async check(): Promise<NewLegislation[]> {
    const allSources = await this.loadSources();
    const newLegislation: NewLegislation[] = [];

    for (const source of allSources) {
      try {
        const items = await this.fetchFromSource(source);
        for (const item of items) {
          const exists = await this.db.queryOne(
            `SELECT id FROM legislation_items WHERE source_id = $1 AND title = $2`,
            [source.id, item.title],
          );

          if (!exists) {
            const legislation: NewLegislation = {
              id: ulid(),
              sourceId: source.id,
              title: item.title,
              summary: item.summary,
              url: item.url,
              publishedAt: item.publishedAt,
              affectedVerticals: source.affectedVerticals,
            };

            await this.db.query(
              `INSERT INTO legislation_items (id, source_id, title, summary, url, published_at, affected_verticals, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
              [
                legislation.id,
                legislation.sourceId,
                legislation.title,
                legislation.summary,
                legislation.url ?? null,
                legislation.publishedAt,
                JSON.stringify(legislation.affectedVerticals),
              ],
            );

            newLegislation.push(legislation);
            this.logger.log(`New legislation found: ${legislation.title}`, {
              legislationId: legislation.id,
              sourceId: source.id,
            });
          }
        }
      } catch (error: any) {
        this.logger.error(`Failed to check source ${source.name}: ${error.message}`, error.stack);
      }
    }

    return newLegislation;
  }

  async ingestToVektus(legislation: NewLegislation): Promise<void> {
    const content = `# ${legislation.title}\n\n${legislation.summary}\n\nPublicado em: ${legislation.publishedAt.toISOString()}\nFonte: ${legislation.url ?? 'N/A'}`;

    const result = await this.vektus.ingest(content, {
      fileName: `legislation-${legislation.id}.md`,
      vertical: this.config.vertical,
      category: 'legislation',
      tags: ['legislation', ...legislation.affectedVerticals],
      legislationId: legislation.id,
      sourceId: legislation.sourceId,
    });

    await this.db.query(
      `UPDATE legislation_items SET vektus_file_id = $1 WHERE id = $2`,
      [result.fileId, legislation.id],
    );

    this.logger.log(`Legislation ingested to Vektus: ${legislation.title}`, {
      legislationId: legislation.id,
      vektusFileId: result.fileId,
    });
  }

  async analyzeImpact(legislationId: string, entityId: string): Promise<ImpactReport> {
    const legislation = await this.db.queryOne<NewLegislation>(
      `SELECT id, source_id AS "sourceId", title, summary, url, published_at AS "publishedAt",
              affected_verticals AS "affectedVerticals"
       FROM legislation_items WHERE id = $1`,
      [legislationId],
    );

    if (!legislation) {
      throw new Error(`Legislation not found: ${legislationId}`);
    }

    const searchResults = await this.vektus.search(
      `Impacto da legislação "${legislation.title}" no compliance: ${legislation.summary}`,
      {
        filters: { vertical: this.config.vertical },
        topK: 5,
      },
    );

    const contextChunks = searchResults.map(r => r.content).join('\n\n');

    const skillsContext = await this.vektus.injectSkills('L3', contextChunks, {
      vertical: this.config.vertical,
    });

    const impactAnalysis = this.parseImpactFromContext(skillsContext.context, legislation, entityId);

    await this.db.query(
      `INSERT INTO legislation_impact_reports (id, legislation_id, entity_id, impact_level, affected_areas, required_actions, deadline, analysis, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        ulid(),
        legislationId,
        entityId,
        impactAnalysis.impactLevel,
        JSON.stringify(impactAnalysis.affectedAreas),
        JSON.stringify(impactAnalysis.requiredActions),
        impactAnalysis.deadline ?? null,
        impactAnalysis.analysis,
      ],
    );

    this.logger.log(`Impact analysis completed for legislation ${legislationId}`, {
      entityId,
      impactLevel: impactAnalysis.impactLevel,
    });

    return impactAnalysis;
  }

  private async loadSources(): Promise<LegislationSource[]> {
    const rows = await this.db.query<LegislationSource>(
      `SELECT id, name, affected_verticals AS "affectedVerticals", cron_expression AS "cronExpression", url
       FROM legislation_sources`,
    );

    for (const source of rows) {
      this.sources.set(source.id, source);
    }

    return rows;
  }

  private async fetchFromSource(source: LegislationSource): Promise<Array<{
    title: string;
    summary: string;
    url?: string;
    publishedAt: Date;
  }>> {
    if (!source.url) {
      return [];
    }

    try {
      const response = await axios.get(source.url, { timeout: 15000 });
      const data = response.data;

      if (Array.isArray(data)) {
        return data.map((item: any) => ({
          title: item.title || item.nome || '',
          summary: item.summary || item.ementa || item.resumo || '',
          url: item.url || item.link,
          publishedAt: new Date(item.publishedAt || item.dataPublicacao || item.date || Date.now()),
        }));
      }

      if (data.items && Array.isArray(data.items)) {
        return data.items.map((item: any) => ({
          title: item.title || item.nome || '',
          summary: item.summary || item.ementa || item.resumo || '',
          url: item.url || item.link,
          publishedAt: new Date(item.publishedAt || item.dataPublicacao || item.date || Date.now()),
        }));
      }

      return [];
    } catch (error: any) {
      this.logger.warn(`Failed to fetch from source ${source.name}: ${error.message}`);
      return [];
    }
  }

  private parseImpactFromContext(
    context: string,
    legislation: NewLegislation,
    entityId: string,
  ): ImpactReport {
    const hasHighImpactKeywords = /obrigatório|multa|sanção|penalidade|imediato/i.test(context);
    const hasMediumImpactKeywords = /recomendado|adequação|prazo|atualização/i.test(context);

    let impactLevel: ImpactReport['impactLevel'] = 'BAIXO';
    if (hasHighImpactKeywords) impactLevel = 'ALTO';
    else if (hasMediumImpactKeywords) impactLevel = 'MEDIO';

    const affectedAreas: string[] = [];
    const areaKeywords: Record<string, RegExp> = {
      'Documentação': /documento|registro|arquivo|certidão/i,
      'Licenciamento': /licença|alvará|autorização|permissão/i,
      'Tributário': /imposto|tributo|fiscal|contribuição/i,
      'Trabalhista': /trabalho|empregado|funcionário|CLT/i,
      'Ambiental': /ambiental|meio ambiente|resíduo|poluição/i,
      'Sanitário': /sanitário|saúde|anvisa|vigilância/i,
      'Segurança': /segurança|proteção|EPI|norma regulamentadora/i,
    };

    for (const [area, regex] of Object.entries(areaKeywords)) {
      if (regex.test(context) || regex.test(legislation.summary)) {
        affectedAreas.push(area);
      }
    }

    if (affectedAreas.length === 0) {
      affectedAreas.push('Geral');
    }

    const requiredActions: string[] = [];
    if (impactLevel === 'ALTO') {
      requiredActions.push('Revisar procedimentos internos imediatamente');
      requiredActions.push('Atualizar documentação de compliance');
      requiredActions.push('Notificar responsáveis');
    } else if (impactLevel === 'MEDIO') {
      requiredActions.push('Avaliar necessidade de adequação');
      requiredActions.push('Planejar atualização de processos');
    } else {
      requiredActions.push('Monitorar atualizações futuras');
    }

    return {
      legislationId: legislation.id,
      entityId,
      impactLevel,
      affectedAreas,
      requiredActions,
      deadline: impactLevel === 'ALTO' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined,
      analysis: context.substring(0, 2000),
    };
  }
}
