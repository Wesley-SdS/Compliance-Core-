'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface ProjecaoData {
  competencia: string;
  cargaAtual: number;
  cargaNova: number;
}

export function ProjecaoLineChart({ data }: { data: ProjecaoData[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="competencia" tick={{ fontSize: 12, fill: '#64748b' }} />
        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          formatter={(value: number) => formatCurrency(value)}
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="cargaAtual" name="Carga Atual" stroke="#94a3b8" strokeWidth={2} dot={{ r: 4 }} />
        <Line type="monotone" dataKey="cargaNova" name="Novo Regime" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
