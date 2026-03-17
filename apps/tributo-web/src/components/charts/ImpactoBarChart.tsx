'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface ImpactoData {
  tributo: string;
  atual: number;
  novo: number;
}

export function ImpactoBarChart({ data }: { data: ImpactoData[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="tributo" tick={{ fontSize: 12, fill: '#64748b' }} />
        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          formatter={(value: number) => formatCurrency(value)}
          labelStyle={{ fontWeight: 600 }}
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="atual" name="Regime Atual" fill="#94a3b8" radius={[4, 4, 0, 0]} />
        <Bar dataKey="novo" name="Novo Regime" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
