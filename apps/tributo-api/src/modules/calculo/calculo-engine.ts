/**
 * Motor de Cálculo CBS/IBS/IS — LC 214/2025
 *
 * Responsabilidades:
 * - Cálculo de alíquotas com transição progressiva 2026-2033
 * - Reduções por NCM (Art. 135 LC 214/2025)
 * - Comparativo com regimes atuais (Simples, Presumido, Real)
 * - Projeção multi-ano
 */

export interface OperacaoFiscal {
  id?: string;
  ncm?: string;
  nbs?: string;
  descricao: string;
  valor: number;
  tipo: 'PRODUTO' | 'SERVICO' | 'IMPORTACAO';
  icms?: number;
  aliquotaIcms?: number;
}

export interface ResultadoOperacao {
  operacaoId?: string;
  ncm?: string;
  nbs?: string;
  descricao: string;
  valorOperacao: number;
  impostoAtual: number;
  cbsEfetiva: number;
  ibsEfetiva: number;
  impostoNovo: number;
  diferenca: number;
  reducaoAplicada: number;
  fundamentacao: string | null;
}

export interface ResultadoSimulacao {
  ano: number;
  regimeTributario: string;
  aliquotas: { cbsBase: number; ibsBase: number; cbsRef: number; ibsRef: number };
  transicaoFator: { cbsFator: number; ibsFator: number };
  totalAntesReforma: number;
  totalAposReforma: number;
  diferencaAbsoluta: number;
  variacaoPercentual: number;
  operacoes: ResultadoOperacao[];
}

export interface ProjecaoAnual {
  ano: number;
  regimeAtual: number;
  regimeNovo: number;
  diferenca: number;
  variacaoPercentual: number;
}

export class CalculoEngine {
  // Alíquotas de referência 2033 (LC 214/2025 Art. 16)
  private readonly CBS_REF = 0.088;
  private readonly IBS_REF = 0.177;

  // Tabela de transição 2026-2033
  private readonly TRANSICAO: Record<number, { cbsFator: number; ibsFator: number }> = {
    2026: { cbsFator: 0.1,   ibsFator: 0.05  },
    2027: { cbsFator: 0.1,   ibsFator: 0.05  },
    2028: { cbsFator: 0.5,   ibsFator: 0.5   },
    2029: { cbsFator: 0.5,   ibsFator: 0.5   },
    2030: { cbsFator: 0.75,  ibsFator: 0.75  },
    2031: { cbsFator: 0.75,  ibsFator: 0.75  },
    2032: { cbsFator: 0.875, ibsFator: 0.875 },
    2033: { cbsFator: 1.0,   ibsFator: 1.0   },
  };

  // Reduções por NCM conforme Art. 135 LC 214/2025
  private readonly REDUCOES_NCM: Map<string, number> = new Map([
    // Cesta básica (redução 100% — alíquota zero)
    ['0210', 1.0], ['0401', 1.0], ['0713', 1.0],
    ['1006', 1.0], ['1101', 1.0], ['1901', 1.0],
    // Saúde (redução 60%)
    ['3001', 0.6], ['3002', 0.6], ['3003', 0.6], ['3004', 0.6],
    ['9018', 0.6], ['9019', 0.6],
    // Educação (redução 60%)
    ['4901', 0.6], ['4902', 0.6],
    // Transporte público (redução 60%)
    ['8702', 0.6],
    // Agro (redução 60%)
    ['0102', 0.6], ['0201', 0.6], ['0301', 0.6],
  ]);

