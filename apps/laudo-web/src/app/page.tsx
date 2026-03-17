import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface LaudoPendente {
  id: string;
  tipo: string;
  paciente: string;
  lab: string;
  prazo: string;
}

interface CalibrationAlert {
  id: string;
  equipamento: string;
  lab: string;
  vencimento: string;
  severity: string;
}

interface QualityMetric {
  metrica: string;
  valor: string;
  trend: string;
}

interface ScoreData {
  value: number;
  level: 'EXCELENTE' | 'BOM' | 'ATENCAO' | 'CRITICO';
  trend: 'MELHORANDO' | 'PIORANDO' | 'ESTAVEL';
}

async function getDashboardData() {
  const results = await Promise.allSettled([
    apiFetch<ScoreData>('/laboratorios/score'),
    apiFetch<LaudoPendente[]>('/laudos?status=pendente'),
    apiFetch<CalibrationAlert[]>('/alertas/calibracao'),
    apiFetch<QualityMetric[]>('/metricas/qualidade'),
  ]);

  const score = results[0].status === 'fulfilled' ? results[0].value : { value: 0, level: 'CRITICO' as const, trend: 'ESTAVEL' as const };
  const laudosPendentes = results[1].status === 'fulfilled' ? results[1].value : [];
  const calibrationAlerts = results[2].status === 'fulfilled' ? results[2].value : [];
  const quality = results[3].status === 'fulfilled' ? results[3].value : [];

  return { score, laudosPendentes, calibrationAlerts, quality };
}

function ScoreCard({ value, level, trend }: { value: number; level: string; trend: string }) {
  const color = level === 'EXCELENTE' ? 'text-green-600' : level === 'BOM' ? 'text-blue-600' : level === 'ATENCAO' ? 'text-amber-600' : 'text-red-600';
  const bgColor = level === 'EXCELENTE' ? 'bg-green-50' : level === 'BOM' ? 'bg-blue-50' : level === 'ATENCAO' ? 'bg-amber-50' : 'bg-red-50';
  const trendArrow = trend === 'MELHORANDO' ? '\u2191' : trend === 'PIORANDO' ? '\u2193' : '\u2192';
  const trendColor = trend === 'MELHORANDO' ? 'text-green-600' : trend === 'PIORANDO' ? 'text-red-600' : 'text-slate-500';

  return (
    <div className={`rounded-xl ${bgColor} p-6 flex flex-col items-center justify-center`}>
      <div className={`text-5xl font-bold ${color}`}>{value}</div>
      <div className={`text-sm font-medium ${color} mt-1`}>{level}</div>
      <div className={`text-xs ${trendColor} mt-2 font-medium`}>{trendArrow} {trend.toLowerCase()}</div>
    </div>
  );
}

function SeverityDot({ severity }: { severity: string }) {
  const color = severity === 'error' ? 'bg-red-500' : severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500';
  return <span className={`inline-block w-2 h-2 rounded-full ${color} flex-shrink-0 mt-1.5`} />;
}

export default async function DashboardPage() {
  const { score, laudosPendentes, calibrationAlerts, quality } = await getDashboardData();

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ScoreCard value={score.value} level={score.level} trend={score.trend} />

        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="text-sm text-slate-500 font-medium">Laudos Pendentes</div>
          <div className="text-3xl font-bold text-amber-600 mt-2">{laudosPendentes.length}</div>
          <div className="text-xs text-slate-400 mt-1">aguardando revisao</div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="text-sm text-slate-500 font-medium">Calibracoes Vencendo</div>
          <div className="text-3xl font-bold text-red-600 mt-2">{calibrationAlerts.filter((a) => a.severity === 'error').length}</div>
          <div className="text-xs text-slate-400 mt-1">equipamentos com alerta</div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="text-sm text-slate-500 font-medium">Laboratorios Ativos</div>
          <div className="text-3xl font-bold text-slate-800 mt-2">4</div>
          <div className="text-xs text-slate-400 mt-1">em operacao</div>
        </div>
      </div>

      {/* Metricas de Qualidade */}
      {quality.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quality.map((q) => (
            <div key={q.metrica} className="rounded-xl bg-white border border-slate-200 p-4">
              <div className="text-xs text-slate-500 font-medium">{q.metrica}</div>
              <div className="text-2xl font-bold text-slate-800 mt-1">{q.valor}</div>
              <div className={`text-xs mt-1 font-medium ${q.trend === 'up' ? 'text-green-600' : q.trend === 'down' ? 'text-red-600' : 'text-slate-500'}`}>
                {q.trend === 'up' ? '\u2191 melhorando' : q.trend === 'down' ? '\u2193 piorando' : '\u2192 estavel'}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Laudos Pendentes */}
        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Laudos Pendentes de Revisao</h2>
          {laudosPendentes.length > 0 ? (
            <div className="space-y-3">
              {laudosPendentes.map((laudo) => (
                <div key={laudo.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
                  <div>
                    <div className="text-sm font-medium text-slate-700">{laudo.tipo}</div>
                    <div className="text-xs text-slate-500">{laudo.paciente} - {laudo.lab}</div>
                  </div>
                  <span className="text-xs text-slate-500">Prazo: {laudo.prazo}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Nenhum laudo pendente.</p>
          )}
          <Link href="/laudos" className="inline-block mt-4 text-sm text-violet-600 hover:text-violet-700 font-medium">
            Ver todos os laudos
          </Link>
        </div>

        {/* Alertas de Calibracao */}
        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Alertas de Calibracao</h2>
          {calibrationAlerts.length > 0 ? (
            <div className="space-y-3">
              {calibrationAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3">
                  <SeverityDot severity={alert.severity} />
                  <div>
                    <p className="text-sm text-slate-700">{alert.equipamento}</p>
                    <p className="text-xs text-slate-500">{alert.lab} - Vencimento: {alert.vencimento}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Nenhum alerta de calibracao.</p>
          )}
        </div>
      </div>
    </div>
  );
}
