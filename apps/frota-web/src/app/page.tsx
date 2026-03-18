'use client';

import Link from 'next/link';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  AlertTriangle, Truck, FileWarning, Wrench, MapPin, Users, TrendingUp, TrendingDown, Minus,
  Clock, Shield, CheckCircle2, XCircle,
} from 'lucide-react';

import { useFrotaScore, useFrotaStats, useFrotaScoreHistory, useFrotaTimeline } from '@/hooks/use-frota';
import { useCustos } from '@/hooks/use-custos';
import { useVeiculos } from '@/hooks/use-veiculos';
import { useDocumentosVencimentos, useManutencoesAlertas } from '@/hooks/use-alertas';
import type { ComplianceLevel } from '@/lib/types';

/* ── helpers ─────────────────────────────────────────────────────── */

function levelColor(level: ComplianceLevel | string) {
  switch (level) {
    case 'EXCELENTE': return { text: 'text-green-600', bg: 'bg-green-50', ring: 'ring-green-500', bar: 'bg-green-500' };
    case 'BOM':       return { text: 'text-blue-600',  bg: 'bg-blue-50',  ring: 'ring-blue-500',  bar: 'bg-blue-500' };
    case 'ATENCAO':   return { text: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-500', bar: 'bg-amber-500' };
    default:          return { text: 'text-red-600',   bg: 'bg-red-50',   ring: 'ring-red-500',   bar: 'bg-red-500' };
  }
}

function ComplianceBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    EXCELENTE: 'bg-green-100 text-green-700',
    BOM: 'bg-blue-100 text-blue-700',
    ATENCAO: 'bg-amber-100 text-amber-700',
    CRITICO: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[level] ?? 'bg-slate-100 text-slate-700'}`}>
      {level}
    </span>
  );
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'MELHORANDO') return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (trend === 'PIORANDO')   return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-slate-400" />;
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
}


/* ── ScoreGauge ──────────────────────────────────────────────────── */

function ScoreGauge({ value, level, trend, size = 'lg' }: { value: number; level: string; trend?: string; size?: 'sm' | 'lg' }) {
  const c = levelColor(level);
  const pct = Math.min(value, 100);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (pct / 100) * circumference;
  const dim = size === 'lg' ? 'w-40 h-40' : 'w-10 h-10';
  const textSize = size === 'lg' ? 'text-4xl' : 'text-xs';

  if (size === 'sm') {
    return (
      <div className={`relative ${dim} flex items-center justify-center`}>
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" strokeWidth="8" />
          <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor"
            className={c.text} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset} />
        </svg>
        <span className={`absolute ${textSize} font-bold ${c.text}`}>{value}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative ${dim} flex items-center justify-center`}>
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" strokeWidth="8" />
          <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor"
            className={c.text} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset} />
        </svg>
        <span className={`absolute ${textSize} font-bold ${c.text}`}>{value}</span>
      </div>
      <span className={`text-sm font-semibold ${c.text}`}>{level}</span>
      {trend && (
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <TrendIcon trend={trend} />
          <span>{trend.charAt(0) + trend.slice(1).toLowerCase()}</span>
        </div>
      )}
    </div>
  );
}

/* ── Alert Banner ────────────────────────────────────────────────── */

