'use client';

import { useState } from 'react';
import { useAlertas, useAcknowledgeAlert } from '@/hooks/use-alertas';
import { AlertBanner } from '@compliancecore/ui';
import { useToast } from '@/components/ui/use-toast';

const statusFilters = ['Todos', 'pendente', 'reconhecido'];
const typeFilters = ['Todos', 'DOC_EXPIRY', 'LICENSE_RENEWAL', 'EQUIPMENT_CALIBRATION', 'TRAINING_RENEWAL', 'POP_REVIEW'];

function AlertaSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div><div className="h-8 bg-gray-200 rounded w-32" /><div className="h-4 bg-gray-200 rounded w-48 mt-2" /></div>
      <div className="h-16 bg-red-100 rounded-lg" />
      <div className="grid grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}
      </div>
      <div className="h-64 bg-gray-200 rounded-xl" />
    </div>
  );
}

function SeverityDot({ severity }: { severity: string }) {
  const bg = severity === 'error' || severity === 'SENT' ? 'bg-red-500' : severity === 'warning' || severity === 'PENDING' ? 'bg-amber-500' : 'bg-blue-500';
  return <span className={`inline-block w-2 h-2 rounded-full ${bg} flex-shrink-0 mt-1.5`} />;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    pendente: 'bg-amber-100 text-amber-700',
    SENT: 'bg-red-100 text-red-700',
    ACKNOWLEDGED: 'bg-green-100 text-green-700',
    reconhecido: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}

export default function AlertasPage() {
  const { toast } = useToast();
  const { data: alertas = [], isLoading, isError, refetch } = useAlertas();
  const acknowledgeMutation = useAcknowledgeAlert();
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [typeFilter, setTypeFilter] = useState('Todos');

  if (isLoading) return <AlertaSkeleton />;

  // Map alerts to DueAlert shape for AlertBanner
  const urgentAlerts = alertas
    .filter((a: any) => (a.status === 'PENDING' || a.status === 'SENT') && (a.daysUntilDue ?? 999) <= 7)
    .map((a: any) => ({
      id: a.id,
      entityId: a.entityId || a.clinica || '',
      entityType: a.entityType || 'Clinica',
      alertType: a.alertType || a.tipo || 'DOC_EXPIRY',
      dueDate: a.dueDate ? new Date(a.dueDate) : new Date(),
      daysUntilDue: a.daysUntilDue ?? 0,
      status: a.status || 'PENDING',
      channels: a.channels || ['in_app'],
    }));

  const filtered = alertas.filter((a: any) => {
    if (statusFilter !== 'Todos' && a.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (typeFilter !== 'Todos' && a.alertType !== typeFilter && a.tipo !== typeFilter) return false;
    return true;
  });

  const criticalCount = alertas.filter((a: any) => a.status === 'SENT' || a.severity === 'error').length;
  const warningCount = alertas.filter((a: any) => a.status === 'PENDING' || a.severity === 'warning').length;
  const infoCount = alertas.filter((a: any) => a.status === 'ACKNOWLEDGED' || a.severity === 'info').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Alertas</h1>
        <p className="mt-1 text-sm text-gray-500">{alertas.length} alertas registrados</p>
      </div>

      {urgentAlerts.length > 0 && (
        <AlertBanner
          alerts={urgentAlerts}
          onAcknowledge={async (alertId) => {
            await acknowledgeMutation.mutateAsync(alertId);
            toast({ title: 'Alerta reconhecido' });
            refetch();
          }}
        />
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Erro ao carregar alertas. <button onClick={() => refetch()} className="underline font-medium">Tentar novamente</button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-center">
          <div className="text-2xl font-bold text-red-700">{criticalCount}</div>
          <div className="text-xs text-red-600 font-medium">Criticos</div>
        </div>
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
          <div className="text-2xl font-bold text-amber-700">{warningCount}</div>
          <div className="text-xs text-amber-600 font-medium">Avisos</div>
        </div>
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">{infoCount}</div>
          <div className="text-xs text-blue-600 font-medium">Informativos</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <div className="flex gap-2">
            {statusFilters.map((s) => (
              <button key={s} type="button" onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  s === statusFilter ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}>{s}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
          <div className="flex gap-2 flex-wrap">
            {typeFilters.map((t) => (
              <button key={t} type="button" onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  t === typeFilter ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}>{t === 'Todos' ? 'Todos' : t.replace(/_/g, ' ')}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">Todos os Alertas</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {filtered.length > 0 ? filtered.map((alerta: any) => (
            <div key={alerta.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
              <SeverityDot severity={alerta.status || alerta.severity} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-gray-900">{alerta.titulo || alerta.alertType?.replace(/_/g, ' ') || 'Alerta'}</p>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusBadge status={alerta.status} />
                    {(alerta.status === 'PENDING' || alerta.status === 'pendente') && (
                      <button type="button"
                        onClick={async () => {
                          await acknowledgeMutation.mutateAsync(alerta.id);
                          toast({ title: 'Alerta reconhecido' });
                          refetch();
                        }}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
                        Reconhecer
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{alerta.descricao || `Vence em ${alerta.daysUntilDue ?? '?'} dias`}</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-xs text-gray-400">{alerta.clinica || alerta.entityId}</span>
                  <span className="text-xs text-gray-400">{alerta.tipo || alerta.alertType}</span>
                </div>
              </div>
            </div>
          )) : (
            <div className="px-6 py-8 text-center"><p className="text-sm text-gray-500">Nenhum alerta encontrado.</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
