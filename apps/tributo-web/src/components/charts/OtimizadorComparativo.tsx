'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import type { OtimizacaoResult } from '@/lib/types';

export function OtimizadorComparativo({ result }: { result: OtimizacaoResult }) {
  const data = [
    {
      label: 'Carga Tributaria',
      atual: result.cenarioAtual.cargaTotal,
      otimizado: result.cenarioOtimizado.cargaTotal,
    },
    {
      label: 'Creditos',
      atual: result.cenarioAtual.totalCreditos,
      otimizado: result.cenarioOtimizado.totalCreditos,
    },
  ];

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="atual" name="Cenario Atual" fill="#94a3b8" radius={[4, 4, 0, 0]} />
          <Bar dataKey="otimizado" name="Otimizado" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="text-center p-4 rounded-lg bg-emerald-50 border border-emerald-200">
        <div className="text-sm text-emerald-700 font-medium">Economia Estimada</div>
        <div className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(result.economia)}</div>
      </div>
    </div>
  );
}
