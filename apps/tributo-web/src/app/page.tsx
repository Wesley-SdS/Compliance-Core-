import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface Empresa {
  id: string;
  nome: string;
  regime: string;
  score: number;
}

interface Obrigacao {
  id: string;
  nome: string;
  vencimento: string;
  empresa: string;
  status: string;
}

interface ReformAlert {
  id: string;
  message: string;
  severity: string;
}

interface ScoreData {
  value: number;
  level: 'EXCELENTE' | 'BOM' | 'ATENCAO' | 'CRITICO';
  trend: 'MELHORANDO' | 'PIORANDO' | 'ESTAVEL';
}

async function getDashboardData() {
  const results = await Promise.allSettled([
    apiFetch<ScoreData>('/empresas/score'),
    apiFetch<Empresa[]>('/empresas'),
    apiFetch<Obrigacao[]>('/obrigacoes'),
    apiFetch<ReformAlert[]>('/alertas/reforma'),
  ]);

  const score = results[0].status === 'fulfilled' ? results[0].value : { value: 0, level: 'CRITICO' as const, trend: 'ESTAVEL' as const };
  const empresas = results[1].status === 'fulfilled' ? results[1].value : [];
  const obrigacoes = results[2].status === 'fulfilled' ? results[2].value : [];
  const reformAlerts = results[3].status === 'fulfilled' ? results[3].value : [];

  return { score, empresas, obrigacoes, reformAlerts };
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    entregue: 'bg-green-100 text-green-700',
    pendente: 'bg-amber-100 text-amber-700',
    atrasado: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}

function SeverityDot({ severity }: { severity: string }) {
  const color = severity === 'error' ? 'bg-red-500' : severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500';
  return <span className={`inline-block w-2 h-2 rounded-full ${color} flex-shrink-0 mt-1.5`} />;
}

export default async function DashboardPage() {
  const { score, empresas, obrigacoes, reformAlerts } = await getDashboardData();

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ScoreCard value={score.value} level={score.level} trend={score.trend} />

        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="text-sm text-slate-500 font-medium">Empresas</div>
          <div className="text-3xl font-bold text-slate-800 mt-2">{empresas.length}</div>
          <div className="text-xs text-slate-400 mt-1">clientes ativos</div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="text-sm text-slate-500 font-medium">Obrigacoes Pendentes</div>
          <div className="text-3xl font-bold text-amber-600 mt-2">
            {obrigacoes.filter((o) => o.status === 'pendente').length}
          </div>
          <div className="text-xs text-slate-400 mt-1">este mes</div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="text-sm text-slate-500 font-medium">Alertas Reforma</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{reformAlerts.length}</div>
          <div className="text-xs text-slate-400 mt-1">impactos identificados</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendario de Obrigacoes */}
        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Proximas Obrigacoes</h2>
          {obrigacoes.length > 0 ? (
            <div className="space-y-3">
              {obrigacoes.map((obr) => (
                <div key={obr.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
                  <div>
                    <div className="text-sm font-medium text-slate-700">{obr.nome}</div>
                    <div className="text-xs text-slate-500">{obr.empresa}</div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className="text-xs text-slate-500">{obr.vencimento}</span>
                    <StatusBadge status={obr.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Nenhuma obrigacao encontrada.</p>
          )}
        </div>

        {/* Alertas de Reforma */}
        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Impacto da Reforma Tributaria</h2>
          {reformAlerts.length > 0 ? (
            <div className="space-y-3">
              {reformAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3">
                  <SeverityDot severity={alert.severity} />
                  <p className="text-sm text-slate-600">{alert.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Nenhum alerta de reforma.</p>
          )}
          <Link href="/simulador" className="inline-block mt-4 text-sm text-emerald-600 hover:text-emerald-700 font-medium">
            Abrir Simulador de Reforma
          </Link>
        </div>
      </div>

      {/* Empresas */}
      <div className="rounded-xl bg-white border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-800">Empresas Recentes</h2>
          <Link href="/empresas" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
            Ver todas
          </Link>
        </div>
        {empresas.length > 0 ? (
          <div className="space-y-3">
            {empresas.map((empresa) => (
              <Link key={empresa.id} href={`/empresas/${empresa.id}`} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                <div>
                  <div className="text-sm font-medium text-slate-800">{empresa.nome}</div>
                  <div className="text-xs text-slate-500">{empresa.regime}</div>
                </div>
                <div className="text-sm font-semibold text-slate-700">Score {empresa.score}</div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Nenhuma empresa cadastrada.</p>
        )}
      </div>
    </div>
  );
}
