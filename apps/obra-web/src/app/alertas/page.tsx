'use client';

import { useState } from 'react';
import { useAlertas, useAcknowledgeAlert } from '@/hooks/use-alertas';
import { AlertBanner } from '@compliancecore/ui';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';

const STATUS_TABS = ['Todos', 'PENDING', 'SENT', 'ACKNOWLEDGED'] as const;
const TYPE_OPTIONS = [
  'Todos',
  'ALVARA_EXPIRY',
  'ART_EXPIRY',
  'LICENSE_RENEWAL',
  'NR_COMPLIANCE',
  'INSURANCE_EXPIRY',
  'TRAINING_RENEWAL',
] as const;

function severityColor(severity: string) {
  if (severity === 'error' || severity === 'critical') return 'bg-red-500';
  if (severity === 'warning') return 'bg-amber-500';
  return 'bg-blue-500';
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    SENT: 'bg-blue-100 text-blue-700',
    ACKNOWLEDGED: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}

function AlertasSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <Skeleton className="h-10 w-full max-w-md rounded-lg" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function AlertasPage() {
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [typeFilter, setTypeFilter] = useState<string>('Todos');

  const { data: alerts, isLoading, refetch } = useAlertas();
  const acknowledgeAlert = useAcknowledgeAlert();

  const filtered = (alerts ?? []).filter((a: any) => {
    if (statusFilter !== 'Todos' && a.status !== statusFilter) return false;
    if (typeFilter !== 'Todos' && a.type !== typeFilter) return false;
    return true;
  });

  const urgentAlerts = (alerts ?? []).filter(
    (a: any) => (a.severity === 'error' || a.severity === 'critical') && a.status === 'PENDING'
  );

  const criticalCount = (alerts ?? []).filter((a: any) => a.severity === 'error' || a.severity === 'critical').length;
  const warningCount = (alerts ?? []).filter((a: any) => a.severity === 'warning').length;
  const infoCount = (alerts ?? []).filter((a: any) => a.severity === 'info').length;

  async function handleAcknowledge(alertId: string) {
    try {
      await acknowledgeAlert.mutateAsync(alertId);
      toast({ title: 'Alerta reconhecido', description: 'O alerta foi marcado como reconhecido.' });
      refetch();
    } catch {
      toast({ title: 'Erro', description: 'Nao foi possivel reconhecer o alerta.', variant: 'destructive' });
    }
  }

  if (isLoading) return <AlertasSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Alertas</h2>
        <p className="text-sm text-slate-500 mt-1">Monitoramento de compliance e prazos</p>
      </div>

      {urgentAlerts.length > 0 && (
        <AlertBanner
          alerts={urgentAlerts as any}
        />
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-red-200 p-5">
          <div className="text-sm text-red-600 font-medium">Criticos</div>
          <div className="text-3xl font-bold text-red-700 mt-1">{criticalCount}</div>
          <div className="text-xs text-red-400 mt-1">requerem acao imediata</div>
        </div>
        <div className="bg-white rounded-xl border border-amber-200 p-5">
          <div className="text-sm text-amber-600 font-medium">Avisos</div>
          <div className="text-3xl font-bold text-amber-700 mt-1">{warningCount}</div>
          <div className="text-xs text-amber-400 mt-1">atencao necessaria</div>
        </div>
        <div className="bg-white rounded-xl border border-blue-200 p-5">
          <div className="text-sm text-blue-600 font-medium">Informativos</div>
          <div className="text-3xl font-bold text-blue-700 mt-1">{infoCount}</div>
          <div className="text-xs text-blue-400 mt-1">para conhecimento</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                statusFilter === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {TYPE_OPTIONS.map((type) => (
            <option key={type} value={type}>
              {type === 'Todos' ? 'Todos os tipos' : type.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((alert: any) => (
            <div
              key={alert.id}
              className="bg-white rounded-lg border border-slate-200 p-4 flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${severityColor(alert.severity)} mt-1.5 flex-shrink-0`} />
                <div>
                  <p className="text-sm font-medium text-slate-800">{alert.message}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-slate-400">{alert.type?.replace(/_/g, ' ')}</span>
                    {statusBadge(alert.status)}
                    {alert.dueDate && (
                      <span className="text-xs text-slate-400">Vence: {alert.dueDate}</span>
                    )}
                  </div>
                </div>
              </div>

              {alert.status !== 'ACKNOWLEDGED' && (
                <button
                  type="button"
                  onClick={() => handleAcknowledge(alert.id)}
                  disabled={acknowledgeAlert.isPending}
                  className="px-3 py-1.5 text-xs font-medium text-amber-600 border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors whitespace-nowrap disabled:opacity-50"
                >
                  Reconhecer
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-500">Nenhum alerta encontrado com os filtros selecionados.</p>
          </div>
        )}
      </div>
    </div>
  );
}
