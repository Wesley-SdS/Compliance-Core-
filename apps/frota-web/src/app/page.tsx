import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface TripActive {
  id: string;
  motorista: string;
  veiculo: string;
  origem: string;
  destino: string;
  status: string;
}

interface MaintenanceAlert {
  id: string;
  veiculo: string;
  tipo: string;
  km: string;
  severity: string;
}

interface RestCompliance {
  motorista: string;
  horasDirigidas: number;
  horasDescanso: number;
  conforme: boolean;
}

interface ScoreData {
  value: number;
  level: 'EXCELENTE' | 'BOM' | 'ATENCAO' | 'CRITICO';
  trend: 'MELHORANDO' | 'PIORANDO' | 'ESTAVEL';
}

async function getDashboardData() {
  const results = await Promise.allSettled([
    apiFetch<ScoreData>('/veiculos/score'),
    apiFetch<TripActive[]>('/viagens?status=em_transito'),
    apiFetch<MaintenanceAlert[]>('/alertas/manutencao'),
    apiFetch<RestCompliance[]>('/motoristas/descanso'),
  ]);

  const score = results[0].status === 'fulfilled' ? results[0].value : { value: 0, level: 'CRITICO' as const, trend: 'ESTAVEL' as const };
  const tripsActive = results[1].status === 'fulfilled' ? results[1].value : [];
  const maintenanceAlerts = results[2].status === 'fulfilled' ? results[2].value : [];
  const restCompliance = results[3].status === 'fulfilled' ? results[3].value : [];

  return { score, tripsActive, maintenanceAlerts, restCompliance };
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
  const { score, tripsActive, maintenanceAlerts, restCompliance } = await getDashboardData();

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ScoreCard value={score.value} level={score.level} trend={score.trend} />

        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="text-sm text-slate-500 font-medium">Viagens Ativas</div>
          <div className="text-3xl font-bold text-sky-600 mt-2">{tripsActive.length}</div>
          <div className="text-xs text-slate-400 mt-1">em transito agora</div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="text-sm text-slate-500 font-medium">Descanso Conforme</div>
          <div className="text-3xl font-bold text-green-600 mt-2">
            {restCompliance.filter((r) => r.conforme).length}/{restCompliance.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">motoristas em conformidade</div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="text-sm text-slate-500 font-medium">Alertas Manutencao</div>
          <div className="text-3xl font-bold text-amber-600 mt-2">{maintenanceAlerts.length}</div>
          <div className="text-xs text-slate-400 mt-1">requerem atencao</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Viagens Ativas */}
        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Viagens em Andamento</h2>
          {tripsActive.length > 0 ? (
            <div className="space-y-3">
              {tripsActive.map((trip) => (
                <div key={trip.id} className="p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-slate-700">{trip.motorista}</div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700">
                      Em transito
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {trip.veiculo} | {trip.origem} → {trip.destino}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Nenhuma viagem ativa no momento.</p>
          )}
          <Link href="/viagens" className="inline-block mt-4 text-sm text-sky-600 hover:text-sky-700 font-medium">
            Ver todas as viagens
          </Link>
        </div>

        {/* Alertas de Manutencao */}
        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Alertas de Manutencao</h2>
          {maintenanceAlerts.length > 0 ? (
            <div className="space-y-3">
              {maintenanceAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3">
                  <SeverityDot severity={alert.severity} />
                  <div>
                    <p className="text-sm text-slate-700">{alert.veiculo} - {alert.tipo}</p>
                    {alert.km !== '-' && <p className="text-xs text-slate-500">Proxima em: {alert.km}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Nenhum alerta de manutencao.</p>
          )}
        </div>
      </div>

      {/* Compliance de Descanso */}
      <div className="rounded-xl bg-white border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Compliance de Descanso (Lei do Motorista)</h2>
        {restCompliance.length > 0 ? (
          <div className="space-y-3">
            {restCompliance.map((driver) => (
              <div key={driver.motorista} className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${driver.conforme ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm font-medium text-slate-700">{driver.motorista}</span>
                </div>
                <div className="flex items-center gap-6 text-sm text-slate-500">
                  <span>Dirigidas: {driver.horasDirigidas}h</span>
                  <span>Descanso: {driver.horasDescanso}h</span>
                  <span className={`font-medium ${driver.conforme ? 'text-green-600' : 'text-red-600'}`}>
                    {driver.conforme ? 'Conforme' : 'Nao conforme'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Nenhum dado de descanso disponivel.</p>
        )}
      </div>
    </div>
  );
}
