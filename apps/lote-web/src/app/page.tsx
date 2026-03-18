'use client';

import Link from 'next/link';
import { useGlobalScore, useGlobalStats, useLoteamentos, useGlobalScoreHistory } from '@/hooks/use-api';
import { ScoreGauge, AlertBanner, AuditTimeline } from '@compliancecore/ui';
import { formatCurrency, formatPercent } from '@/lib/format';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';

const PIE_COLORS = ['#10b981', '#f59e0b', '#f43f5e', '#3b82f6'];

export default function DashboardPage() {
  const { data: score, isLoading: scoreLoading } = useGlobalScore();
  const { data: stats, isLoading: statsLoading } = useGlobalStats();
  const { data: loteamentosData } = useLoteamentos(1, 10);
  const { data: historyData } = useGlobalScoreHistory();

  const loteamentos = loteamentosData?.data ?? [];

  const scoreValue = score?.score ?? 0;
  const scoreLevel = score?.level ?? 'CRITICO';
  const scoreTrend = score?.trend ?? 'ESTAVEL';

  const pieData = [
    { name: 'Disponível', value: stats?.lotes_disponiveis ?? 0 },
    { name: 'Reservado', value: 0 },
    { name: 'Vendido', value: stats?.lotes_vendidos ?? 0 },
    { name: 'Quitado', value: 0 },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center justify-center">
          {scoreLoading ? (
            <div className="w-20 h-20 rounded-full bg-slate-100 animate-pulse" />
          ) : (
            <ScoreGauge score={scoreValue} level={scoreLevel as any} size={80} trend={scoreTrend as any} />
          )}
          <div className="text-xs text-slate-500 mt-2">Score Compliance</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="text-sm text-slate-500 font-medium">Loteamentos</div>
          <div className="text-3xl font-bold text-slate-800 mt-2">
            {statsLoading ? '—' : stats?.loteamentos_ativos ?? 0}
          </div>
          <div className="text-xs text-slate-400 mt-1">ativos</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="text-sm text-slate-500 font-medium">Lotes Totais</div>
          <div className="text-3xl font-bold text-slate-800 mt-2">
            {statsLoading ? '—' : stats?.lotes_total ?? 0}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {stats?.lotes_vendidos ?? 0} vendidos / {stats?.lotes_disponiveis ?? 0} disponíveis
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="text-sm text-slate-500 font-medium">Contratos Ativos</div>
          <div className="text-3xl font-bold text-rose-600 mt-2">
            {statsLoading ? '—' : stats?.contratos_ativos ?? 0}
          </div>
          <div className="text-xs text-slate-400 mt-1">em andamento</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="text-sm text-slate-500 font-medium">Inadimplência</div>
          <div className="text-3xl font-bold text-amber-600 mt-2">
            {statsLoading ? '—' : formatPercent(stats?.inadimplencia_pct ?? 0)}
          </div>
          <div className="text-xs text-slate-400 mt-1">dos contratos</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart — Status dos Lotes */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Status dos Lotes</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-sm text-slate-400">
              Sem dados de lotes
            </div>
          )}
        </div>

        {/* Score History */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Score Compliance Histórico</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={(() => {
              const scoreHistoryChart = (historyData?.history ?? []).map((h: any) => ({
                mes: new Date(h.date).toLocaleDateString('pt-BR', { month: 'short' }),
                score: h.score,
              }));
              return scoreHistoryChart.length > 0 ? scoreHistoryChart : [{ mes: 'Atual', score: scoreValue }];
            })()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#f43f5e" strokeWidth={2} dot={{ fill: '#f43f5e' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Loteamentos list */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-800">Loteamentos</h2>
          <Link href="/loteamentos" className="text-sm text-rose-600 hover:text-rose-700 font-medium">
            Ver todos
          </Link>
        </div>
        {loteamentos.length > 0 ? (
          <div className="space-y-3">
            {loteamentos.slice(0, 5).map((lot: any) => (
              <Link key={lot.id} href={`/loteamentos/${lot.id}`} className="block hover:bg-slate-50 rounded-lg p-3 -mx-3 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-800">{lot.nome}</div>
                    <div className="text-xs text-slate-500">{lot.cidade}, {lot.estado}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-700">{lot.total_lotes} lotes</div>
                    <div className="text-xs text-slate-400">{lot.status}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Nenhum loteamento cadastrado.</p>
        )}
      </div>
    </div>
  );
}
