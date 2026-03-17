import { apiFetch } from '@/lib/api';

interface Motorista {
  id: string;
  nome: string;
  cpf: string;
  cnh: string;
  cnhValidade: string;
  statusCnh: string;
  horasDirigidas: number;
  descansoConforme: boolean;
  score: number;
}

async function getMotoristas(): Promise<Motorista[]> {
  try {
    return await apiFetch<Motorista[]>('/motoristas');
  } catch {
    return [];
  }
}

function CnhBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    valida: 'bg-green-100 text-green-700',
    vencendo: 'bg-amber-100 text-amber-700',
    vencida: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}

export default async function MotoristasPage() {
  const motoristas = await getMotoristas();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Motoristas</h2>
          <p className="text-sm text-slate-500 mt-1">{motoristas.length} motoristas cadastrados</p>
        </div>
        <button
          type="button"
          className="px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition-colors"
        >
          Novo Motorista
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Motorista</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">CNH</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Validade CNH</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status CNH</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Horas Dirigidas</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Descanso</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {motoristas.length > 0 ? (
              motoristas.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-800">{m.nome}</div>
                    <div className="text-xs text-slate-400">{m.cpf}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">Cat. {m.cnh}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{m.cnhValidade}</td>
                  <td className="px-6 py-4"><CnhBadge status={m.statusCnh} /></td>
                  <td className="px-6 py-4 text-sm text-slate-600">{m.horasDirigidas}h (hoje)</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${m.descansoConforme ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {m.descansoConforme ? 'Conforme' : 'Irregular'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-700">{m.score}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
                  Nenhum motorista encontrado. Verifique a conexao com a API.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
