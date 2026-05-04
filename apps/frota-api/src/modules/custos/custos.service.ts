import { Injectable } from '@nestjs/common';
import { DatabaseService, ComplianceLogger } from '@compliancecore/sdk';

@Injectable()
export class CustosService {
  constructor(
    private readonly db: DatabaseService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('CustosService');
  }

  async getCustos(periodo: string, veiculoId?: string) {
    let interval: string;
    switch (periodo) {
      case 'semana':
        interval = '7 days';
        break;
      case 'trimestre':
        interval = '90 days';
        break;
      case 'mes':
      default:
        interval = '30 days';
        break;
    }

    const veiculoFilter = veiculoId ? 'AND veiculo_id = $2' : '';
    const params: any[] = [interval];
    if (veiculoId) params.push(veiculoId);

    const [abastecimentos, manutencoes] = await Promise.all([
      this.db.queryOne<{ total: string; count: string }>(
        `SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count
         FROM abastecimentos
         WHERE data >= NOW() - INTERVAL '1 day' * $1::integer ${veiculoFilter}`.replace(
          "INTERVAL '1 day' * $1::integer",
          `INTERVAL '${interval}'`,
        ).replace('$1', veiculoId ? '$1' : '$1'),
        veiculoId ? [veiculoId] : [],
      ),
      this.db.queryOne<{ total: string; count: string }>(
        `SELECT COALESCE(SUM(custo), 0) as total, COUNT(*) as count
         FROM manutencoes
         WHERE data >= NOW() - INTERVAL '${interval}' ${veiculoId ? 'AND veiculo_id = $1' : ''}`,
        veiculoId ? [veiculoId] : [],
      ),
    ]);

    const custoAbastecimentos = parseFloat(abastecimentos?.total ?? '0');
    const custoManutencoes = parseFloat(manutencoes?.total ?? '0');

    const porVeiculo = await this.db.query(
      `SELECT v.id, v.placa,
         COALESCE(a.total_abast, 0) as custo_abastecimento,
         COALESCE(m.total_manut, 0) as custo_manutencao,
         COALESCE(a.total_abast, 0) + COALESCE(m.total_manut, 0) as custo_total
       FROM veiculos v
       LEFT JOIN (
         SELECT veiculo_id, SUM(total) as total_abast
         FROM abastecimentos WHERE data >= NOW() - INTERVAL '${interval}'
         GROUP BY veiculo_id
       ) a ON a.veiculo_id = v.id
       LEFT JOIN (
         SELECT veiculo_id, SUM(custo) as total_manut
         FROM manutencoes WHERE data >= NOW() - INTERVAL '${interval}'
         GROUP BY veiculo_id
       ) m ON m.veiculo_id = v.id
       WHERE v.status = 'ATIVO'
       ORDER BY custo_total DESC`,
    );

    return {
      periodo,
      custoTotal: custoAbastecimentos + custoManutencoes,
      custoAbastecimentos,
      custoManutencoes,
      qtdAbastecimentos: parseInt(abastecimentos?.count ?? '0', 10),
      qtdManutencoes: parseInt(manutencoes?.count ?? '0', 10),
      porVeiculo,
    };
  }
}
