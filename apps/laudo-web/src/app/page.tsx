'use client';

import Link from 'next/link';
import { ScoreGauge } from '@compliancecore/ui';
import { AlertBanner } from '@compliancecore/ui';
import { AuditTimeline } from '@compliancecore/ui';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useLabStats, useLabScore, useLabAlerts, useLabTimeline, useAcknowledgeAlert } from '@/hooks/use-laboratorio';
import { useAppStore } from '@/lib/store';
import type { ComplianceLevel, ScoreTrend } from '@compliancecore/shared';

const CHART_COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16'];

function KpiCard({ label, value, sub, color = 'text-slate-800' }: { label: string; value: string | number; sub: string; color?: string }) {
  return (
    <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6">
      <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</div>
      <div className={`text-3xl font-bold mt-2 ${color}`}>{value}</div>
      <div className="text-xs text-slate-400 mt-1">{sub}</div>
    </div>
  );
}

export default function DashboardPage() {
  const labId = useAppStore((s) => s.laboratorioId) || 'default';
  const { data: stats } = useLabStats(labId);
  const { data: score } = useLabScore(labId);
  const { data: alerts } = useLabAlerts(labId);
  const { data: timeline } = useLabTimeline(labId);
  const ackMutation = useAcknowledgeAlert();

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {alerts && alerts.length > 0 && (
        <AlertBanner
          alerts={alerts}
          onAcknowledge={(id) => ackMutation.mutate(id)}
          onDismiss={() => {}}
        />
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 flex items-center justify-center">
          <ScoreGauge
            score={score?.value ?? 0}
            level={(score?.level ?? 'CRITICO') as ComplianceLevel}
            trend={(score?.trend ?? 'ESTAVEL') as ScoreTrend}
            size={120}
          />
        </div>

        <KpiCard
          label="Laudos Hoje"
          value={`${stats?.laudosPendentes ?? 0}/${stats?.laudosRevisados ?? 0}/${stats?.laudosLiberados ?? 0}`}
          sub="pendentes / revisados / liberados"
          color="text-violet-600"
        />
        <KpiCard
          label="Tempo Medio Liberacao"
          value={stats?.tempoMedioLiberacao ? `${stats.tempoMedioLiberacao}h` : '--'}
          sub="horas"
          color="text-blue-600"
        />
        <KpiCard
          label="Valores Criticos"
          value={stats?.valoresCriticosHoje ?? 0}
          sub="detectados hoje"
          color="text-red-600"
        />
        <KpiCard
          label="Calibracoes Vencidas"
          value={stats?.equipamentosVencidos ?? 0}
          sub="equipamentos"
          color="text-amber-600"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">Volume de Laudos (30 dias)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats?.volumePorDia ?? []}>
              <XAxis dataKey="data" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
                labelFormatter={(v) => `Data: ${v}`}
              />
              <Bar dataKey="quantidade" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">Distribuicao por Exame</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={stats?.distribuicaoPorExame ?? []}
                dataKey="quantidade"
                nameKey="tipo"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                label={({ tipo, percent }) => `${tipo} ${(percent * 100).toFixed(0)}%`}
              >
                {(stats?.distribuicaoPorExame ?? []).map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Ultimos Eventos</h2>
          <Link href="/atividade" className="text-xs text-violet-600 hover:text-violet-700 font-medium">
            Ver todos
          </Link>
        </div>
        <AuditTimeline
          events={(timeline ?? []).map((e) => ({
            ...e,
            timestamp: new Date(e.timestamp),
          }))}
          maxItems={10}
        />
      </div>
    </div>
  );
}
