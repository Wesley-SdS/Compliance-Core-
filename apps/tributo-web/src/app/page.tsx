'use client';

import Link from 'next/link';
import { useGlobalScore, useEmpresas, useObrigacoes } from '@/hooks';
import { scoreLevelColor, formatDate } from '@/lib/utils';
import { ScoreGauge } from '@compliancecore/ui';
import type { ComplianceLevel, ScoreTrend } from '@compliancecore/shared';

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    entregue: 'bg-green-100 text-green-700',
    pendente: 'bg-amber-100 text-amber-700',
    atrasado: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}

export default function DashboardPage() {
  const { data: score } = useGlobalScore();
  const { data: empresas } = useEmpresas();
  const { data: obrigacoes } = useObrigacoes();

  const trendArrow = score?.trend === 'MELHORANDO' ? '\u2191' : score?.trend === 'PIORANDO' ? '\u2193' : '\u2192';
  const trendColor = score?.trend === 'MELHORANDO' ? 'text-green-600' : score?.trend === 'PIORANDO' ? 'text-red-600' : 'text-slate-500';
  const pendentes = obrigacoes?.filter((o) => o.status === 'pendente') ?? [];
  const atrasadas = obrigacoes?.filter((o) => o.status === 'atrasado') ?? [];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-white border border-slate-200 p-6 flex items-center justify-center">
          <ScoreGauge
            score={score?.value ?? 0}
            level={(score?.level as ComplianceLevel) ?? 'CRITICO'}
            trend={(score?.trend as ScoreTrend) ?? 'ESTAVEL'}
            showLabel
            size={120}
          />
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="text-sm text-slate-500 font-medium">Empresas</div>
          <div className="text-3xl font-bold text-slate-800 mt-2">{empresas?.length ?? '--'}</div>
          <div className="text-xs text-slate-400 mt-1">clientes ativos</div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="text-sm text-slate-500 font-medium">Obrigacoes Pendentes</div>
          <div className="text-3xl font-bold text-amber-600 mt-2">{pendentes.length}</div>
          <div className="text-xs text-slate-400 mt-1">este mes</div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="text-sm text-slate-500 font-medium">Atrasadas</div>
          <div className="text-3xl font-bold text-red-600 mt-2">{atrasadas.length}</div>
          <div className="text-xs text-slate-400 mt-1">requerem atencao</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Proximas Obrigacoes */}
        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Proximas Obrigacoes</h2>
          {obrigacoes && obrigacoes.length > 0 ? (
            <div className="space-y-3">
              {obrigacoes.slice(0, 8).map((obr) => (
                <div key={obr.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
                  <div>
                    <div className="text-sm font-medium text-slate-700">{obr.nome}</div>
                    <div className="text-xs text-slate-500">{obr.empresa ?? obr.competencia}</div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className="text-xs text-slate-500">{formatDate(obr.vencimento)}</span>
                    <StatusBadge status={obr.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Nenhuma obrigacao encontrada.</p>
          )}
        </div>

        {/* Empresas Recentes */}
        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-800">Empresas</h2>
            <Link href="/empresas" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
              Ver todas
            </Link>
          </div>
          {empresas && empresas.length > 0 ? (
            <div className="space-y-3">
              {empresas.slice(0, 6).map((empresa) => (
                <Link
                  key={empresa.id}
                  href={`/empresas/${empresa.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-800">{empresa.razaoSocial}</div>
                    <div className="text-xs text-slate-500">{empresa.regimeTributario.replace(/_/g, ' ')}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${empresa.score != null ? scoreLevelColor(empresa.level ?? 'BOM') : 'text-slate-400'}`}>
                      {empresa.score ?? '--'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Nenhuma empresa cadastrada.</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/simulador" className="rounded-xl bg-emerald-50 border border-emerald-200 p-6 hover:bg-emerald-100 transition-colors group">
          <div className="text-sm font-semibold text-emerald-800 group-hover:text-emerald-900">Simulador de Reforma</div>
          <p className="text-xs text-emerald-600 mt-1">Compare CBS/IBS/IS com o regime atual</p>
        </Link>
        <Link href="/legislacao" className="rounded-xl bg-blue-50 border border-blue-200 p-6 hover:bg-blue-100 transition-colors group">
          <div className="text-sm font-semibold text-blue-800 group-hover:text-blue-900">Legislacao</div>
          <p className="text-xs text-blue-600 mt-1">Acompanhe as mudancas tributarias</p>
        </Link>
        <Link href="/sped" className="rounded-xl bg-violet-50 border border-violet-200 p-6 hover:bg-violet-100 transition-colors group">
          <div className="text-sm font-semibold text-violet-800 group-hover:text-violet-900">SPED Import</div>
          <p className="text-xs text-violet-600 mt-1">Importe e valide arquivos SPED</p>
        </Link>
      </div>
    </div>
  );
}
