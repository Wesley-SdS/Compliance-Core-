'use client';

import { useLegislacao } from '@/hooks/use-api';
import { formatDate } from '@/lib/format';

const IMPACTO_STYLES: Record<string, string> = {
  alto: 'bg-red-100 text-red-700',
  medio: 'bg-amber-100 text-amber-700',
  baixo: 'bg-green-100 text-green-700',
};

export default function LegislacaoPage() {
  const { data: legislacao, isLoading } = useLegislacao();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Legislação</h2>
        <p className="text-sm text-slate-500 mt-1">
          Acompanhe mudanças na Lei 6.766/79, Lei 13.786/2018, CDC e normas estaduais
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (legislacao ?? []).length > 0 ? (
        <div className="space-y-4">
          {(legislacao ?? []).map((item: any) => (
            <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{item.lei}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${IMPACTO_STYLES[item.impacto] ?? 'bg-slate-100 text-slate-700'}`}>
                      Impacto {item.impacto}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800">{item.titulo}</h3>
                  <p className="text-sm text-slate-600 mt-2">{item.resumo}</p>
                </div>
                <div className="text-xs text-slate-400 ml-4 whitespace-nowrap">{formatDate(item.data)}</div>
              </div>
              {item.url && (
                <a href={item.url} target="_blank" rel="noopener noreferrer"
                  className="inline-block mt-3 text-xs text-rose-600 hover:text-rose-700 font-medium">
                  Ver na íntegra →
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-sm text-slate-500">Nenhuma atualização legislativa disponível.</p>
        </div>
      )}
    </div>
  );
}
