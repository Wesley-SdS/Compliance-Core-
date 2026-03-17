'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  useObras,
  useObraScore,
  useObraScoreHistory,
  useObraTimeline,
} from '@/hooks/use-obras';
import { useAlertas, useAcknowledgeAlert } from '@/hooks/use-alertas';
import { toast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ScoreGauge,
  AlertBanner,
  AuditTimeline,
  ComplianceBadge,
} from '@compliancecore/ui';
import type {
  ComplianceLevel,
  ScoreTrend,
  DueAlert,
  TimelineEvent,
} from '@compliancecore/shared';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-16 bg-slate-200 rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}

export default function DashboardPage() {
  const { data: obras, isLoading: obrasLoading } = useObras();
  const { data: alertas, isLoading: alertasLoading } = useAlertas();
  const acknowledgeAlert = useAcknowledgeAlert();

  // Use the first obra's ID for the dashboard-level score and history,
  // falling back to 'global' for a global score endpoint
  const primaryObraId = useMemo(
    () => (Array.isArray(obras) && obras.length > 0 ? obras[0].id : 'global'),
    [obras],
  );

  const { data: scoreData } = useObraScore(primaryObraId);
  const { data: historyData } = useObraScoreHistory(primaryObraId, 6);
  const { data: timelineEvents } = useObraTimeline(primaryObraId);

  const isLoading = obrasLoading || alertasLoading;

  // Derive urgent alerts: due in 7 days or less
  const urgentAlerts: DueAlert[] = useMemo(() => {
    if (!Array.isArray(alertas)) return [];
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return alertas.filter((alert: DueAlert) => {
      if (!alert.dueDate) return false;
      const due = new Date(alert.dueDate);
      return due <= sevenDaysFromNow;
    });
  }, [alertas]);

  // Derive KPI values from real data
  const obrasList = useMemo(
    () => (Array.isArray(obras) ? obras : []),
    [obras],
  );

  const obrasAtivas = useMemo(
    () => obrasList.filter((o: any) => o.status === 'ativa' || o.progresso < 100).length,
    [obrasList],
  );

  const alertasPendentes = useMemo(
    () =>
      Array.isArray(alertas)
        ? alertas.filter((a: any) => a.status !== 'acknowledged').length
        : 0,
    [alertas],
  );

  const documentosVencendo = useMemo(
    () =>
      Array.isArray(alertas)
        ? alertas.filter(
            (a: any) =>
              a.type === 'document_expiring' || a.type === 'documento_vencendo',
          ).length
        : 0,
    [alertas],
  );

  // Score history chart data
  const chartData = useMemo(() => {
    if (!historyData?.scores || !Array.isArray(historyData.scores)) return [];
    return historyData.scores.map((entry: any) => ({
      month: entry.month ?? entry.label ?? entry.date,
      score: entry.score ?? entry.value,
    }));
  }, [historyData]);

  // Timeline events
  const timeline: TimelineEvent[] = useMemo(
    () => (Array.isArray(timelineEvents) ? timelineEvents : []),
    [timelineEvents],
  );

  const handleAcknowledge = (alertId: string) => {
    acknowledgeAlert.mutate(alertId, {
      onSuccess: () => {
        toast({ title: 'Alerta reconhecido', description: 'O alerta foi marcado como visto.' });
      },
      onError: () => {
        toast({
          title: 'Erro',
          description: 'Nao foi possivel reconhecer o alerta.',
          variant: 'destructive',
        });
      },
    });
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Urgent Alerts Banner */}
      {urgentAlerts.length > 0 && (
        <AlertBanner alerts={urgentAlerts} onAcknowledge={handleAcknowledge} />
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Score Medio */}
        <div className="rounded-xl bg-white border border-slate-200 p-6 flex items-center justify-center">
          <ScoreGauge
            score={scoreData?.overall ?? 0}
            level={(scoreData?.level ?? 'CRITICO') as ComplianceLevel}
            showLabel
            trend={scoreData?.trend as ScoreTrend | undefined}
          />
        </div>

        {/* Obras Ativas */}
        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="text-sm text-slate-500 font-medium">Obras Ativas</div>
          <div className="text-3xl font-bold text-slate-800 mt-2">{obrasAtivas}</div>
          <div className="text-xs text-slate-400 mt-1">em andamento</div>
        </div>

        {/* Alertas Pendentes */}
        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="text-sm text-slate-500 font-medium">Alertas Pendentes</div>
          <div className="text-3xl font-bold text-amber-600 mt-2">{alertasPendentes}</div>
          <div className="text-xs text-slate-400 mt-1">requerem atencao</div>
        </div>

        {/* Documentos Vencendo */}
        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="text-sm text-slate-500 font-medium">Documentos Vencendo</div>
          <div className="text-3xl font-bold text-slate-800 mt-2">{documentosVencendo}</div>
          <div className="text-xs text-slate-400 mt-1">aguardando envio</div>
        </div>
      </div>

      {/* Chart + Timeline Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score History Chart */}
        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">
            Historico de Score (6 meses)
          </h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  stroke="#94a3b8"
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  stroke="#94a3b8"
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '13px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="url(#scoreGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-500">Nenhum dado de historico disponivel.</p>
          )}
        </div>

        {/* Audit Timeline */}
        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">
            Atividade Recente
          </h2>
          {timeline.length > 0 ? (
            <AuditTimeline events={timeline} maxItems={10} />
          ) : (
            <p className="text-sm text-slate-500">Nenhuma atividade recente.</p>
          )}
        </div>
      </div>

      {/* Obras em Andamento */}
      <div className="rounded-xl bg-white border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-800">
            Obras em Andamento
          </h2>
          <Link
            href="/obras"
            className="text-sm text-amber-600 hover:text-amber-700 font-medium"
          >
            Ver todas
          </Link>
        </div>
        {obrasList.length > 0 ? (
          <div className="space-y-4">
            {obrasList.map((obra: any) => (
              <Link key={obra.id} href={`/obras/${obra.id}`} className="block">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-800">
                      {obra.nome}
                    </div>
                    <div className="text-xs text-slate-500">
                      Etapa: {obra.etapa}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ComplianceBadge
                      status={obra.complianceStatus ?? obra.badgeStatus ?? 'pending'}
                      size="sm"
                    />
                    <div className="text-sm font-semibold text-slate-700">
                      Score {obra.score}
                    </div>
                  </div>
                </div>
                <div className="mt-2 w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all"
                    style={{ width: `${obra.progresso}%` }}
                  />
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {obra.progresso}% concluido
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Nenhuma obra cadastrada.</p>
        )}
      </div>
    </div>
  );
}
