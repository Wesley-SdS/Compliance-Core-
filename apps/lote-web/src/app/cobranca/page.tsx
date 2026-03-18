'use client';

import { useCobrancaRegua, useCobrancaDashboard, useUpdateCobrancaRegua } from '@/hooks/use-api';
import { ReguaCobranca } from '@/components/ReguaCobranca';
import { formatCurrency, formatPercent } from '@/lib/format';

export default function CobrancaPage() {
  const { data: regua, isLoading: reguaLoading } = useCobrancaRegua();
  const { data: dashboard, isLoading: dashLoading } = useCobrancaDashboard();
  const updateRegua = useUpdateCobrancaRegua();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Régua de Cobrança</h2>
        <p className="text-sm text-slate-500 mt-1">Gerencie a estratégia de cobrança conforme CDC</p>
      </div>

      {/* Dashboard KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="text-sm text-slate-500 font-medium">Boletos Vencidos</div>
          <div className="text-3xl font-bold text-red-600 mt-2">
            {dashLoading ? '—' : dashboard?.vencidos_total ?? 0}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="text-sm text-slate-500 font-medium">Inadimplência</div>
          <div className="text-3xl font-bold text-amber-600 mt-2">
            {dashLoading ? '—' : formatPercent(dashboard?.inadimplencia_pct ?? 0)}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="text-sm text-slate-500 font-medium">Ações Pendentes</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">
            {dashLoading ? '—' : dashboard?.acoes_pendentes ?? 0}
          </div>
        </div>
      </div>

      {/* Vencidos por período */}
      {dashboard?.por_periodo && dashboard.por_periodo.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-800">Vencidos por Período</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Período</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Quantidade</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dashboard.por_periodo.map((p: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-700">{p.periodo}</td>
                  <td className="px-4 py-3 text-sm text-right text-slate-600">{p.quantidade}</td>
                  <td className="px-4 py-3 text-sm text-right font-mono text-red-600">{formatCurrency(p.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Régua configuração */}
      {reguaLoading ? (
        <div className="h-40 bg-slate-100 animate-pulse rounded-xl" />
      ) : (
        <ReguaCobranca
          etapas={regua?.etapas ?? []}
          onSave={(etapas) => updateRegua.mutate({ etapas })}
        />
      )}
    </div>
  );
}
