import { Injectable, NotFoundException } from '@nestjs/common';
import { ulid } from 'ulid';
import { EventStoreService, DatabaseService, ComplianceLogger } from '@compliancecore/sdk';

export interface OtimizacaoResult {
  cenarioAtual: { totalCreditos: number; cargaTotal: number };
  cenarioOtimizado: { totalCreditos: number; cargaTotal: number };
  economia: number;
  recomendacoes: Array<{
    fornecedor: string;
    regimeAtual: string;
    regimeRecomendado: string;
    economiaEstimada: number;
  }>;
}

@Injectable()
export class OtimizadorService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventStore: EventStoreService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('OtimizadorService');
  }

  async otimizar(empresaId: string, actorId: string): Promise<OtimizacaoResult> {
    const empresa = await this.db.queryOne(`SELECT * FROM empresas WHERE id = $1`, [empresaId]);
    if (!empresa) throw new NotFoundException(`Empresa ${empresaId} nao encontrada`);

    const calculos = await this.db.query(
      `SELECT * FROM calculos_tributarios WHERE empresa_id = $1 ORDER BY simulado_em DESC LIMIT 12`,
      [empresaId],
    );

    const cargaAtual = calculos.length > 0
      ? calculos.reduce((sum: number, c: any) => sum + (c.total_tributos ?? 0), 0) / calculos.length
      : 0;
    const creditosAtuais = calculos.length > 0
      ? calculos.reduce((sum: number, c: any) => sum + (c.creditos_aproveitados ?? 0), 0) / calculos.length
      : 0;

    const faturamentoMedio = calculos.length > 0
      ? calculos.reduce((sum: number, c: any) => sum + (c.faturamento_bruto ?? 0), 0) / calculos.length
      : 100000;

    // Simula otimizacao: analise de mix de fornecedores e regime
    const potencialCreditos = creditosAtuais * 1.25;
    const cargaOtimizada = Math.max(0, cargaAtual - (potencialCreditos - creditosAtuais));
    const economia = cargaAtual - cargaOtimizada;

    const recomendacoes = [];

    if (empresa.regime_tributario === 'SIMPLES_NACIONAL' && faturamentoMedio > 300000) {
      recomendacoes.push({
        fornecedor: 'Regime Tributario',
        regimeAtual: 'SIMPLES_NACIONAL',
        regimeRecomendado: 'LUCRO_PRESUMIDO',
        economiaEstimada: faturamentoMedio * 0.02,
      });
    }

    if (creditosAtuais < faturamentoMedio * 0.05) {
      recomendacoes.push({
        fornecedor: 'Creditos PIS/COFINS',
        regimeAtual: 'Aproveitamento parcial',
        regimeRecomendado: 'Aproveitamento integral',
        economiaEstimada: faturamentoMedio * 0.015,
      });
    }

    recomendacoes.push({
      fornecedor: 'Fornecedores optantes',
      regimeAtual: 'Mix nao otimizado',
      regimeRecomendado: 'Priorizar contribuintes CBS/IBS',
      economiaEstimada: economia * 0.3,
    });

    const result: OtimizacaoResult = {
      cenarioAtual: { totalCreditos: Math.round(creditosAtuais * 100) / 100, cargaTotal: Math.round(cargaAtual * 100) / 100 },
      cenarioOtimizado: { totalCreditos: Math.round(potencialCreditos * 100) / 100, cargaTotal: Math.round(cargaOtimizada * 100) / 100 },
      economia: Math.round(economia * 100) / 100,
      recomendacoes,
    };

    await this.eventStore.append(empresaId, 'empresa', 'OTIMIZACAO_EXECUTADA', {
      economia: result.economia, recomendacoes: recomendacoes.length,
    }, {
      actorId, actorRole: 'contador', ip: '0.0.0.0', correlationId: ulid(),
    });

    this.logger.log(`Otimizacao executada para empresa ${empresaId}`, { empresaId, economia: result.economia });
    return result;
  }
}
