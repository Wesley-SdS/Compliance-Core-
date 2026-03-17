'use client';

import { useState } from 'react';
import { useLegislacao } from '@/hooks';
import { formatDate } from '@/lib/utils';

const impactoFilters = [
  { value: '', label: 'Todos' },
  { value: 'ALTO', label: 'Alto Impacto' },
  { value: 'MEDIO', label: 'Medio Impacto' },
  { value: 'BAIXO', label: 'Baixo Impacto' },
];

function ImpactoBadge({ impacto }: { impacto: string }) {
  const styles: Record<string, string> = {
    ALTO: 'bg-red-100 text-red-700',
    MEDIO: 'bg-amber-100 text-amber-700',
    BAIXO: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[impacto] ?? 'bg-slate-100 text-slate-700'}`}>
      {impacto}
    </span>
  );
}

export default function LegislacaoPage() {
  const [impactoFilter, setImpactoFilter] = useState('');
  const { data: items, isLoading } = useLegislacao({
    impacto: impactoFilter || undefined,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Legislacao Tributaria</h2>
        <p className="text-sm text-slate-500 mt-1">Acompanhe as mudancas legislativas e seus impactos</p>
      </div>

      <div className="flex gap-2">
        {impactoFilters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setImpactoFilter(f.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              impactoFilter === f.value
                ? 'bg-emerald-500 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-sm text-slate-500">Carregando...</div>
      ) : items && items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {item.novo && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">NOVO</span>
                    )}
                    <ImpactoBadge impacto={item.impacto} />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 mt-2">{item.titulo}</h3>
                  <p className="text-sm text-slate-600 mt-2">{item.resumo}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                    <span>{item.fonte}</span>
                    <span>{formatDate(item.data)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-sm text-slate-500">Nenhuma legislacao encontrada.</p>
        </div>
      )}
    </div>
  );
}
