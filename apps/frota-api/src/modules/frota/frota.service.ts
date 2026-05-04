import { Injectable } from '@nestjs/common';
import { EventStoreService, DatabaseService, ComplianceLogger } from '@compliancecore/sdk';

@Injectable()
export class FrotaService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('FrotaService');
  }

  async getScore() {
    const veiculos = await this.db.query(`SELECT * FROM veiculos WHERE status = 'ATIVO'`);
    const motoristas = await this.db.query(`SELECT * FROM motoristas WHERE status = 'ATIVO'`);
    const viagensEmAndamento = await this.db.query(`SELECT * FROM viagens WHERE status = 'EM_ANDAMENTO'`);

    let totalScore = 0;
    let criterios = 0;

    // Documentacao veicular
    const veiculosDocOk = veiculos.filter((v: any) => v.crlv_valido && v.ipva_quitado).length;
    const docScore = veiculos.length > 0 ? (veiculosDocOk / veiculos.length) * 100 : 100;
    totalScore += docScore;
    criterios++;

    // CNH motoristas
    const motoristasComCnhValida = motoristas.filter(
      (m: any) => m.cnh_validade && new Date(m.cnh_validade) > new Date(),
    ).length;
    const cnhScore = motoristas.length > 0 ? (motoristasComCnhValida / motoristas.length) * 100 : 100;
    totalScore += cnhScore;
    criterios++;

    // Seguro
    const veiculosComSeguro = veiculos.filter((v: any) => v.seguro_valido).length;
    const seguroScore = veiculos.length > 0 ? (veiculosComSeguro / veiculos.length) * 100 : 100;
    totalScore += seguroScore;
    criterios++;

    // Manutencao
    const veiculosManutOk = veiculos.filter((v: any) => v.manutencao_em_dia).length;
    const manutScore = veiculos.length > 0 ? (veiculosManutOk / veiculos.length) * 100 : 100;
    totalScore += manutScore;
    criterios++;

    // CIOT
    const viagensComCiot = viagensEmAndamento.filter((v: any) => v.ciot_numero).length;
    const ciotScore = viagensEmAndamento.length > 0 ? (viagensComCiot / viagensEmAndamento.length) * 100 : 100;
    totalScore += ciotScore;
    criterios++;

    const scoreGeral = Math.round((totalScore / criterios) * 100) / 100;

    return {
      scoreGeral,
      detalhes: {
        documentacaoVeicular: Math.round(docScore * 100) / 100,
        cnhMotoristas: Math.round(cnhScore * 100) / 100,
        seguroObrigatorio: Math.round(seguroScore * 100) / 100,
        manutencaoPreventiva: Math.round(manutScore * 100) / 100,
        ciotEmDia: Math.round(ciotScore * 100) / 100,
      },
      totalVeiculos: veiculos.length,
      totalMotoristas: motoristas.length,
      totalViagensEmAndamento: viagensEmAndamento.length,
    };
  }

  async getStats() {
    const [
      veiculosCount,
      motoristasCount,
      motoristasEmViagem,
      viagensHoje,
      docsExpirando,
      cnhsVencendo,
    ] = await Promise.all([
      this.db.queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM veiculos WHERE status = 'ATIVO'`),
      this.db.queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM motoristas WHERE status = 'ATIVO'`),
      this.db.queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM motoristas WHERE em_viagem = true`),
      this.db.queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM viagens WHERE status = 'EM_ANDAMENTO'`),
      this.db.queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM documents WHERE aggregate_type IN ('veiculo', 'motorista') AND created_at <= NOW() + INTERVAL '30 days'`,
      ),
      this.db.queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM motoristas WHERE status = 'ATIVO' AND cnh_validade <= NOW() + INTERVAL '30 days'`,
      ),
    ]);

    return {
      veiculosAtivos: parseInt(veiculosCount?.count ?? '0', 10),
      motoristasAtivos: parseInt(motoristasCount?.count ?? '0', 10),
      motoristasEmViagem: parseInt(motoristasEmViagem?.count ?? '0', 10),
      viagensEmAndamento: parseInt(viagensHoje?.count ?? '0', 10),
      documentosExpirando: parseInt(docsExpirando?.count ?? '0', 10),
      cnhsVencendo: parseInt(cnhsVencendo?.count ?? '0', 10),
    };
  }

  async getScoreHistory() {
    const rows = await this.db.query(
      `SELECT
         DATE_TRUNC('month', created_at) as mes,
         AVG((data->>'score')::numeric) as score_medio
       FROM event_store
       WHERE aggregate_type = 'veiculo' AND event_type = 'SCORE_CALCULATED'
         AND created_at >= NOW() - INTERVAL '6 months'
       GROUP BY DATE_TRUNC('month', created_at)
       ORDER BY mes ASC`,
    );

    return { data: rows, periodo: '6 meses' };
  }
}
