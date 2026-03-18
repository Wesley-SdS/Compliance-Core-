'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertBanner, ComplianceBadge } from '@compliancecore/ui';
import { useEquipamentos, useEquipamentosVencidos } from '@/hooks/use-equipamentos';
import { useAppStore } from '@/lib/store';
import type { DueAlert } from '@compliancecore/shared';

function CalibracaoBadge({ valida, proximaCalibracao }: { valida?: boolean; proximaCalibracao: string }) {
  const dias = Math.ceil((new Date(proximaCalibracao).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (dias < 0) return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">Vencida</span>;
  if (dias <= 30) return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Vence em {dias}d</span>;
  return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">Vigente</span>;
}

export default function EquipamentosPage() {
  const labId = useAppStore((s) => s.laboratorioId) || 'default';
  const { data: equipamentos, isLoading } = useEquipamentos(labId);
  const { data: vencidos } = useEquipamentosVencidos(labId);

  const alerts: DueAlert[] = (vencidos ?? []).map((eq) => ({
    id: eq.id,
    entityId: eq.id,
    entityType: 'equipamento',
    alertType: 'Calibracao vencida',
    dueDate: new Date(eq.proxima_calibracao),
    daysUntilDue: Math.ceil((new Date(eq.proxima_calibracao).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    status: 'PENDING' as const,
    channels: ['in_app' as const],
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Equipamentos</h2>
          <p className="text-sm text-slate-500 mt-1">{equipamentos?.length ?? 0} equipamentos cadastrados</p>
        </div>
        <button
          type="button"
          className="px-4 py-2 bg-violet-500 text-white text-sm font-medium rounded-lg hover:bg-violet-600 transition-colors"
        >
          + Novo Equipamento
        </button>
      </div>

      {alerts.length > 0 && (
        <AlertBanner alerts={alerts} onDismiss={() => {}} />
      )}

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-200 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(equipamentos ?? []).map((eq) => (
            <Link
              key={eq.id}
              href={`/equipamentos/${eq.id}`}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{eq.nome}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{eq.fabricante} {eq.modelo}</p>
                </div>
                <CalibracaoBadge valida={eq.calibracao_valida} proximaCalibracao={eq.proxima_calibracao} />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-400">S/N: {eq.numero_serie}</span>
                <ComplianceBadge
                  status={eq.calibracao_valida ? 'CONFORME' : 'NAO_CONFORME'}
                  size="sm"
                />
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Proxima calibracao: {new Date(eq.proxima_calibracao).toLocaleDateString('pt-BR')}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
