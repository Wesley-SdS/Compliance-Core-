import { api } from '@/lib/api';

interface Alerta {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string;
  clinica: string;
  severity: 'error' | 'warning' | 'info';
  status: 'pendente' | 'reconhecido';
  criadoEm: string;
}

const statusFilters = ['Todos', 'Pendente', 'Reconhecido'];
const typeFilters = ['Todos', 'Documento', 'Licenca', 'Vistoria', 'Prazo'];

async function getAlertas(): Promise<Alerta[]> {
  try {
    return await api<Alerta[]>('/alertas');
  } catch {
    return [];
  }
}

function SeverityIcon({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-blue-500',
  };
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${severity === 'error' ? 'bg-red-500' : severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'} flex-shrink-0 mt-1.5`} />
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pendente: 'bg-amber-100 text-amber-700',
    reconhecido: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}

export default async function AlertasPage() {
  const alertas = await getAlertas();
  const urgentes = alertas.filter((a) => a.severity === 'error' && a.status === 'pendente');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Alertas</h1>
        <p className="mt-1 text-sm text-gray-500">
          {alertas.length} alertas registrados
        </p>
      </div>

      {/* Urgent Alert Banner */}
      {urgentes.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-3">
            <svg
              className="h-5 w-5 text-red-600 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800">
                {urgentes.length} alerta{urgentes.length > 1 ? 's' : ''} urgente{urgentes.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-red-700 mt-0.5">
                {urgentes[0].titulo}
                {urgentes.length > 1 && ` e mais ${urgentes.length - 1}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-center">
          <div className="text-2xl font-bold text-red-700">
            {alertas.filter((a) => a.severity === 'error').length}
          </div>
          <div className="text-xs text-red-600 font-medium">Criticos</div>
        </div>
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
          <div className="text-2xl font-bold text-amber-700">
            {alertas.filter((a) => a.severity === 'warning').length}
          </div>
          <div className="text-xs text-amber-600 font-medium">Avisos</div>
        </div>
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">
            {alertas.filter((a) => a.severity === 'info').length}
          </div>
          <div className="text-xs text-blue-600 font-medium">Informativos</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <div className="flex gap-2">
            {statusFilters.map((s) => (
              <button
                key={s}
                type="button"
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  s === 'Todos'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
          <div className="flex gap-2">
            {typeFilters.map((t) => (
              <button
                key={t}
                type="button"
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  t === 'Todos'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alert Timeline */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">
            Todos os Alertas
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {alertas.length > 0 ? (
            alertas.map((alerta) => (
              <div
                key={alerta.id}
                className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <SeverityIcon severity={alerta.severity} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-gray-900">
                      {alerta.titulo}
                    </p>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <StatusBadge status={alerta.status} />
                      {alerta.status === 'pendente' && (
                        <button
                          type="button"
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          Reconhecer
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {alerta.descricao}
                  </p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-gray-400">
                      {alerta.clinica}
                    </span>
                    <span className="text-xs text-gray-400">
                      {alerta.tipo}
                    </span>
                    <span className="text-xs text-gray-400">
                      {alerta.criadoEm}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-gray-500">
                Nenhum alerta encontrado. Verifique a conexao com a API.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
