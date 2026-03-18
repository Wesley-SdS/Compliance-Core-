import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@compliancecore/sdk/shared/database';
import { ComplianceLogger } from '@compliancecore/sdk/shared/logger';

@Injectable()
export class StatsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('StatsService');
  }

  async getGlobalScore() {
    const result = await this.db.queryOne<{ avg_score: string; count: string }>(
      `SELECT AVG(score) as avg_score, COUNT(*) as count FROM loteamentos WHERE score IS NOT NULL`,
    );

    const avg = result?.avg_score ? Math.round(parseFloat(result.avg_score) * 100) / 100 : 0;
    const level = avg >= 80 ? 'EXCELENTE' : avg >= 60 ? 'BOM' : avg >= 40 ? 'ATENCAO' : 'CRITICO';

    return {
      score: avg,
      level,
      trend: 'ESTAVEL' as const,
      criteria: [],
      totalLoteamentos: parseInt(result?.count ?? '0', 10),
    };
  }

  async getStats() {
    const loteamentosResult = await this.db.queryOne<{ total: string }>(
      `SELECT COUNT(*) as total FROM loteamentos`,
    );

    const lotesResult = await this.db.queryOne<{
      total: string; disponivel: string; reservado: string; vendido: string;
    }>(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'DISPONIVEL') as disponivel,
        COUNT(*) FILTER (WHERE status = 'RESERVADO') as reservado,
        COUNT(*) FILTER (WHERE status = 'VENDIDO') as vendido
       FROM lotes`,
    );

    const contratosResult = await this.db.queryOne<{
      ativos: string; total: string; inadimplentes: string;
    }>(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'ATIVO') as ativos,
        COUNT(*) FILTER (WHERE status != 'DISTRATADO') as total,
        COUNT(*) FILTER (WHERE status = 'INADIMPLENTE') as inadimplentes
       FROM contratos`,
    );

    const totalContratos = parseInt(contratosResult?.total ?? '0', 10);
    const inadimplentes = parseInt(contratosResult?.inadimplentes ?? '0', 10);

    return {
      loteamentos_ativos: parseInt(loteamentosResult?.total ?? '0', 10),
      lotes_total: parseInt(lotesResult?.total ?? '0', 10),
      lotes_vendidos: parseInt(lotesResult?.vendido ?? '0', 10),
      lotes_disponiveis: parseInt(lotesResult?.disponivel ?? '0', 10),
      contratos_ativos: parseInt(contratosResult?.ativos ?? '0', 10),
      inadimplencia_pct: totalContratos > 0
        ? Math.round((inadimplentes / totalContratos) * 10000) / 100
        : 0,
    };
  }

  async getScoreHistory() {
    try {
      const rows = await this.db.query(
        `SELECT DATE_TRUNC('month', e.timestamp) as mes,
                AVG((e.payload->>'score')::numeric) as score
         FROM events e
         WHERE e.aggregate_type = 'loteamento' AND e.event_type = 'SCORE_CALCULATED'
           AND e.timestamp > NOW() - INTERVAL '6 months'
         GROUP BY DATE_TRUNC('month', e.timestamp)
         ORDER BY mes`,
      );
      return { history: rows.map((r: any) => ({ date: r.mes, score: Math.round(parseFloat(r.score || '0') * 100) / 100, level: parseFloat(r.score || '0') >= 80 ? 'EXCELENTE' : parseFloat(r.score || '0') >= 60 ? 'BOM' : parseFloat(r.score || '0') >= 40 ? 'ATENCAO' : 'CRITICO' })) };
    } catch {
      return { history: [] };
    }
  }
}
