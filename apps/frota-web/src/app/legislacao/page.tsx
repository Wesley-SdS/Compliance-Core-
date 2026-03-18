'use client';

import { Scale, ExternalLink, Sparkles } from 'lucide-react';
import { useLegislacao } from '@/hooks/use-frota';

function ImpactoBadge({ impacto }: { impacto: 'ALTO' | 'MEDIO' | 'BAIXO' }) {
  const styles: Record<string, string> = {
    ALTO: 'bg-red-100 text-red-700',
    MEDIO: 'bg-amber-100 text-amber-700',
    BAIXO: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[impacto]}`}>
      {impacto}
    </span>
  );
}

export default function LegislacaoPage() {
  const { data: legislacao, isLoading } = useLegislacao();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-48" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl bg-slate-200 h-40" />
        ))}
      </div>
    );
  }

  const lista = legislacao ?? [];
  const altoImpacto = lista.filter((l) => l.impacto === 'ALTO');
  const medioImpacto = lista.filter((l) => l.impacto === 'MEDIO');
  const baixoImpacto = lista.filter((l) => l.impacto === 'BAIXO');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <Scale className="w-5 h-5 text-sky-500" />
          Legislacao e Normas
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Acompanhe as atualizacoes regulatorias que impactam sua frota
        </p>
      </div>

      {/* Impact Analysis */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-center">
          <div className="text-2xl font-bold text-red-700">{altoImpacto.length}</div>
          <div className="text-xs text-red-600 font-medium">Alto Impacto</div>
        </div>
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
          <div className="text-2xl font-bold text-amber-700">{medioImpacto.length}</div>
          <div className="text-xs text-amber-600 font-medium">Medio Impacto</div>
        </div>
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{baixoImpacto.length}</div>
          <div className="text-xs text-green-600 font-medium">Baixo Impacto</div>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {lista.length > 0 ? (
          lista.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-slate-800">{item.titulo}</h3>
                    {item.novo && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700">
                        <Sparkles className="w-3 h-3" />
                        Novo
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                    <span className="flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      {item.fonte}
                    </span>
                    <span>{new Date(item.data).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.resumo}</p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <ImpactoBadge impacto={item.impacto} />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
            Nenhuma atualizacao legislativa encontrada.
          </div>
        )}
      </div>
    </div>
  );
}
