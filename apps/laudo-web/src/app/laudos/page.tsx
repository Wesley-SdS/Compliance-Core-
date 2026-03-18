'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ComplianceBadge } from '@compliancecore/ui';
import { useLaudos } from '@/hooks/use-laudos';
import type { StatusLaudo } from '@/lib/types';

const statusFilters = ['Todos', 'RASCUNHO', 'EM_REVISAO', 'REVISADO', 'LIBERADO'] as const;
const statusLabels: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  EM_REVISAO: 'Em Revisao',
  REVISADO: 'Revisado',
  LIBERADO: 'Liberado',
};
const statusBadgeMap: Record<string, 'PARCIAL' | 'NAO_CONFORME' | 'CONFORME' | 'NAO_APLICAVEL'> = {
  RASCUNHO: 'NAO_APLICAVEL',
  EM_REVISAO: 'PARCIAL',
  REVISADO: 'PARCIAL',
  LIBERADO: 'CONFORME',
};

function StatusBadgeLocal({ status }: { status: string }) {
  const styles: Record<string, string> = {
    RASCUNHO: 'bg-slate-100 text-slate-700',
    EM_REVISAO: 'bg-amber-100 text-amber-700',
    REVISADO: 'bg-blue-100 text-blue-700',
    LIBERADO: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {statusLabels[status] ?? status}
    </span>
  );
}

export default function LaudosPage() {
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [search, setSearch] = useState('');
  const [tipoExame, setTipoExame] = useState('');

  const { data, isLoading } = useLaudos({
    status: statusFilter,
    search: search || undefined,
    tipoExame: tipoExame || undefined,
  });

  const laudos = data?.data ?? [];
  const counts = {
    total: data?.total ?? laudos.length,
    rascunho: laudos.filter((l) => l.status === 'RASCUNHO').length,
    emRevisao: laudos.filter((l) => l.status === 'EM_REVISAO').length,
    revisado: laudos.filter((l) => l.status === 'REVISADO').length,
    liberado: laudos.filter((l) => l.status === 'LIBERADO').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Laudos</h2>
          <p className="text-sm text-slate-500 mt-1">{counts.total} laudos registrados</p>
        </div>
        <Link
          href="/laudos/novo"
          className="px-4 py-2 bg-violet-500 text-white text-sm font-medium rounded-lg hover:bg-violet-600 transition-colors"
        >
          + Novo Laudo
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 text-center">
          <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">{counts.rascunho}</div>
          <div className="text-xs text-slate-500 font-medium">Rascunho</div>
        </div>
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 text-center">
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{counts.emRevisao}</div>
          <div className="text-xs text-amber-600 dark:text-amber-500 font-medium">Em Revisao</div>
        </div>
        <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 text-center">
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{counts.revisado}</div>
          <div className="text-xs text-blue-600 dark:text-blue-500 font-medium">Revisados</div>
        </div>
        <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 text-center">
          <div className="text-2xl font-bold text-green-700 dark:text-green-400">{counts.liberado}</div>
          <div className="text-xs text-green-600 dark:text-green-500 font-medium">Liberados</div>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Buscar por paciente ou CPF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <div className="flex gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === filter
                  ? 'bg-violet-500 text-white'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {filter === 'Todos' ? 'Todos' : statusLabels[filter]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="animate-pulse p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-200 dark:bg-slate-700 rounded" />
            ))}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Paciente</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Tipo de Exame</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Data Coleta</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Bioquimico</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {laudos.length > 0 ? (
                laudos.map((laudo) => (
                  <tr key={laudo.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/laudos/${laudo.id}`} className="text-sm font-medium text-violet-600 hover:text-violet-700">
                        {laudo.paciente?.nome ?? laudo.paciente_id ?? 'Sem paciente'}
                      </Link>
                      {laudo.paciente?.cpf && (
                        <div className="text-xs text-slate-400">{laudo.paciente.cpf}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{laudo.tipo_exame}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{laudo.data_coleta ? new Date(laudo.data_coleta).toLocaleDateString('pt-BR') : '--'}</td>
                    <td className="px-6 py-4"><StatusBadgeLocal status={laudo.status} /></td>
                    <td className="px-6 py-4 text-sm text-slate-500">{laudo.bioquimico_responsavel ?? '--'}</td>
                    <td className="px-6 py-4">
                      <ComplianceBadge status={statusBadgeMap[laudo.status] ?? 'NAO_APLICAVEL'} size="sm" />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                    Nenhum laudo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
