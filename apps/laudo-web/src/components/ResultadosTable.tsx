'use client';

import { useState, useCallback, useRef } from 'react';
import type { Resultado, FlagResultado } from '@/lib/types';

interface ResultadosTableProps {
  resultados: Resultado[];
  onChange: (resultados: Resultado[]) => void;
  onFieldEdit?: (analito: string, field: string, oldValue: string, newValue: string) => void;
  readOnly?: boolean;
}

function flagColor(flag: FlagResultado): string {
  switch (flag) {
    case 'critico': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'alto': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    case 'baixo': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    case 'normal': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    default: return 'bg-slate-100 text-slate-700';
  }
}

function flagLabel(flag: FlagResultado): string {
  switch (flag) {
    case 'critico': return 'CRITICO';
    case 'alto': return 'ALTO';
    case 'baixo': return 'BAIXO';
    case 'normal': return 'Normal';
    default: return '--';
  }
}

export function ResultadosTable({ resultados, onChange, onFieldEdit, readOnly = false }: ResultadosTableProps) {
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = useCallback(
    (index: number, field: keyof Resultado, value: string) => {
      const old = resultados[index][field] as string;
      const updated = resultados.map((r, i) =>
        i === index ? { ...r, [field]: value } : r,
      );
      onChange(updated);

      if (onFieldEdit && old !== value) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          onFieldEdit(resultados[index].analito, field, old, value);
        }, 1000);
      }
    },
    [resultados, onChange, onFieldEdit],
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <th className="text-left font-medium text-slate-500 uppercase tracking-wider px-4 py-2 text-xs">Analito</th>
            <th className="text-left font-medium text-slate-500 uppercase tracking-wider px-4 py-2 text-xs">Resultado</th>
            <th className="text-left font-medium text-slate-500 uppercase tracking-wider px-4 py-2 text-xs">Unidade</th>
            <th className="text-left font-medium text-slate-500 uppercase tracking-wider px-4 py-2 text-xs">Valor Ref.</th>
            <th className="text-left font-medium text-slate-500 uppercase tracking-wider px-4 py-2 text-xs">Flag</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
          {resultados.map((r, i) => (
            <tr
              key={r.analito}
              className={`transition-colors ${
                r.flag === 'critico'
                  ? 'bg-red-50/50 dark:bg-red-900/10'
                  : r.flag === 'alto' || r.flag === 'baixo'
                  ? 'bg-amber-50/50 dark:bg-amber-900/10'
                  : ''
              }`}
            >
              <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-200">{r.analito}</td>
              <td className="px-4 py-2.5">
                {readOnly ? (
                  <span className="text-slate-700 dark:text-slate-200">{r.resultado}</span>
                ) : (
                  <input
                    type="text"
                    value={r.resultado}
                    onChange={(e) => handleChange(i, 'resultado', e.target.value)}
                    className="w-24 px-2 py-1 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                )}
              </td>
              <td className="px-4 py-2.5 text-slate-500">{r.unidade}</td>
              <td className="px-4 py-2.5 text-slate-500 text-xs">{r.valorReferencia}</td>
              <td className="px-4 py-2.5">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${flagColor(r.flag)}`}>
                  {flagLabel(r.flag)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
