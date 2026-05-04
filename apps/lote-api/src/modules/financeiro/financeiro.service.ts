import { Injectable } from '@nestjs/common';
import { DatabaseService, ComplianceLogger } from '@compliancecore/sdk';

@Injectable()
export class FinanceiroService {
  constructor(
    private readonly db: DatabaseService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('FinanceiroService');
  }

  async getDashboard(loteamentoId: string) {
    const vgvResult = await this.db.queryOne<{ vgv: string }>(
      `SELECT COALESCE(SUM(valor_total), 0) as vgv FROM contratos WHERE loteamento_id = $1 AND status != 'DISTRATADO'`,
      [loteamentoId],
    );

    const recebidoResult = await this.db.queryOne<{ recebido: string }>(
      `SELECT COALESCE(SUM(p.valor_pago), 0) as recebido
       FROM parcelas p
       JOIN contratos c ON c.id = p.contrato_id
       WHERE c.loteamento_id = $1 AND p.status = 'PAGO' AND c.status != 'DISTRATADO'`,
      [loteamentoId],
    );

    const aReceberResult = await this.db.queryOne<{ a_receber: string }>(
      `SELECT COALESCE(SUM(p.valor_prestacao), 0) as a_receber
       FROM parcelas p
       JOIN contratos c ON c.id = p.contrato_id
       WHERE c.loteamento_id = $1 AND p.status != 'PAGO' AND c.status != 'DISTRATADO'`,
      [loteamentoId],
    );

    const inadimplenciaResult = await this.db.queryOne<{ valor: string }>(
      `SELECT COALESCE(SUM(p.valor_prestacao), 0) as valor
       FROM parcelas p
       JOIN contratos c ON c.id = p.contrato_id
       WHERE c.loteamento_id = $1 AND p.status = 'ATRASADO' AND c.status != 'DISTRATADO'`,
      [loteamentoId],
    );

    const contratosResult = await this.db.queryOne<{ ativos: string; quitados: string; total: string }>(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'ATIVO') as ativos,
        COUNT(*) FILTER (WHERE status = 'QUITADO') as quitados,
        COUNT(*) FILTER (WHERE status != 'DISTRATADO') as total
       FROM contratos WHERE loteamento_id = $1`,
      [loteamentoId],
    );

    const vgv = parseFloat(vgvResult?.vgv ?? '0');
    const recebido = parseFloat(recebidoResult?.recebido ?? '0');
    const aReceber = parseFloat(aReceberResult?.a_receber ?? '0');
    const inadimplenciaR = parseFloat(inadimplenciaResult?.valor ?? '0');
    const inadimplenciaPct = vgv > 0 ? Math.round((inadimplenciaR / vgv) * 10000) / 100 : 0;

    return {
      vgv,
      recebido,
      aReceber,
      inadimplenciaR,
      inadimplenciaPct,
      contratosAtivos: parseInt(contratosResult?.ativos ?? '0', 10),
      contratosQuitados: parseInt(contratosResult?.quitados ?? '0', 10),
    };
  }
}