  /**
   * Calcula alíquotas CBS/IBS para um faturamento simples (sem detalhamento por operação)
   * Mantém compatibilidade com o fluxo existente do CalculoService.simular()
   */
  calcularSimples(params: {
    faturamentoBruto: number;
    tipoOperacao: string;
    aliquotaCbs?: number;
    aliquotaIbs?: number;
    aliquotaIs?: number;
    creditosPis?: number;
    creditosCofins?: number;
    regimeTributario?: string;
    faturamentoAnual?: number;
    ano?: number;
  }) {
    const ano = params.ano ?? 2033;
    const transicao = this.TRANSICAO[ano] ?? this.TRANSICAO[2033];

    const cbsBase = (params.aliquotaCbs ?? this.CBS_REF) * transicao.cbsFator;
    const ibsBase = (params.aliquotaIbs ?? this.IBS_REF) * transicao.ibsFator;
    const aliquotaIs = params.aliquotaIs ?? 0;

    const cbs = params.faturamentoBruto * cbsBase;
    const ibs = params.faturamentoBruto * ibsBase;
    const is = params.faturamentoBruto * aliquotaIs;
    const creditosTotal = (params.creditosPis ?? 0) + (params.creditosCofins ?? 0);
    const totalTributos = Math.max(0, cbs + ibs + is - creditosTotal);
    const cargaTributariaEfetiva = params.faturamentoBruto > 0
      ? (totalTributos / params.faturamentoBruto) * 100
      : 0;
    const valorLiquido = params.faturamentoBruto - totalTributos;

    // Comparativo com regime atual
    let impostoRegimeAtual: number | null = null;
    if (params.regimeTributario) {
      const faturamentoAnual = params.faturamentoAnual ?? params.faturamentoBruto * 12;
      impostoRegimeAtual = this.calcularRegimeAtual(
        params.faturamentoBruto,
        params.tipoOperacao === 'PRESTACAO_SERVICO' ? 'SERVICO' : 'PRODUTO',
        params.regimeTributario,
        faturamentoAnual,
      );
    }

    return {
      cbs: this.round(cbs),
      ibs: this.round(ibs),
      is: this.round(is),
      totalTributos: this.round(totalTributos),
      cargaTributariaEfetiva: this.round(cargaTributariaEfetiva),
      creditosAproveitados: this.round(creditosTotal),
      valorLiquido: this.round(valorLiquido),
      aliquotasEfetivas: { cbs: this.round(cbsBase * 100) / 100, ibs: this.round(ibsBase * 100) / 100 },
      transicaoFator: transicao,
      impostoRegimeAtual: impostoRegimeAtual !== null ? this.round(impostoRegimeAtual) : null,
      diferencaRegime: impostoRegimeAtual !== null
        ? this.round(totalTributos - impostoRegimeAtual)
        : null,
    };
  }

  /**
   * Calcula impacto tributário completo com detalhamento por operação
   */
  calcularImpacto(params: {
    operacoes: OperacaoFiscal[];
    regimeTributario: string;
    faturamentoAnual: number;
    ano: number;
    aliquotaCbsCustom?: number;
    aliquotaIbsCustom?: number;
  }): ResultadoSimulacao {
    const { operacoes, regimeTributario, faturamentoAnual, ano } = params;
    const transicao = this.TRANSICAO[ano] ?? this.TRANSICAO[2033];

    const cbsBase = (params.aliquotaCbsCustom ?? this.CBS_REF) * transicao.cbsFator;
    const ibsBase = (params.aliquotaIbsCustom ?? this.IBS_REF) * transicao.ibsFator;

    const resultadosPorOperacao = operacoes.map(op => {
      const tipoOp = op.tipo === 'SERVICO' ? 'SERVICO' : 'PRODUTO';
      const impostoAtual = this.calcularRegimeAtual(op.valor, tipoOp, regimeTributario, faturamentoAnual);

      const reducao = this.getReducaoNCM(op.ncm);
      const cbsEfetiva = cbsBase * (1 - reducao);
      const ibsEfetiva = ibsBase * (1 - reducao);
      const impostoNovo = op.valor * (cbsEfetiva + ibsEfetiva);

      return {
        operacaoId: op.id,
        ncm: op.ncm,
        nbs: op.nbs,
        descricao: op.descricao,
        valorOperacao: op.valor,
        impostoAtual: this.round(impostoAtual),
        cbsEfetiva: this.round(cbsEfetiva * 100) / 100,
        ibsEfetiva: this.round(ibsEfetiva * 100) / 100,
        impostoNovo: this.round(impostoNovo),
        diferenca: this.round(impostoNovo - impostoAtual),
        reducaoAplicada: reducao,
        fundamentacao: reducao > 0
          ? `Art. 135 LC 214/2025 — Reducao de ${reducao * 100}%`
          : null,
      };
    });

    const totalAntes = resultadosPorOperacao.reduce((s, r) => s + r.impostoAtual, 0);
    const totalDepois = resultadosPorOperacao.reduce((s, r) => s + r.impostoNovo, 0);

    return {
      ano,
      regimeTributario,
      aliquotas: { cbsBase, ibsBase, cbsRef: this.CBS_REF, ibsRef: this.IBS_REF },
      transicaoFator: transicao,
      totalAntesReforma: this.round(totalAntes),
      totalAposReforma: this.round(totalDepois),
      diferencaAbsoluta: this.round(totalDepois - totalAntes),
      variacaoPercentual: totalAntes > 0
        ? this.round(((totalDepois - totalAntes) / totalAntes) * 100)
        : 0,
      operacoes: resultadosPorOperacao,
    };
  }

