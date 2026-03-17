import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface Obra {
  id: string;
  nome: string;
  endereco: string;
  etapa: string;
  progresso: number;
  score: number;
  level: string;
  responsavel: string;
}

async function getObras(): Promise<Obra[]> {
  try {
    return await apiFetch<Obra[]>('/obras');
  } catch {
    return [];
  }
}

function ComplianceBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    EXCELENTE: 'bg-green-100 text-green-700',
    BOM: 'bg-blue-100 text-blue-700',
    ATENCAO: 'bg-amber-100 text-amber-700',
    CRITICO: 'bg-red-100 text-red-700',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[level] ?? 'bg-slate-100 text-slate-700'}`}>
      {level}
    </span>
  );
}

export default async function ObrasPage() {
  const obras = await getObras();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Obras</h2>
          <p className="text-sm text-slate-500 mt-1">{obras.length} obras cadastradas</p>
        </div>
        <button
          type="button"
          className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
        >
          Nova Obra
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Obra</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Etapa</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Progresso</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Score</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Responsavel</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {obras.length > 0 ? (
              obras.map((obra) => (
                <tr key={obra.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/obras/${obra.id}`} className="text-sm font-medium text-slate-800 hover:text-amber-600">
                      {obra.nome}
                    </Link>
                    <div className="text-xs text-slate-400 mt-0.5">{obra.endereco}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{obra.etapa}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-slate-100 rounded-full h-2">
                        <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${obra.progresso}%` }} />
                      </div>
                      <span className="text-xs text-slate-500">{obra.progresso}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-700">{obra.score}</span>
                  </td>
                  <td className="px-6 py-4">
                    <ComplianceBadge level={obra.level} />
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{obra.responsavel}</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                  Nenhuma obra encontrada. Verifique a conexao com a API.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
