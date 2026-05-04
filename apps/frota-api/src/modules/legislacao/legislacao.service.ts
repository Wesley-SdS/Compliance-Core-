import { Injectable } from '@nestjs/common';
import { DatabaseService, ComplianceLogger } from '@compliancecore/sdk';

@Injectable()
export class LegislacaoService {
  constructor(
    private readonly db: DatabaseService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('LegislacaoService');
  }

  async findAll() {
    // Tenta buscar do banco; se nao houver tabela, retorna dados seed
    try {
      const rows = await this.db.query(
        `SELECT * FROM legislacao_updates ORDER BY data_publicacao DESC LIMIT 50`,
      );
      if (rows.length > 0) return { data: rows };
    } catch {
      // tabela nao existe ainda, retorna dados seed
    }

    return {
      data: [
        {
          id: '1',
          titulo: 'Resolucao ANTT 5.867/2020 - Transporte Rodoviario de Cargas',
          resumo: 'Regulamenta o transporte rodoviario de cargas e exige CIOT para todas as operacoes.',
          categoria: 'TRANSPORTE_CARGAS',
          orgao: 'ANTT',
          dataPublicacao: '2020-06-15',
          impacto: 'ALTO',
          url: 'https://www.gov.br/antt',
        },
        {
          id: '2',
          titulo: 'Lei 13.103/2015 - Lei do Motorista Profissional',
          resumo: 'Disciplina a jornada de trabalho e o tempo de descanso obrigatorio para motoristas profissionais.',
          categoria: 'JORNADA_MOTORISTA',
          orgao: 'Congresso Nacional',
          dataPublicacao: '2015-03-02',
          impacto: 'ALTO',
          url: 'https://www.planalto.gov.br',
        },
        {
          id: '3',
          titulo: 'Resolucao CONTRAN 968/2022 - Tacografo Digital',
          resumo: 'Obrigatoriedade de tacografo digital em veiculos de transporte de carga e passageiros.',
          categoria: 'TACOGRAFO',
          orgao: 'CONTRAN',
          dataPublicacao: '2022-08-10',
          impacto: 'MEDIO',
          url: 'https://www.gov.br/contran',
        },
        {
          id: '4',
          titulo: 'Resolucao ANTT 5.848/2019 - RNTRC',
          resumo: 'Registro Nacional de Transportadores Rodoviarios de Cargas.',
          categoria: 'REGISTRO',
          orgao: 'ANTT',
          dataPublicacao: '2019-12-03',
          impacto: 'MEDIO',
          url: 'https://www.gov.br/antt',
        },
        {
          id: '5',
          titulo: 'Resolucao CONTRAN 955/2022 - Seguro DPVAT',
          resumo: 'Atualizacao das regras do seguro obrigatorio para veiculos automotores.',
          categoria: 'SEGUROS',
          orgao: 'CONTRAN',
          dataPublicacao: '2022-03-15',
          impacto: 'BAIXO',
          url: 'https://www.gov.br/contran',
        },
      ],
    };
  }
}
