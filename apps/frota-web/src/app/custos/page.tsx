'use client';

import { DollarSign, TrendingUp, Fuel, Wrench, CreditCard, Shield } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useCustos } from '@/hooks/use-custos';
import { useFrotaScore } from '@/hooks/use-frota';
import { useFrotaStore } from '@/lib/store';
import type { ComplianceLevel } from '@/lib/types';

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function ComplianceBadge({ level }: { level: ComplianceLevel }) {
  const styles: Record<ComplianceLevel, string> = {
    EXCELENTE: 'bg-green-100 text-green-700',
    BOM: 'bg-blue-100 text-blue-700',
    ATENCAO: 'bg-amber-100 text-amber-700',
    CRITICO: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[level] ?? 'bg-slate-100 text-slate-700'}`}>
      {level}
    </span>
  );
}

export default function CustosPage() {
  const { periodoSelecionado, setPeriodoSelecionado } = useFrotaStore();
  const { data: custos, isLoading } = useCustos({ periodo: periodoSelecionado });
  const { data: score } = useFrotaScore();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-48" />
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="rounded-xl bg-slate-200 h-28" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl bg-slate-200 h-80" />
          <div className="rounded-xl bg-slate-200 h-80" />
        </div>
      </div>
    );
  }

  const periodos = [
    { value: 'semana' as const, label: 'Semana' },
    { value: 'mes' as const, label: 'Mes' },
    { value: 'trimestre' as const, label: 'Trimestre' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-sky-500" />
            Custos
          </h2>
          <p className="text-sm text-slate-500 mt-1">Analise de custos da frota</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          {periodos.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriodoSelecionado(p.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                periodoSelecionado === p.value
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500 font-medium">Total</span>
          </div>
          <div className="text-2xl font-bold text-slate-800">
            {custos ? formatCurrency(custos.custoTotal) : '-'}
          </div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Fuel className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-slate-500 font-medium">Combustivel</span>
          </div>
          <div className="text-2xl font-bold text-amber-600">
            {custos ? formatCurrency(custos.custoCombustivel) : '-'}
          </div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Wrench className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-slate-500 font-medium">Manutencao</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {custos ? formatCurrency(custos.custoManutencao) : '-'}
          </div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-4 h-4 text-green-500" />
            <span className="text-sm text-slate-500 font-medium">Pedagio</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {custos ? formatCurrency(custos.custoPedagio) : '-'}
          </div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-slate-500 font-medium">Seguro</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {custos ? formatCurrency(custos.custoSeguro) : '-'}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Custo por Veiculo */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Custo por Veiculo</h3>
          {custos && custos.custoPorVeiculo.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={custos.custoPorVeiculo}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="placa" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Custo']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="custo" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-sm text-slate-500">
              Sem dados para o periodo selecionado.
            </div>
          )}
        </div>

        {/* Custo por KM */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            Custo por KM (Tendencia)
          </h3>
          {custos && custos.custoPorKm.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={custos.custoPorKm}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="data" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `R$${v.toFixed(2)}`} />
                <Tooltip
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}/km`, 'Custo/KM']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Line type="monotone" dataKey="valor" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-sm text-slate-500">
              Sem dados para o periodo selecionado.
            </div>
          )}
        </div>
      </div>

      {/* Score de Compliance */}
      {score && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Score de Compliance da Frota</h3>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className={`text-5xl font-bold ${
                score.level === 'EXCELENTE' ? 'text-green-600' :
                score.level === 'BOM' ? 'text-blue-600' :
                score.level === 'ATENCAO' ? 'text-amber-600' : 'text-red-600'
              }`}>
                {score.value}
              </div>
              <ComplianceBadge level={score.level} />
              <div className="text-xs text-slate-400 mt-1">
                {score.trend === 'MELHORANDO' ? 'Melhorando' : score.trend === 'PIORANDO' ? 'Piorando' : 'Estavel'}
              </div>
            </div>
            {score.criteria && score.criteria.length > 0 && (
              <div className="flex-1 space-y-3">
                {score.criteria.map((c) => (
                  <div key={c.criterionId}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{c.name}</span>
                      <span className="font-medium">{c.score}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          c.score >= 80 ? 'bg-green-500' : c.score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${c.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
