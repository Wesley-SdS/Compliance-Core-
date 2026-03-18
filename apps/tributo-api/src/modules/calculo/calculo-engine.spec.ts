import { describe, it, expect } from 'vitest';
import { CalculoEngine } from './calculo-engine';

describe('CalculoEngine', () => {
  const engine = new CalculoEngine();

  describe('calcularSimples', () => {
    it('calcula CBS/IBS com alíquotas de referência 2033', () => {
      const result = engine.calcularSimples({
        faturamentoBruto: 100000,
        tipoOperacao: 'VENDA_MERCADORIA',
      });

      expect(result.cbs).toBe(8800); // 100000 * 0.088
      expect(result.ibs).toBe(17700); // 100000 * 0.177
      expect(result.is).toBe(0);
      expect(result.totalTributos).toBe(26500);
      expect(result.cargaTributariaEfetiva).toBe(26.5);
      expect(result.valorLiquido).toBe(73500);
    });

    it('aplica fator de transição 2026', () => {
      const result = engine.calcularSimples({
        faturamentoBruto: 100000,
        tipoOperacao: 'VENDA_MERCADORIA',
        ano: 2026,
      });

      // 2026: cbsFator=0.1, ibsFator=0.05
      expect(result.cbs).toBe(880); // 100000 * 0.088 * 0.1
      expect(result.ibs).toBe(885); // 100000 * 0.177 * 0.05
      expect(result.transicaoFator).toEqual({ cbsFator: 0.1, ibsFator: 0.05 });
    });

    it('aplica fator de transição 2028', () => {
      const result = engine.calcularSimples({
        faturamentoBruto: 100000,
        tipoOperacao: 'VENDA_MERCADORIA',
        ano: 2028,
      });

      // 2028: cbsFator=0.5, ibsFator=0.5
      expect(result.cbs).toBe(4400);
      expect(result.ibs).toBe(8850);
    });

    it('usa alíquotas customizadas', () => {
      const result = engine.calcularSimples({
        faturamentoBruto: 100000,
        tipoOperacao: 'VENDA_MERCADORIA',
        aliquotaCbs: 0.10,
        aliquotaIbs: 0.20,
      });

      expect(result.cbs).toBe(10000);
      expect(result.ibs).toBe(20000);
    });

    it('calcula imposto seletivo', () => {
      const result = engine.calcularSimples({
        faturamentoBruto: 100000,
        tipoOperacao: 'VENDA_MERCADORIA',
        aliquotaIs: 0.25,
      });

      expect(result.is).toBe(25000);
      expect(result.totalTributos).toBe(51500); // 8800 + 17700 + 25000
    });

    it('subtrai créditos PIS/COFINS', () => {
      const result = engine.calcularSimples({
        faturamentoBruto: 100000,
        tipoOperacao: 'VENDA_MERCADORIA',
        creditosPis: 1000,
        creditosCofins: 2000,
      });

      expect(result.creditosAproveitados).toBe(3000);
      expect(result.totalTributos).toBe(23500); // 26500 - 3000
    });

    it('não permite total negativo', () => {
      const result = engine.calcularSimples({
        faturamentoBruto: 1000,
        tipoOperacao: 'VENDA_MERCADORIA',
        creditosPis: 50000,
        creditosCofins: 50000,
      });

      expect(result.totalTributos).toBe(0);
    });

    it('compara com Simples Nacional (Anexo I — Comércio)', () => {
      const result = engine.calcularSimples({
        faturamentoBruto: 100000,
        tipoOperacao: 'VENDA_MERCADORIA',
        regimeTributario: 'SIMPLES_NACIONAL',
        faturamentoAnual: 500000,
      });

      expect(result.impostoRegimeAtual).not.toBeNull();
      expect(result.diferencaRegime).not.toBeNull();
      // Simples Anexo I faixa 360k-720k = 9.5%
      expect(result.impostoRegimeAtual).toBe(9500);
    });

    it('compara com Simples Nacional (Anexo III — Serviços)', () => {
      const result = engine.calcularSimples({
        faturamentoBruto: 100000,
        tipoOperacao: 'PRESTACAO_SERVICO',
        regimeTributario: 'SIMPLES_NACIONAL',
        faturamentoAnual: 500000,
      });

      // Simples Anexo III faixa 360k-720k = 13.5%
      expect(result.impostoRegimeAtual).toBe(13500);
    });

    it('compara com Simples Nacional (Anexo V — Serviços intelectuais)', () => {
      const result = engine.calcularSimples({
        faturamentoBruto: 100000,
        tipoOperacao: 'PRESTACAO_SERVICO_INTELECTUAL',
        regimeTributario: 'SIMPLES_NACIONAL',
        faturamentoAnual: 500000,
      });

      // Simples Anexo V faixa 360k-720k = 19.5%
      expect(result.impostoRegimeAtual).toBe(19500);
    });

    it('compara com Simples Nacional Anexo III faixa 1', () => {
      const result = engine.calcularSimples({
        faturamentoBruto: 10000,
        tipoOperacao: 'PRESTACAO_SERVICO',
        regimeTributario: 'SIMPLES_NACIONAL',
        faturamentoAnual: 100000,
      });

      // Simples Anexo III faixa 1 (até 180k) = 6%
      expect(result.impostoRegimeAtual).toBe(600);
    });

    it('compara com Simples Nacional Anexo V faixa 6', () => {
      const result = engine.calcularSimples({
        faturamentoBruto: 100000,
        tipoOperacao: 'PRESTACAO_SERVICO_INTELECTUAL',
        regimeTributario: 'SIMPLES_NACIONAL',
        faturamentoAnual: 4500000,
      });

      // Simples Anexo V faixa 6 (acima de 3.6M) = 30.5%
      expect(result.impostoRegimeAtual).toBe(30500);
    });

    it('compara com Lucro Presumido (produto)', () => {
      const result = engine.calcularSimples({
        faturamentoBruto: 100000,
        tipoOperacao: 'VENDA_MERCADORIA',
        regimeTributario: 'LUCRO_PRESUMIDO',
      });

      // Presumido produto: PIS 0.65% + COFINS 3% + ICMS 18% = 21.65%
      expect(result.impostoRegimeAtual).toBe(21650);
    });

    it('compara com Lucro Presumido (servico)', () => {
      const result = engine.calcularSimples({
        faturamentoBruto: 100000,
        tipoOperacao: 'PRESTACAO_SERVICO',
        regimeTributario: 'LUCRO_PRESUMIDO',
      });

      // Presumido serviço: PIS 0.65% + COFINS 3% + ISS 5% = 8.65%
      expect(result.impostoRegimeAtual).toBe(8650);
    });

    it('compara com Lucro Real sem créditos (produto)', () => {
      const result = engine.calcularSimples({
        faturamentoBruto: 100000,
        tipoOperacao: 'VENDA_MERCADORIA',
        regimeTributario: 'LUCRO_REAL',
      });

      // Lucro Real produto: PIS 1.65% + COFINS 7.6% + ICMS 18% = 27.25%
      expect(result.impostoRegimeAtual).toBe(27250);
    });

    it('compara com Lucro Real com créditos 30% (produto)', () => {
      const result = engine.calcularSimples({
        faturamentoBruto: 100000,
        tipoOperacao: 'VENDA_MERCADORIA',
        regimeTributario: 'LUCRO_REAL',
        percentualCreditos: 0.30,
      });

      // PIS efetivo = 1.65% * 0.7 = 1.155%, COFINS efetivo = 7.6% * 0.7 = 5.32%
      // PIS + COFINS = 6.475% + ICMS 18% = 24.475%
      const expected = 100000 * (0.0165 * 0.7 + 0.076 * 0.7 + 0.18);
      expect(result.impostoRegimeAtual).toBe(Math.round(expected * 100) / 100);
    });

    it('compara com Lucro Real com créditos 30% (servico)', () => {
      const result = engine.calcularSimples({
        faturamentoBruto: 100000,
        tipoOperacao: 'PRESTACAO_SERVICO',
        regimeTributario: 'LUCRO_REAL',
        percentualCreditos: 0.30,
      });

      // PIS efetivo = 1.65% * 0.7, COFINS efetivo = 7.6% * 0.7 + ISS 5%
      const expected = 100000 * (0.0165 * 0.7 + 0.076 * 0.7 + 0.05);
      expect(result.impostoRegimeAtual).toBe(Math.round(expected * 100) / 100);
    });

    it('compara com MEI', () => {
      const result = engine.calcularSimples({
        faturamentoBruto: 6750,
        tipoOperacao: 'VENDA_MERCADORIA',
        regimeTributario: 'MEI',
      });

      // MEI: DAS fixo ~5% sobre faturamento
      expect(result.impostoRegimeAtual).toBe(337.5);
    });

    it('retorna null para regime desconhecido', () => {
      const result = engine.calcularSimples({
        faturamentoBruto: 100000,
        tipoOperacao: 'VENDA_MERCADORIA',
        regimeTributario: 'DESCONHECIDO',
      });

      expect(result.impostoRegimeAtual).toBe(0);
    });

    it('calcula carga tributária 0 quando faturamento é 0', () => {
      const result = engine.calcularSimples({
        faturamentoBruto: 0,
        tipoOperacao: 'VENDA_MERCADORIA',
      });

      expect(result.cargaTributariaEfetiva).toBe(0);
    });
  });

  describe('calcularImpacto', () => {
    it('calcula impacto por operação com NCM sem redução', () => {
      const result = engine.calcularImpacto({
        operacoes: [
          { descricao: 'Produto X', valor: 50000, tipo: 'PRODUTO' },
        ],
        regimeTributario: 'LUCRO_PRESUMIDO',
        faturamentoAnual: 600000,
        ano: 2033,
      });

      expect(result.operacoes).toHaveLength(1);
      expect(result.operacoes[0].reducaoAplicada).toBe(0);
      expect(result.operacoes[0].fundamentacao).toBeNull();
      expect(result.ano).toBe(2033);
    });

    it('aplica redução 100% para NCM cesta básica', () => {
      const result = engine.calcularImpacto({
        operacoes: [
          { descricao: 'Arroz', valor: 10000, tipo: 'PRODUTO', ncm: '10063011' },
        ],
        regimeTributario: 'SIMPLES_NACIONAL',
        faturamentoAnual: 200000,
        ano: 2033,
      });

      expect(result.operacoes[0].reducaoAplicada).toBe(1.0);
      expect(result.operacoes[0].impostoNovo).toBe(0);
      expect(result.operacoes[0].fundamentacao).toContain('Art. 135');
    });

    it('aplica redução 60% para NCM saúde', () => {
      const result = engine.calcularImpacto({
        operacoes: [
          { descricao: 'Medicamento', valor: 10000, tipo: 'PRODUTO', ncm: '30041000' },
        ],
        regimeTributario: 'LUCRO_REAL',
        faturamentoAnual: 1000000,
        ano: 2033,
      });

      expect(result.operacoes[0].reducaoAplicada).toBe(0.6);
      // CBS efetiva = 0.088 * 0.4 = 0.0352, IBS efetiva = 0.177 * 0.4 = 0.0708
      const expectedNovo = 10000 * (0.088 * 0.4 + 0.177 * 0.4);
      expect(result.operacoes[0].impostoNovo).toBeCloseTo(expectedNovo, 0);
    });

    it('calcula totais e variação', () => {
      const result = engine.calcularImpacto({
        operacoes: [
          { descricao: 'Produto A', valor: 30000, tipo: 'PRODUTO' },
          { descricao: 'Serviço B', valor: 20000, tipo: 'SERVICO' },
        ],
        regimeTributario: 'LUCRO_PRESUMIDO',
        faturamentoAnual: 600000,
        ano: 2033,
      });

      expect(result.totalAntesReforma).toBeGreaterThan(0);
      expect(result.totalAposReforma).toBeGreaterThan(0);
      expect(result.diferencaAbsoluta).toBe(
        result.totalAposReforma - result.totalAntesReforma,
      );
    });
  });

  describe('projetarSimples', () => {
    it('retorna projeção para todos os anos 2026-2033', () => {
      const result = engine.projetarSimples({
        faturamentoBruto: 100000,
        tipoOperacao: 'VENDA_MERCADORIA',
        regimeTributario: 'SIMPLES_NACIONAL',
        faturamentoAnual: 500000,
      });

      expect(result).toHaveLength(8);
      expect(result[0].ano).toBe(2026);
      expect(result[7].ano).toBe(2033);
    });

    it('imposto novo cresce progressivamente', () => {
      const result = engine.projetarSimples({
        faturamentoBruto: 100000,
        tipoOperacao: 'VENDA_MERCADORIA',
        regimeTributario: 'LUCRO_PRESUMIDO',
      });

      for (let i = 1; i < result.length; i++) {
        expect(result[i].regimeNovo).toBeGreaterThanOrEqual(result[i - 1].regimeNovo);
      }
    });

    it('regime atual permanece constante', () => {
      const result = engine.projetarSimples({
        faturamentoBruto: 100000,
        tipoOperacao: 'VENDA_MERCADORIA',
        regimeTributario: 'LUCRO_PRESUMIDO',
      });

      const first = result[0].regimeAtual;
      for (const item of result) {
        expect(item.regimeAtual).toBe(first);
      }
    });
  });

  describe('projetar (com operações)', () => {
    it('retorna projeção detalhada para todos os anos', () => {
      const result = engine.projetar({
        operacoes: [
          { descricao: 'Produto', valor: 50000, tipo: 'PRODUTO' },
        ],
        regimeTributario: 'LUCRO_REAL',
        faturamentoAnual: 1000000,
      });

      expect(result).toHaveLength(8);
      expect(result[0].ano).toBe(2026);
      expect(result[7].ano).toBe(2033);
    });
  });
});
