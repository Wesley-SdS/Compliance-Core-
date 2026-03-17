import { apiFetch } from '@/lib/api';

interface Viagem {
  id: string;
  motorista: string;
  veiculo: string;
  origem: string;
  destino: string;
  data: string;
  status: string;
  ciot: string;
  ciotStatus: string;
}

async function getViagens(): Promise<Viagem[]> {
  try {
    return await apiFetch<Viagem[]>('/viagens');
  } catch {
    return [];
  }
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    em_transito: 'bg-sky-100 text-sky-700',
    concluida: 'bg-green-100 text-green-700',
    agendada: 'bg-blue-100 text-blue-700',
    cancelada: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function CiotBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ativo: 'bg-green-100 text-green-700',
    encerrado: 'bg-slate-100 text-slate-600',
    pendente: 'bg-amber-100 text-amber-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}

export default async function ViagensPage() {
  const viagens = await getViagens();
  const emTransito = viagens.filter((v) => v.status === 'em_transito').length;
  const concluidas = viagens.filter((v) => v.status === 'concluida').length;
  const agendadas = viagens.filter((v) => v.status === 'agendada').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Viagens</h2>
          <p className="text-sm text-slate-500 mt-1">{viagens.length} viagens registradas</p>
        </div>
        <button
          type="button"
          className="px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition-colors"
        >
          Nova Viagem
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-sky-50 border border-sky-200 p-4 text-center">
          <div className="text-2xl font-bold text-sky-700">{emTransito}</div>
          <div className="text-xs text-sky-600 font-medium">Em Transito</div>
        </div>
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{concluidas}</div>
          <div className="text-xs text-green-600 font-medium">Concluidas</div>
        </div>
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">{agendadas}</div>
          <div className="text-xs text-blue-600 font-medium">Agendadas</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Motorista</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Veiculo</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Rota</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Data</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">CIOT</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">CIOT Status</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {viagens.length > 0 ? (
              viagens.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">{v.motorista}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-mono">{v.veiculo}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{v.origem} → {v.destino}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{v.data}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-mono">{v.ciot}</td>
                  <td className="px-6 py-4"><CiotBadge status={v.ciotStatus} /></td>
                  <td className="px-6 py-4"><StatusBadge status={v.status} /></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
                  Nenhuma viagem encontrada. Verifique a conexao com a API.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
