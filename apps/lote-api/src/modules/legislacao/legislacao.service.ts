import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@compliancecore/sdk/shared/database';
import { ComplianceLogger } from '@compliancecore/sdk/shared/logger';

@Injectable()
export class LegislacaoService {
  constructor(
    private readonly db: DatabaseService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('LegislacaoService');
  }

  async getFeed() {
    // Try to get from DB first
    let dbItems: any[] = [];
    try {
      dbItems = await this.db.query(
        `SELECT * FROM legislacao_feed ORDER BY data DESC LIMIT 50`,
      );
    } catch {
      // Table may not exist yet, use only hardcoded
    }

    const hardcodedItems = [
      {
        id: 'lei-6766',
        titulo: 'Lei 6.766/1979 - Parcelamento do Solo Urbano',
        descricao: 'Dispoe sobre o parcelamento do solo urbano e da outras providencias. Base legal principal para loteamentos.',
        tipo: 'LEI_FEDERAL',
        data: '1979-12-19',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/l6766.htm',
      },
      {
        id: 'lei-13465',
        titulo: 'Lei 13.465/2017 - Regularizacao Fundiaria',
        descricao: 'Dispoe sobre a regularizacao fundiaria rural e urbana (Reurb).',
        tipo: 'LEI_FEDERAL',
        data: '2017-07-11',
        url: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13465.htm',
      },
      {
        id: 'lei-14382',
        titulo: 'Lei 14.382/2022 - SERP',
        descricao: 'Sistema Eletronico dos Registros Publicos. Modernizacao dos registros de imoveis.',
        tipo: 'LEI_FEDERAL',
        data: '2022-06-27',
        url: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/l14382.htm',
      },
      {
        id: 'cdc-loteamento',
        titulo: 'CDC aplicado a Loteamentos',
        descricao: 'Codigo de Defesa do Consumidor aplica-se a relacao entre loteador e comprador de lote.',
        tipo: 'JURISPRUDENCIA',
        data: '1990-09-11',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm',
      },
      {
        id: 'lei-4591',
        titulo: 'Lei 4.591/1964 - Incorporacoes Imobiliarias',
        descricao: 'Dispoe sobre o condominio em edificacoes e as incorporacoes imobiliarias. Referencia para loteamentos de acesso controlado.',
        tipo: 'LEI_FEDERAL',
        data: '1964-12-16',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/l4591.htm',
      },
      {
        id: 'resolucao-conama-237',
        titulo: 'Resolucao CONAMA 237/1997 - Licenciamento Ambiental',
        descricao: 'Regulamenta os aspectos de licenciamento ambiental estabelecidos na Politica Nacional do Meio Ambiente.',
        tipo: 'RESOLUCAO',
        data: '1997-12-19',
        url: 'https://www.ibama.gov.br/sophia/cnia/legislacao/MMA/RE0237-191297.PDF',
      },
    ];

    return [...dbItems, ...hardcodedItems].sort((a, b) =>
      new Date(b.data).getTime() - new Date(a.data).getTime(),
    );
  }
}
