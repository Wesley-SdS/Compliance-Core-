import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface Loteamento {
  id: string;
  nome: string;
  lotes: number;
  vendidos: number;
  score: number;
}

interface Pipeline { prospeccao: number; reserva: number; contrato: number; escritura: number; }

interface DimobAlert {
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
    apiFetch<ScoreData>('/loteamentos/score'),
    apiFetch<Loteamento[]>('/loteamentos'),
    apiFetch<Pipeline>('/pipeline'),
    apiFetch<DimobAlert[]>('/alertas/dimob'),
  ]);

  const score = results[0].status === 'fulfilled' ? results[0].value : { value: 0, level: 'CRITICO' as const, trend: 'ESTAVEL' as const };
  const loteamentos = results[1].status === 'fulfilled' ? results[1].value : [];
  const pipeline = results[2].status === 'fulfilled' ? results[2].value : { prospeccao: 0, reserva: 0, contrato: 0, escritura: 0 };
  const dimobAlerts = results[3].status === 'fulfilled' ? results[3].value : [];

  return { score, loteamentos, pipeline, dimobAlerts };
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
  const { score, loteamentos, pipeline, dimobAlerts } = await getDashboardData();
  const totalLotes = loteamentos.reduce((sum, l) => sum + l.lotes, 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ScoreCard value={score.value} level={score.level} trend={score.trend} />

        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="text-sm text-slate-500 font-medium">Loteamentos</div>
          <div className="text-3xl font-bold text-slate-800 mt-2">{loteamentos.length}</div>
          <div className="text-xs text-slate-400 mt-1">{totalLotes} lotes totais</div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="text-sm text-slate-500 font-medium">Pipeline de Vendas</div>
          <div className="text-3xl font-bold text-rose-600 mt-2">
            {pipeline.prospeccao + pipeline.reserva + pipeline.contrato + pipeline.escritura}
          </div>
          <div className="text-xs text-slate-400 mt-1">negocios em andamento</div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="text-sm text-slate-500 font-medium">Alertas DIMOB</div>
          <div className="text-3xl font-bold text-amber-600 mt-2">{dimobAlerts.length}</div>
          <div className="text-xs text-slate-400 mt-1">pendencias identificadas</div>
        </div>
      </div>

      {/* Sales Pipeline */}
      <div className="rounded-xl bg-white border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Pipeline de Vendas</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg bg-slate-50">
            <div className="text-2xl font-bold text-slate-700">{pipeline.prospeccao}</div>
            <div className="text-xs text-slate-500 mt-1">Prospeccao</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-blue-50">
            <div className="text-2xl font-bold text-blue-700">{pipeline.reserva}</div>
            <div className="text-xs text-blue-600 mt-1">Reserva</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-amber-50">
            <div className="text-2xl font-bold text-amber-700">{pipeline.contrato}</div>
            <div className="text-xs text-amber-600 mt-1">Contrato</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-green-50">
            <div className="text-2xl font-bold text-green-700">{pipeline.escritura}</div>
            <div className="text-xs text-green-600 mt-1">Escritura</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loteamentos */}
        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-800">Loteamentos</h2>
            <Link href="/loteamentos" className="text-sm text-rose-600 hover:text-rose-700 font-medium">
              Ver todos
            </Link>
          </div>
          {loteamentos.length > 0 ? (
            <div className="space-y-4">
              {loteamentos.map((lot) => (
                <Link key={lot.id} href={`/loteamentos/${lot.id}`} className="block">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-800">{lot.nome}</div>
                      <div className="text-xs text-slate-500">{lot.vendidos}/{lot.lotes} lotes vendidos</div>
                    </div>
                    <div className="text-sm font-semibold text-slate-700">Score {lot.score}</div>
                  </div>
                  <div className="mt-2 w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-rose-500 h-2 rounded-full" style={{ width: `${(lot.vendidos / lot.lotes) * 100}%` }} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Nenhum loteamento cadastrado.</p>
          )}
        </div>

        {/* Alertas DIMOB */}
        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Alertas DIMOB</h2>
          {dimobAlerts.length > 0 ? (
            <div className="space-y-3">
              {dimobAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3">
                  <SeverityDot severity={alert.severity} />
                  <p className="text-sm text-slate-600">{alert.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Nenhum alerta DIMOB.</p>
          )}
          <Link href="/dimob" className="inline-block mt-4 text-sm text-rose-600 hover:text-rose-700 font-medium">
            Gerenciar DIMOB
          </Link>
        </div>
      </div>
    </div>
  );
}
