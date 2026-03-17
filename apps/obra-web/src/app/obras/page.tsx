'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useObras } from '@/hooks/use-obras';
import { ComplianceBadge } from '@compliancecore/ui';
import { Skeleton } from '@/components/ui/skeleton';

type BadgeStatus = 'CONFORME' | 'PARCIAL' | 'NAO_CONFORME';

function levelToBadgeStatus(level: string): BadgeStatus {
  if (level === 'EXCELENTE' || level === 'BOM') return 'CONFORME';
  if (level === 'ATENCAO') return 'PARCIAL';
  return 'NAO_CONFORME';
}

function ObrasTableSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-2 w-24 rounded-full" />
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-5 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ObrasPage() {
  const [search, setSearch] = useState('');
  const { data: obras, isLoading } = useObras();

  const filtered = (obras ?? []).filter(
    (o: any) =>
      o.nome?.toLowerCase().includes(search.toLowerCase()) ||
      o.endereco?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Obras</h2>
          <p className="text-sm text-slate-500 mt-1">
            {isLoading ? '...' : `${filtered.length} obras cadastradas`}
          </p>
        </div>
        <Link
          href="/obras/nova"
          className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
        >
          Nova Obra
        </Link>
      </div>

      {!isLoading && (
        <input
          type="text"
          placeholder="Buscar obra por nome ou endereco..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
      )}

      {isLoading ? (
        <ObrasTableSkeleton />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Obra</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Etapa</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Progresso</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Score</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Responsavel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map((obra: any) => (
                  <tr key={obra.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/obras/${obra.id}`} className="text-sm font-medium text-slate-800 hover:text-amber-600">
                        {obra.nome}
                      </Link>
                      <div className="text-xs text-slate-400 mt-0.5">{obra.endereco}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{obra.etapa}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-slate-100 rounded-full h-2">
                          <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${obra.progresso}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{obra.progresso}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-700">{obra.score}</span>
                    </td>
                    <td className="px-6 py-4">
                      <ComplianceBadge status={levelToBadgeStatus(obra.level)} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{obra.responsavel}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                    Nenhuma obra encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
