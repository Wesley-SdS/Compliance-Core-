'use client';

import { useState } from 'react';

interface SimulationResult {
  price: {
    parcelas: number;
    valorParcela: number;
    totalPago: number;
    jurosTotal: number;
  };
  sac: {
    parcelas: number;
    primeiraParcela: number;
    ultimaParcela: number;
    totalPago: number;
    jurosTotal: number;
  };
  economia: number;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function simulate(valor: number, entrada: number, taxa: number, prazo: number): SimulationResult {
  const financiado = valor - entrada;
  const taxaMensal = taxa / 100;

  // PRICE (parcelas fixas)
  const priceParcela =
    financiado * (taxaMensal * Math.pow(1 + taxaMensal, prazo)) / (Math.pow(1 + taxaMensal, prazo) - 1);
  const priceTotal = priceParcela * prazo + entrada;
  const priceJuros = priceTotal - valor;

  // SAC (amortizacao constante)
  const amortizacao = financiado / prazo;
  const sacPrimeira = amortizacao + financiado * taxaMensal;
  const sacUltima = amortizacao + amortizacao * taxaMensal;
  let sacTotal = entrada;
  for (let i = 0; i < prazo; i++) {
    const saldoDevedor = financiado - amortizacao * i;
    sacTotal += amortizacao + saldoDevedor * taxaMensal;
  }
  const sacJuros = sacTotal - valor;

  return {
    price: {
      parcelas: prazo,
      valorParcela: priceParcela,
      totalPago: priceTotal,
      jurosTotal: priceJuros,
    },
    sac: {
      parcelas: prazo,
      primeiraParcela: sacPrimeira,
      ultimaParcela: sacUltima,
      totalPago: sacTotal,
      jurosTotal: sacJuros,
    },
    economia: priceTotal - sacTotal,
  };
}

export default function SimuladorPage() {
  const [valor, setValor] = useState(150000);
  const [entrada, setEntrada] = useState(30000);
  const [taxa, setTaxa] = useState(0.85);
  const [prazo, setPrazo] = useState(120);
  const [result, setResult] = useState<SimulationResult | null>(null);

  async function handleSimulate() {
    if (entrada >= valor) return;
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3006';
      const res = await fetch(`${API_URL}/lotes/simular-financiamento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor, entrada, taxa, prazo }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        return;
      }
    } catch {
      // API unavailable, fall back to client-side calculation
    }
    setResult(simulate(valor, entrada, taxa, prazo));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Simulador de Financiamento</h2>
        <p className="text-sm text-slate-500 mt-1">Compare tabelas Price e SAC com parametros ajustaveis</p>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Parametros do Financiamento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label htmlFor="valor" className="block text-sm font-medium text-slate-700 mb-1">
              Valor do Lote (R$)
            </label>
            <input
              id="valor"
              type="number"
              value={valor}
              onChange={(e) => setValor(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              min={0}
              step={1000}
            />
          </div>
          <div>
            <label htmlFor="entrada" className="block text-sm font-medium text-slate-700 mb-1">
              Entrada (R$)
            </label>
            <input
              id="entrada"
              type="number"
              value={entrada}
              onChange={(e) => setEntrada(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              min={0}
              step={1000}
            />
          </div>
          <div>
            <label htmlFor="taxa" className="block text-sm font-medium text-slate-700 mb-1">
              Taxa Mensal (%)
            </label>
            <input
              id="taxa"
              type="number"
              value={taxa}
              onChange={(e) => setTaxa(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              min={0}
              step={0.01}
            />
          </div>
          <div>
            <label htmlFor="prazo" className="block text-sm font-medium text-slate-700 mb-1">
              Prazo (meses)
            </label>
            <input
              id="prazo"
              type="number"
              value={prazo}
              onChange={(e) => setPrazo(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              min={1}
              max={360}
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleSimulate}
              className="w-full px-4 py-2 bg-rose-500 text-white text-sm font-medium rounded-lg hover:bg-rose-600 transition-colors"
            >
              Simular
            </button>
          </div>
        </div>
        <div className="mt-3 text-xs text-slate-500">
          Valor financiado: {formatCurrency(Math.max(0, valor - entrada))} | Entrada: {((entrada / valor) * 100).toFixed(1)}%
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Price */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Tabela Price</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Parcelas</span>
                <span className="text-sm font-medium text-slate-700">{result.price.parcelas}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Valor da Parcela</span>
                <span className="text-sm font-bold text-slate-700 font-mono">{formatCurrency(result.price.valorParcela)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Total de Juros</span>
                <span className="text-sm font-medium text-red-600 font-mono">{formatCurrency(result.price.jurosTotal)}</span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between">
                <span className="text-sm font-semibold text-slate-800">Total Pago</span>
                <span className="text-sm font-bold text-slate-800 font-mono">{formatCurrency(result.price.totalPago)}</span>
              </div>
            </div>
          </div>

          {/* SAC */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Tabela SAC</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Parcelas</span>
                <span className="text-sm font-medium text-slate-700">{result.sac.parcelas}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Primeira Parcela</span>
                <span className="text-sm font-bold text-slate-700 font-mono">{formatCurrency(result.sac.primeiraParcela)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Ultima Parcela</span>
                <span className="text-sm font-medium text-slate-700 font-mono">{formatCurrency(result.sac.ultimaParcela)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Total de Juros</span>
                <span className="text-sm font-medium text-red-600 font-mono">{formatCurrency(result.sac.jurosTotal)}</span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between">
                <span className="text-sm font-semibold text-slate-800">Total Pago</span>
                <span className="text-sm font-bold text-slate-800 font-mono">{formatCurrency(result.sac.totalPago)}</span>
              </div>
            </div>
          </div>

          {/* Comparacao */}
          <div className="bg-green-50 rounded-xl border border-green-200 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Comparacao</h3>
            <div className="text-center py-4">
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(result.economia)}
              </div>
              <div className="text-sm font-medium text-green-600 mt-2">
                Economia com SAC
              </div>
              <p className="text-xs text-slate-500 mt-4">
                A tabela SAC resulta em parcelas decrescentes e menor custo total de juros. A tabela Price oferece parcelas fixas, facilitando o planejamento financeiro.
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
          <p className="text-sm text-slate-500">Preencha os parametros e clique em "Simular" para comparar Price vs SAC.</p>
        </div>
      )}
    </div>
  );
}
