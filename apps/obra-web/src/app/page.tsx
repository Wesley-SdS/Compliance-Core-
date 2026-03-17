import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface Obra {
  id: string;
  nome: string;
  etapa: string;
  progresso: number;
  score: number;
}

interface Alert {
  id: string;
  message: string;
  severity: string;
}

interface Activity {
  id: string;
  text: string;
  time: string;
}

interface ScoreData {
  value: number;
  level: 'EXCELENTE' | 'BOM' | 'ATENCAO' | 'CRITICO';
  trend: 'MELHORANDO' | 'PIORANDO' | 'ESTAVEL';
}

async function getDashboardData() {
  const results = await Promise.allSettled([
    apiFetch<ScoreData>('/obras/score'),
    apiFetch<Obra[]>('/obras'),
    apiFetch<Alert[]>('/alertas'),
    apiFetch<Activity[]>('/atividades'),
  ]);

  const score = results[0].status === 'fulfilled' ? results[0].value : { value: 0, level: 'CRITICO' as const, trend: 'ESTAVEL' as const };
  const obras = results[1].status === 'fulfilled' ? results[1].value : [];
  const alerts = results[2].status === 'fulfilled' ? results[2].value : [];
  const activity = results[3].status === 'fulfilled' ? results[3].value : [];

  return { score, obras, alerts, activity };
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
  const { score, obras, alerts, activity } = await getDashboardData();

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ScoreCard value={score.value} level={score.level} trend={score.trend} />

        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="text-sm text-slate-500 font-medium">Obras Ativas</div>
          <div className="text-3xl font-bold text-slate-800 mt-2">{obras.length}</div>
          <div className="text-xs text-slate-400 mt-1">em andamento</div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="text-sm text-slate-500 font-medium">Alertas Pendentes</div>
          <div className="text-3xl font-bold text-amber-600 mt-2">{alerts.length}</div>
          <div className="text-xs text-slate-400 mt-1">requerem atencao</div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="text-sm text-slate-500 font-medium">Documentos Pendentes</div>
          <div className="text-3xl font-bold text-slate-800 mt-2">7</div>
          <div className="text-xs text-slate-400 mt-1">aguardando envio</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertas */}
        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Alertas Recentes</h2>
          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3">
                  <SeverityDot severity={alert.severity} />
                  <p className="text-sm text-slate-600">{alert.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Nenhum alerta recente.</p>
          )}
          <Link href="/alertas" className="inline-block mt-4 text-sm text-amber-600 hover:text-amber-700 font-medium">
            Ver todos os alertas
          </Link>
        </div>

        {/* Atividade Recente */}
        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Atividade Recente</h2>
          {activity.length > 0 ? (
            <div className="space-y-3">
              {activity.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4">
                  <p className="text-sm text-slate-600">{item.text}</p>
                  <span className="text-xs text-slate-400 whitespace-nowrap">{item.time}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Nenhuma atividade recente.</p>
          )}
        </div>
      </div>

      {/* Obras em Andamento */}
      <div className="rounded-xl bg-white border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-800">Obras em Andamento</h2>
          <Link href="/obras" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
            Ver todas
          </Link>
        </div>
        {obras.length > 0 ? (
          <div className="space-y-4">
            {obras.map((obra) => (
              <Link key={obra.id} href={`/obras/${obra.id}`} className="block">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-800">{obra.nome}</div>
                    <div className="text-xs text-slate-500">Etapa: {obra.etapa}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-700">Score {obra.score}</div>
                  </div>
                </div>
                <div className="mt-2 w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all"
                    style={{ width: `${obra.progresso}%` }}
                  />
                </div>
                <div className="text-xs text-slate-400 mt-1">{obra.progresso}% concluido</div>
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
