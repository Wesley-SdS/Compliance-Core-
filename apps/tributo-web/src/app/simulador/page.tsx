'use client';

import { useState } from 'react';

const setores = [
  'Comercio',
  'Industria',
  'Servicos',
  'Tecnologia',
  'Agronegocio',
  'Saude',
  'Educacao',
  'Construcao Civil',
];

interface SimulationResult {
  regimeAtual: {
    pis: number;
    cofins: number;
    icms: number;
    iss: number;
    total: number;
  };
  regimeNovo: {
    cbs: number;
    ibs: number;
    is: number;
    total: number;
  };
  diferenca: number;
  percentual: number;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function simulate(faturamento: number, setor: string): SimulationResult {
  const isServicos = ['Servicos', 'Tecnologia', 'Educacao', 'Saude'].includes(setor);

  const pis = faturamento * 0.0165;
  const cofins = faturamento * 0.076;
  const icms = isServicos ? 0 : faturamento * 0.18;
  const iss = isServicos ? faturamento * 0.05 : 0;
  const totalAtual = pis + cofins + icms + iss;

  const cbs = faturamento * 0.088;
  const ibs = faturamento * 0.175;
  const is = setor === 'Saude' ? faturamento * 0.01 : 0;
  const totalNovo = cbs + ibs + is;

  return {
    regimeAtual: { pis, cofins, icms, iss, total: totalAtual },
    regimeNovo: { cbs, ibs, is, total: totalNovo },
    diferenca: totalNovo - totalAtual,
    percentual: totalAtual > 0 ? ((totalNovo - totalAtual) / totalAtual) * 100 : 0,
  };
}

export default function SimuladorPage() {
  const [faturamento, setFaturamento] = useState(1000000);
  const [setor, setSetor] = useState('Comercio');
  const [result, setResult] = useState<SimulationResult | null>(null);

  async function handleSimulate() {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';
      const res = await fetch(`${API_URL}/calculos/simular`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faturamento, setor }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        return;
      }
    } catch {
      // API unavailable, fall back to client-side calculation
    }
    setResult(simulate(faturamento, setor));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Simulador de Reforma Tributaria</h2>
        <p className="text-sm text-slate-500 mt-1">Compare a carga tributaria atual com o novo regime (CBS/IBS/IS)</p>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Parametros da Simulacao</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="faturamento" className="block text-sm font-medium text-slate-700 mb-1">
              Faturamento Anual (R$)
            </label>
            <input
              id="faturamento"
              type="number"
              value={faturamento}
              onChange={(e) => setFaturamento(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              min={0}
              step={10000}
            />
          </div>

          <div>
            <label htmlFor="setor" className="block text-sm font-medium text-slate-700 mb-1">
              Setor de Atividade
            </label>
            <select
              id="setor"
              value={setor}
              onChange={(e) => setSetor(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              {setores.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleSimulate}
              className="w-full px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Simular
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Regime Atual */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Regime Atual</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">PIS (1,65%)</span>
                <span className="text-sm font-medium text-slate-700 font-mono">{formatCurrency(result.regimeAtual.pis)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">COFINS (7,6%)</span>
                <span className="text-sm font-medium text-slate-700 font-mono">{formatCurrency(result.regimeAtual.cofins)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">ICMS (18%)</span>
                <span className="text-sm font-medium text-slate-700 font-mono">{formatCurrency(result.regimeAtual.icms)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">ISS (5%)</span>
                <span className="text-sm font-medium text-slate-700 font-mono">{formatCurrency(result.regimeAtual.iss)}</span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between">
                <span className="text-sm font-semibold text-slate-800">Total</span>
                <span className="text-sm font-bold text-slate-800 font-mono">{formatCurrency(result.regimeAtual.total)}</span>
              </div>
            </div>
          </div>

          {/* Regime Novo */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Novo Regime (Reforma)</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">CBS (8,8%)</span>
                <span className="text-sm font-medium text-slate-700 font-mono">{formatCurrency(result.regimeNovo.cbs)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">IBS (17,5%)</span>
                <span className="text-sm font-medium text-slate-700 font-mono">{formatCurrency(result.regimeNovo.ibs)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">IS (Imposto Seletivo)</span>
                <span className="text-sm font-medium text-slate-700 font-mono">{formatCurrency(result.regimeNovo.is)}</span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between">
                <span className="text-sm font-semibold text-slate-800">Total</span>
                <span className="text-sm font-bold text-slate-800 font-mono">{formatCurrency(result.regimeNovo.total)}</span>
              </div>
            </div>
          </div>

          {/* Comparacao */}
          <div className={`rounded-xl border p-6 ${result.diferenca > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Comparacao</h3>
            <div className="text-center py-4">
              <div className={`text-3xl font-bold ${result.diferenca > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {result.diferenca > 0 ? '+' : ''}{formatCurrency(result.diferenca)}
              </div>
              <div className={`text-sm font-medium mt-2 ${result.diferenca > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {result.diferenca > 0 ? 'Aumento' : 'Reducao'} de {Math.abs(result.percentual).toFixed(1)}%
              </div>
              <p className="text-xs text-slate-500 mt-4">
                {result.diferenca > 0
                  ? 'A reforma tributaria pode resultar em aumento da carga para este perfil.'
                  : 'A reforma tributaria pode resultar em reducao da carga para este perfil.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {!result && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-slate-500">Preencha os parametros e clique em "Simular" para ver a comparacao.</p>
        </div>
      )}
    </div>
  );
}
