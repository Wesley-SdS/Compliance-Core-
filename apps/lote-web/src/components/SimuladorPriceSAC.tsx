'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

const schema = z.object({
  valorLote: z.number().min(1, 'Valor obrigatório'),
  valorEntrada: z.number().min(0),
  numeroParcelas: z.number().min(1).max(360),
  taxaJurosMensal: z.number().min(0).max(10),
  sistema: z.enum(['PRICE', 'SAC']),
});

type FormData = z.infer<typeof schema>;

interface Parcela {
  numero: number;
  amortizacao: number;
  juros: number;
  prestacao: number;
  saldoDevedor: number;
}

interface SimulationResult {
  sistema: string;
  valorFinanciado: number;
  parcelas: Parcela[];
  totalPago: number;
  totalJuros: number;
}

interface SimuladorPriceSACProps {
  loteId?: string;
  valorInicial?: number;
  onApply?: (result: SimulationResult) => void;
}

export function SimuladorPriceSAC({ loteId, valorInicial, onApply }: SimuladorPriceSACProps) {
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [comparing, setComparing] = useState<SimulationResult | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      valorLote: valorInicial ?? 150000,
      valorEntrada: 30000,
      numeroParcelas: 120,
      taxaJurosMensal: 0.85,
      sistema: 'PRICE',
    },
  });

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const sistema = watch('sistema');

  function calculate(data: FormData): SimulationResult {
    const valorFinanciado = data.valorLote - data.valorEntrada;
    const taxa = data.taxaJurosMensal / 100;
    const parcelas: Parcela[] = [];

    if (data.sistema === 'PRICE') {
      const coef = taxa > 0
        ? (taxa * Math.pow(1 + taxa, data.numeroParcelas)) / (Math.pow(1 + taxa, data.numeroParcelas) - 1)
        : 1 / data.numeroParcelas;
      const prestacaoFixa = valorFinanciado * coef;
      let saldo = valorFinanciado;

      for (let i = 1; i <= data.numeroParcelas; i++) {
        const juros = saldo * taxa;
        const amortizacao = prestacaoFixa - juros;
        saldo -= amortizacao;
        parcelas.push({
          numero: i,
          amortizacao: Math.round(amortizacao * 100) / 100,
          juros: Math.round(juros * 100) / 100,
          prestacao: Math.round(prestacaoFixa * 100) / 100,
          saldoDevedor: Math.max(0, Math.round(saldo * 100) / 100),
        });
      }
    } else {
      const amortFixa = valorFinanciado / data.numeroParcelas;
      let saldo = valorFinanciado;

      for (let i = 1; i <= data.numeroParcelas; i++) {
        const juros = saldo * taxa;
        const prestacao = amortFixa + juros;
        saldo -= amortFixa;
        parcelas.push({
          numero: i,
          amortizacao: Math.round(amortFixa * 100) / 100,
          juros: Math.round(juros * 100) / 100,
          prestacao: Math.round(prestacao * 100) / 100,
          saldoDevedor: Math.max(0, Math.round(saldo * 100) / 100),
        });
      }
    }

    const totalPago = data.valorEntrada + parcelas.reduce((s, p) => s + p.prestacao, 0);
    const totalJuros = parcelas.reduce((s, p) => s + p.juros, 0);

    return { sistema: data.sistema, valorFinanciado, parcelas, totalPago: Math.round(totalPago * 100) / 100, totalJuros: Math.round(totalJuros * 100) / 100 };
  }

  function onSubmit(data: FormData) {
    const res = calculate(data);
    setResult(res);
    // Also calculate the other system for comparison
    const otherData = { ...data, sistema: data.sistema === 'PRICE' ? 'SAC' as const : 'PRICE' as const };
    setComparing(calculate(otherData));
  }

  // Chart data — sample every N parcelas for readability
  const chartData = result ? (() => {
    const step = Math.max(1, Math.floor(result.parcelas.length / 24));
    const sampled = result.parcelas.filter((_, i) => i % step === 0 || i === result.parcelas.length - 1);
    return sampled.map(p => ({
      parcela: p.numero,
      Amortização: p.amortizacao,
      Juros: p.juros,
    }));
  })() : [];

  return (
    <div className="space-y-6">
      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Parâmetros do Financiamento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Valor do Lote (R$)</label>
            <input type="number" {...register('valorLote', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
            {errors.valorLote && <p className="text-xs text-red-500 mt-1">{errors.valorLote.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Entrada (R$)</label>
            <input type="number" {...register('valorEntrada', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Parcelas</label>
            <input type="number" {...register('numeroParcelas', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Taxa Mensal (%)</label>
            <input type="number" step="0.01" {...register('taxaJurosMensal', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Sistema</label>
            <select {...register('sistema')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500">
              <option value="PRICE">Price</option>
              <option value="SAC">SAC</option>
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit"
              className="w-full px-4 py-2 bg-rose-500 text-white text-sm font-medium rounded-lg hover:bg-rose-600 transition-colors">
              Simular
            </button>
          </div>
        </div>
      </form>

      {/* Results */}
      {result && comparing && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="text-xs font-medium text-slate-500 mb-1">Tabela {result.sistema}</div>
              <div className="text-2xl font-bold text-slate-800 font-mono">{formatCurrency(result.parcelas[0].prestacao)}</div>
              <div className="text-xs text-slate-400 mt-1">
                {result.sistema === 'PRICE' ? 'parcela fixa' : `primeira parcela (última: ${formatCurrency(result.parcelas[result.parcelas.length - 1].prestacao)})`}
              </div>
              <div className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-slate-500">Total juros</span><span className="text-red-600 font-medium font-mono">{formatCurrency(result.totalJuros)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Total pago</span><span className="text-slate-700 font-medium font-mono">{formatCurrency(result.totalPago)}</span></div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="text-xs font-medium text-slate-500 mb-1">Tabela {comparing.sistema}</div>
              <div className="text-2xl font-bold text-slate-800 font-mono">{formatCurrency(comparing.parcelas[0].prestacao)}</div>
              <div className="text-xs text-slate-400 mt-1">
                {comparing.sistema === 'PRICE' ? 'parcela fixa' : `primeira parcela (última: ${formatCurrency(comparing.parcelas[comparing.parcelas.length - 1].prestacao)})`}
              </div>
              <div className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-slate-500">Total juros</span><span className="text-red-600 font-medium font-mono">{formatCurrency(comparing.totalJuros)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Total pago</span><span className="text-slate-700 font-medium font-mono">{formatCurrency(comparing.totalPago)}</span></div>
              </div>
            </div>
            <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
              <div className="text-xs font-medium text-emerald-600 mb-1">Economia com SAC</div>
              <div className="text-2xl font-bold text-emerald-700 font-mono">
                {formatCurrency(Math.abs(result.totalPago - comparing.totalPago))}
              </div>
              <div className="text-xs text-emerald-600 mt-1">em juros ao longo do contrato</div>
              {onApply && (
                <button type="button" onClick={() => onApply(result)}
                  className="mt-3 w-full px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700">
                  Aplicar ao Contrato
                </button>
              )}
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Composição das Parcelas ({result.sistema})</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="parcela" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$ ${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="Amortização" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Juros" stackId="a" fill="#f43f5e" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Parcelas table (first 12 + last) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">#</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Amortização</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Juros</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Prestação</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Saldo Devedor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.parcelas.slice(0, 12).map(p => (
                  <tr key={p.numero} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-sm text-slate-600">{p.numero}</td>
                    <td className="px-4 py-2.5 text-sm text-right font-mono text-slate-600">{formatCurrency(p.amortizacao)}</td>
                    <td className="px-4 py-2.5 text-sm text-right font-mono text-red-500">{formatCurrency(p.juros)}</td>
                    <td className="px-4 py-2.5 text-sm text-right font-mono font-medium text-slate-700">{formatCurrency(p.prestacao)}</td>
                    <td className="px-4 py-2.5 text-sm text-right font-mono text-slate-500">{formatCurrency(p.saldoDevedor)}</td>
                  </tr>
                ))}
                {result.parcelas.length > 12 && (
                  <>
                    <tr><td colSpan={5} className="px-4 py-2 text-center text-xs text-slate-400">... {result.parcelas.length - 13} parcelas ...</td></tr>
                    <tr className="hover:bg-slate-50">
                      {(() => { const p = result.parcelas[result.parcelas.length - 1]; return (<>
                        <td className="px-4 py-2.5 text-sm text-slate-600">{p.numero}</td>
                        <td className="px-4 py-2.5 text-sm text-right font-mono text-slate-600">{formatCurrency(p.amortizacao)}</td>
                        <td className="px-4 py-2.5 text-sm text-right font-mono text-red-500">{formatCurrency(p.juros)}</td>
                        <td className="px-4 py-2.5 text-sm text-right font-mono font-medium text-slate-700">{formatCurrency(p.prestacao)}</td>
                        <td className="px-4 py-2.5 text-sm text-right font-mono text-slate-500">{formatCurrency(p.saldoDevedor)}</td>
                      </>); })()}
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
