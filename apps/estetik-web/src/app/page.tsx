'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useClinicas, useClinicaScore, useClinicaTimeline } from '@/hooks/use-clinicas';
import { useAlertas } from '@/hooks/use-alertas';
import { ScoreGauge } from '@compliancecore/ui/ScoreGauge';
import { AlertBanner } from '@compliancecore/ui/AlertBanner';
import { AuditTimeline } from '@compliancecore/ui/AuditTimeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Shield,
  Bell,
  FileWarning,
  ClipboardCheck,
  Plus,
  Upload,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

const MOCK_SCORE_HISTORY = [
  { month: 'Out', score: 58 },
  { month: 'Nov', score: 62 },
  { month: 'Dez', score: 65 },
  { month: 'Jan', score: 68 },
  { month: 'Fev', score: 72 },
  { month: 'Mar', score: 75 },
];

function ScoreHistoryChart() {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={MOCK_SCORE_HISTORY} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#6B7280' }} />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: '1px solid #E5E7EB',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
          formatter={(value: number) => [`${value}%`, 'Score']}
        />
        <ReferenceLine y={80} stroke="#16A34A" strokeDasharray="3 3" label={{ value: 'Excelente', fill: '#16A34A', fontSize: 10 }} />
        <ReferenceLine y={50} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: 'Atenção', fill: '#F59E0B', fontSize: 10 }} />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#4F46E5"
          strokeWidth={2.5}
          dot={{ fill: '#4F46E5', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <Skeleton className="mt-4 h-8 w-16" />
        <Skeleton className="mt-2 h-3 w-20" />
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <Skeleton className="h-16 w-full rounded-lg" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-60 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-60 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TrendIcon({ trend }: { trend?: string }) {
  if (trend === 'MELHORANDO') return <TrendingUp className="h-4 w-4 text-green-600" />;
  if (trend === 'PIORANDO') return <TrendingDown className="h-4 w-4 text-red-600" />;
  return <Minus className="h-4 w-4 text-gray-400" />;
}

export default function DashboardPage() {
  const { data: clinicas, isLoading: loadingClinicas } = useClinicas({ limit: 5 });
  const { data: alertas, isLoading: loadingAlertas } = useAlertas();

  const selectedClinicId = clinicas?.data?.[0]?.id;

  const { data: score, isLoading: loadingScore } = useClinicaScore(selectedClinicId);
  const { data: timeline, isLoading: loadingTimeline } = useClinicaTimeline(selectedClinicId);

  const isLoading = loadingClinicas || loadingAlertas;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const urgentAlerts = (alertas ?? []).filter((a: any) => a.daysUntilDue <= 7);
  const pendingAlerts = alertas ?? [];
  const docsExpiring = (alertas ?? []).filter(
    (a: any) => a.alertType?.toLowerCase().includes('documento') || a.alertType?.toLowerCase().includes('licen')
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Visao geral do compliance das suas clinicas de estetica.
        </p>
      </div>

      {/* Alert Banner */}
      {urgentAlerts.length > 0 && (
        <AlertBanner
          alerts={urgentAlerts}
          onDismiss={() => {}}
        />
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Score */}
        <Card className="flex flex-col items-center">
          <CardContent className="flex flex-col items-center p-6">
            <div className="mb-2 flex w-full items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Score Geral</h3>
              <span className="rounded-full bg-indigo-100 p-2">
                <Shield className="h-5 w-5 text-indigo-600" />
              </span>
            </div>
            {loadingScore ? (
              <Skeleton className="h-[140px] w-[140px] rounded-full" />
            ) : score ? (
              <div className="flex flex-col items-center gap-1">
                <ScoreGauge
                  score={score.overall}
                  level={score.level}
                  size={140}
                  showLabel
                  trend={score.trend}
                />
                <div className="mt-1 flex items-center gap-1">
                  <TrendIcon trend={score.trend} />
                  <span className="text-xs text-gray-500">{score.trend?.toLowerCase()}</span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-sm text-gray-400">Score nao calculado</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts pending */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Alertas Pendentes</h3>
              <span className="rounded-full bg-amber-100 p-2">
                <Bell className="h-5 w-5 text-amber-600" />
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold text-gray-900">{pendingAlerts.length}</p>
            <p className="mt-1 text-sm text-gray-500">pendentes</p>
            {urgentAlerts.length > 0 && (
              <Badge variant="destructive" className="mt-2">
                {urgentAlerts.length} urgente(s)
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Docs Expiring */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Docs Expirando</h3>
              <span className="rounded-full bg-red-100 p-2">
                <FileWarning className="h-5 w-5 text-red-600" />
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold text-gray-900">{docsExpiring.length}</p>
            <p className="mt-1 text-sm text-gray-500">nos proximos 30 dias</p>
          </CardContent>
        </Card>

        {/* Checklists */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Checklists</h3>
              <span className="rounded-full bg-green-100 p-2">
                <ClipboardCheck className="h-5 w-5 text-green-600" />
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold text-gray-900">
              {clinicas?.total ?? 0}
            </p>
            <p className="mt-1 text-sm text-gray-500">clinicas cadastradas</p>
          </CardContent>
        </Card>
      </div>

      {/* Score History & Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Score History Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900">
              Historico de Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreHistoryChart />
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900">
                Atividade Recente
              </CardTitle>
              {selectedClinicId && (
                <Link href={`/clinicas/${selectedClinicId}?tab=timeline`}>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    Ver tudo <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loadingTimeline ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : timeline?.events && timeline.events.length > 0 ? (
              <AuditTimeline events={timeline.events} maxItems={10} />
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500">Nenhuma atividade recente</p>
                <p className="mt-1 text-xs text-gray-400">Cadastre uma clinica para comecar</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-gray-900">
            Acoes Rapidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link
              href="/clinicas?action=new"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-indigo-300 hover:bg-indigo-50"
            >
              <div className="rounded-lg bg-indigo-100 p-2">
                <Plus className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Nova Clinica</p>
                <p className="text-xs text-gray-500">Cadastrar uma nova clinica</p>
              </div>
            </Link>

            <Link
              href="/documentos?action=upload"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-green-300 hover:bg-green-50"
            >
              <div className="rounded-lg bg-green-100 p-2">
                <Upload className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Upload Documento</p>
                <p className="text-xs text-gray-500">Enviar alvara, licenca ou documento</p>
              </div>
            </Link>

            <Link
              href="/relatorios?action=dossier"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-purple-300 hover:bg-purple-50"
            >
              <div className="rounded-lg bg-purple-100 p-2">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Gerar Dossie</p>
                <p className="text-xs text-gray-500">Gerar dossie completo de auditoria</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
