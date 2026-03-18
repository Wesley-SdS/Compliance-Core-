'use client';

import { useState } from 'react';
import { AuditTimeline } from '@compliancecore/ui';
import { useLabTimeline } from '@/hooks/use-laboratorio';
import { useAppStore } from '@/lib/store';

const eventTypes = ['Todos', 'LAUDO_CREATED', 'LAUDO_UPDATED', 'LAUDO_AI_REVIEWED', 'LAUDO_LIBERADO', 'CALIBRACAO_REGISTRADA', 'EQUIPAMENTO_CREATED'];

export default function AtividadePage() {
  const labId = useAppStore((s) => s.laboratorioId) || 'default';
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState('Todos');
  const { data: timeline, isLoading } = useLabTimeline(labId, page);

  const filteredEvents = filterType === 'Todos'
    ? (timeline ?? [])
    : (timeline ?? []).filter((e) => e.type === filterType);

  const handleExportCSV = () => {
    const rows = filteredEvents.map((e) =>
      [e.timestamp, e.type, e.title, e.description, e.actor].join(','),
    );
    const csv = ['Data,Tipo,Titulo,Descricao,Ator', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-trail.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Audit Trail</h2>
          <p className="text-sm text-slate-500 mt-1">Historico completo de eventos do laboratorio</p>
        </div>
        <button
          type="button"
          onClick={handleExportCSV}
          className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {eventTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setFilterType(type)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterType === type
                ? 'bg-violet-500 text-white'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {type === 'Todos' ? 'Todos' : type.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-200" />
                <div className="flex-1 h-16 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <AuditTimeline
            events={filteredEvents.map((e) => ({
              ...e,
              timestamp: new Date(e.timestamp),
            }))}
          />
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1.5 text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          Anterior
        </button>
        <span className="text-sm text-slate-500">Pagina {page}</span>
        <button
          type="button"
          onClick={() => setPage((p) => p + 1)}
          disabled={(timeline ?? []).length < 50}
          className="px-3 py-1.5 text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          Proxima
        </button>
      </div>
    </div>
  );
}