function AlertBanner() {
  const { data: docsVencendo } = useDocumentosVencimentos();
  const { data: manutAlertas } = useManutencoesAlertas();

  const items: { icon: React.ReactNode; text: string; color: string }[] = [];

  if (docsVencendo && docsVencendo.length > 0) {
    items.push({
      icon: <FileWarning className="w-4 h-4" />,
      text: `${docsVencendo.length} documento(s) vencendo ou vencido(s)`,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
    });
  }

  if (manutAlertas && manutAlertas.length > 0) {
    items.push({
      icon: <Wrench className="w-4 h-4" />,
      text: `${manutAlertas.length} manutencao(oes) atrasada(s) ou proxima(s)`,
      color: 'text-red-700 bg-red-50 border-red-200',
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${item.color}`}>
          {item.icon}
          <span className="text-sm font-medium">{item.text}</span>
        </div>
      ))}
    </div>
  );
}

/* ── KPI Card ────────────────────────────────────────────────────── */

function KpiCard({ icon, label, value, sub, color = 'text-slate-800' }: {
  icon: React.ReactNode; label: string; value: number | string; sub?: string; color?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-slate-100">{icon}</div>
        <span className="text-sm text-slate-500 font-medium">{label}</span>
      </div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

/* ── Main Dashboard ──────────────────────────────────────────────── */

export default function DashboardPage() {
  const { data: score, isLoading: scoreLoading } = useFrotaScore();
  const { data: stats, isLoading: statsLoading } = useFrotaStats();
  const { data: scoreHistory, isLoading: historyLoading } = useFrotaScoreHistory();
  const { data: veiculos, isLoading: veiculosLoading } = useVeiculos();
  const { data: custosData, isLoading: custosLoading } = useCustos({ periodo: '30d' });
  const { data: timelineData, isLoading: timelineLoading } = useFrotaTimeline();

  const custoPorVeiculo = custosData?.custoPorVeiculo ?? [];

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      <AlertBanner />

      {/* Score + KPI row */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        {/* Score Gauge */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-center">
          {scoreLoading || !score ? (
            <Skeleton className="w-40 h-40 rounded-full" />
          ) : (
            <ScoreGauge value={score.value} level={score.level} trend={score.trend} />
          )}
        </div>

        {/* KPI Cards */}
        <div className="lg:col-span-5 grid grid-cols-2 md:grid-cols-5 gap-4">
          {statsLoading || !stats ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-6">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))
          ) : (
            <>
              <KpiCard icon={<Truck className="w-5 h-5 text-sky-600" />} label="Veiculos Ativos" value={stats.veiculosAtivos} color="text-sky-600" />
              <KpiCard icon={<FileWarning className="w-5 h-5 text-amber-600" />} label="Docs Vencendo 7d" value={stats.documentosVencendo} color="text-amber-600" />
              <KpiCard icon={<Wrench className="w-5 h-5 text-red-600" />} label="Manut. Atrasadas" value={stats.manutencoesAtrasadas} color="text-red-600" />
              <KpiCard icon={<MapPin className="w-5 h-5 text-green-600" />} label="Viagens Hoje" value={stats.viagensHoje} color="text-green-600" />
              <KpiCard icon={<Users className="w-5 h-5 text-purple-600" />} label="Motoristas em Rota" value={stats.motoristasEmRota} color="text-purple-600" />
            </>
          )}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Custo por Veiculo */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Custo por Veiculo (ultimos 30 dias)</h3>
          {custosLoading ? (
            <Skeleton className="w-full h-[260px]" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={custoPorVeiculo}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="placa" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v: number) => `R$${(v / 1000).toFixed(1)}k`} />
                <Tooltip formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, 'Custo']} />
                <Bar dataKey="custo" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Score History */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Score de Compliance (6 meses)</h3>
          {historyLoading || !scoreHistory ? (
            <Skeleton className="w-full h-[260px]" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={scoreHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="data" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip formatter={(v: number) => [v, 'Score']} />
                <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Veiculos list + audit timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Veiculos */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Veiculos da Frota</h3>
            <Link href="/veiculos" className="text-xs text-sky-600 hover:text-sky-700 font-medium">Ver todos</Link>
          </div>
          {veiculosLoading || !veiculos ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {veiculos.slice(0, 8).map((v) => (
                <Link key={v.id} href={`/veiculos/${v.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                  <ScoreGauge value={v.score} level={v.level} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800 font-mono">{v.placa}</span>
                      <ComplianceBadge level={v.level} />
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{v.marca} {v.modelo} | {v.km.toLocaleString('pt-BR')} km</div>
                  </div>
                  {v.proximoAlerta && (
                    <div className="flex items-center gap-1 text-xs text-amber-600">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{v.proximoAlerta}</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Audit Timeline */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Atividade Recente</h3>
          {timelineLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : timelineData && timelineData.length > 0 ? (
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-200" />
              <div className="space-y-5">
                {timelineData.map((event) => (
                  <div key={event.id} className="relative flex items-start gap-3 pl-8">
                    <div className="absolute left-1.5 w-3 h-3 rounded-full bg-sky-500 border-2 border-white" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">{event.title}</p>
                      <p className="text-xs text-slate-500">{event.description}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(event.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">Nenhuma atividade recente.</p>
          )}
        </div>
      </div>
    </div>
  );
}