  /**
   * Projeção multi-ano 2026-2033
   */
  projetar(params: {
    operacoes: OperacaoFiscal[];
    regimeTributario: string;
    faturamentoAnual: number;
  }): ProjecaoAnual[] {
    return Object.keys(this.TRANSICAO).map(anoStr => {
      const ano = Number(anoStr);
      const resultado = this.calcularImpacto({ ...params, ano });
      return {
        ano,
        regimeAtual: resultado.totalAntesReforma,
        regimeNovo: resultado.totalAposReforma,
        diferenca: resultado.diferencaAbsoluta,
        variacaoPercentual: resultado.variacaoPercentual,
      };
    });
  }

  /**
   * Projeção simples (sem operações detalhadas) para o endpoint existente
   */
  projetarSimples(params: {
    faturamentoBruto: number;
    tipoOperacao: string;
    regimeTributario: string;
    faturamentoAnual?: number;
  }): ProjecaoAnual[] {
    const faturamentoAnual = params.faturamentoAnual ?? params.faturamentoBruto * 12;
    const tipoOp = params.tipoOperacao === 'PRESTACAO_SERVICO' ? 'SERVICO' : 'PRODUTO';
    const impostoAtual = this.calcularRegimeAtual(
      params.faturamentoBruto, tipoOp, params.regimeTributario, faturamentoAnual,
    );

    return Object.entries(this.TRANSICAO).map(([anoStr, transicao]) => {
      const ano = Number(anoStr);
      const cbsBase = this.CBS_REF * transicao.cbsFator;
      const ibsBase = this.IBS_REF * transicao.ibsFator;
      const impostoNovo = params.faturamentoBruto * (cbsBase + ibsBase);

      return {
        ano,
        regimeAtual: this.round(impostoAtual),
        regimeNovo: this.round(impostoNovo),
        diferenca: this.round(impostoNovo - impostoAtual),
        variacaoPercentual: impostoAtual > 0
          ? this.round(((impostoNovo - impostoAtual) / impostoAtual) * 100)
          : 0,
      };
    });
  }

  private calcularRegimeAtual(
    valor: number,
    tipo: string,
    regime: string,
    faturamentoAnual: number,
  ): number {
    switch (regime) {
      case 'SIMPLES_NACIONAL':
      case 'SIMPLES':
        return this.calcularSimplesFaixa(valor, faturamentoAnual);
      case 'LUCRO_PRESUMIDO':
      case 'PRESUMIDO':
        return this.calcularPresumido(valor, tipo);
      case 'LUCRO_REAL':
      case 'REAL':
        return this.calcularReal(valor, tipo);
      case 'MEI':
        return valor * 0.05; // DAS fixo ~5% sobre faturamento
      default:
        return 0;
    }
  }

  private calcularSimplesFaixa(valor: number, faturamentoAnual: number): number {
    // Tabela Simples Nacional Anexo I — Comércio (LC 123/2006)
    if (faturamentoAnual <= 180000) return valor * 0.04;
    if (faturamentoAnual <= 360000) return valor * 0.073;
    if (faturamentoAnual <= 720000) return valor * 0.095;
    if (faturamentoAnual <= 1800000) return valor * 0.107;
    if (faturamentoAnual <= 3600000) return valor * 0.143;
    return valor * 0.19;
  }

  private calcularPresumido(valor: number, tipo: string): number {
    // PIS 0.65% + COFINS 3% + ICMS ~18% ou ISS ~5%
    const pisCofins = valor * 0.0365;
    const icmsOuIss = tipo === 'SERVICO' ? valor * 0.05 : valor * 0.18;
    return pisCofins + icmsOuIss;
  }

  private calcularReal(valor: number, tipo: string): number {
    // PIS 1.65% + COFINS 7.6% (não-cumulativo, sem descontar créditos) + ICMS ~18% ou ISS ~5%
    const pisCofins = valor * 0.0925;
    const icmsOuIss = tipo === 'SERVICO' ? valor * 0.05 : valor * 0.18;
    return pisCofins + icmsOuIss;
  }

  private getReducaoNCM(ncm?: string): number {
    if (!ncm) return 0;
    const prefixo4 = ncm.substring(0, 4);
    return this.REDUCOES_NCM.get(prefixo4) ?? 0;
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
