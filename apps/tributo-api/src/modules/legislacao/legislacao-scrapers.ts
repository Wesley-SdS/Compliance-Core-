import { Injectable, OnModuleInit } from '@nestjs/common';
import { LegislationMonitorService } from '@compliancecore/sdk/legislation/legislation-monitor.service';
import { ComplianceLogger } from '@compliancecore/sdk/shared/logger';

/**
 * Registra fontes de legislação tributária no LegislationMonitorService do SDK.
 * O SDK já faz o fetch HTTP, parsing e dedup — aqui só registramos as fontes.
 */
@Injectable()
export class LegislacaoScrapersService implements OnModuleInit {
  constructor(
    private readonly legislationMonitor: LegislationMonitorService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('LegislacaoScrapersService');
  }

  async onModuleInit() {
    await this.registerSources();
  }

  private async registerSources() {
    const sources = [
      {
        name: 'Receita Federal - Legislação Tributária',
        affectedVerticals: ['tributo'],
        cronExpression: '0 8 * * 1-5', // Seg-Sex 8h
        url: 'https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/legislacao/legislacao-por-assunto/api/legislacao-tributaria.json',
      },
      {
        name: 'DOU - Seção 1 (Tributário)',
        affectedVerticals: ['tributo'],
        cronExpression: '0 7 * * 1-5', // Seg-Sex 7h
        url: 'https://www.in.gov.br/leiturajornal?secao=do1&api=json',
      },
      {
        name: 'Planalto - Leis Complementares',
        affectedVerticals: ['tributo'],
        cronExpression: '0 9 * * 1', // Segunda 9h
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/api/recentes.json',
      },
      {
        name: 'CONFAZ - Convênios ICMS',
        affectedVerticals: ['tributo'],
        cronExpression: '0 10 * * 3', // Quarta 10h
        url: 'https://www.confaz.fazenda.gov.br/legislacao/convenios/api/recentes.json',
      },
    ];

    for (const source of sources) {
      try {
        await this.legislationMonitor.registerSource(source);
        this.logger.log(`Fonte registrada: ${source.name}`);
      } catch (err: any) {
        this.logger.warn(`Falha ao registrar fonte ${source.name}: ${err.message}`);
      }
    }
  }

  /**
   * Executa verificação manual de novas legislações em todas as fontes registradas.
   * Chamado pelo endpoint POST /legislacao/check
   */
  async checkNow() {
    const newItems = await this.legislationMonitor.check();

    // Ingerir novos itens no Vektus para análise de impacto
    for (const item of newItems) {
      try {
        await this.legislationMonitor.ingestToVektus(item);
      } catch (err: any) {
        this.logger.warn(`Falha ao ingerir legislação ${item.title}: ${err.message}`);
      }
    }

    return {
      found: newItems.length,
      items: newItems.map(i => ({ id: i.id, title: i.title, publishedAt: i.publishedAt })),
    };
  }

  /**
   * Analisa impacto de uma legislação em uma empresa específica
   */
  async analyzeImpact(legislationId: string, empresaId: string) {
    return this.legislationMonitor.analyzeImpact(legislationId, empresaId);
  }
}
