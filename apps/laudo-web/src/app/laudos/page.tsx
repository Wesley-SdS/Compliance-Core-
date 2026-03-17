import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface Laudo {
  id: string;
  tipo: string;
  paciente: string;
  lab: string;
  data: string;
  status: string;
  revisor: string;
}

const statusFilters = ['Todos', 'Pendente', 'Aprovado', 'Rejeitado'];

async function getLaudos(): Promise<Laudo[]> {
  try {
    return await apiFetch<Laudo[]>('/laudos');
  } catch {
    return [];
  }
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    aprovado: 'bg-green-100 text-green-700',
    pendente: 'bg-amber-100 text-amber-700',
    rejeitado: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}

export default async function LaudosPage() {
  const laudos = await getLaudos();
  const pendentes = laudos.filter((l) => l.status === 'pendente').length;
  const aprovados = laudos.filter((l) => l.status === 'aprovado').length;
  const rejeitados = laudos.filter((l) => l.status === 'rejeitado').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Laudos</h2>
          <p className="text-sm text-slate-500 mt-1">{laudos.length} laudos registrados</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
          <div className="text-2xl font-bold text-amber-700">{pendentes}</div>
          <div className="text-xs text-amber-600 font-medium">Pendentes</div>
        </div>
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{aprovados}</div>
          <div className="text-xs text-green-600 font-medium">Aprovados</div>
        </div>
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-center">
          <div className="text-2xl font-bold text-red-700">{rejeitados}</div>
          <div className="text-xs text-red-600 font-medium">Rejeitados</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {statusFilters.map((filter) => (
          <button
            key={filter}
            type="button"
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === 'Todos'
                ? 'bg-violet-500 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Tipo de Exame</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Paciente/Amostra</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Laboratorio</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Data</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Revisor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {laudos.length > 0 ? (
              laudos.map((laudo) => (
                <tr key={laudo.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">{laudo.tipo}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{laudo.paciente}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{laudo.lab}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{laudo.data}</td>
                  <td className="px-6 py-4"><StatusBadge status={laudo.status} /></td>
                  <td className="px-6 py-4 text-sm text-slate-500">{laudo.revisor}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                  Nenhum laudo encontrado. Verifique a conexao com a API.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
