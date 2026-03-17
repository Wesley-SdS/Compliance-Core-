import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface Loteamento {
  id: string;
  nome: string;
  cidade: string;
  lotes: number;
  vendidos: number;
  registro: string;
  score: number;
  level: string;
}

async function getLoteamentos(): Promise<Loteamento[]> {
  try {
    return await apiFetch<Loteamento[]>('/loteamentos');
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

function RegistroBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    averbado: 'bg-green-100 text-green-700',
    em_andamento: 'bg-amber-100 text-amber-700',
    pendente: 'bg-red-100 text-red-700',
  };
  const labels: Record<string, string> = {
    averbado: 'Averbado',
    em_andamento: 'Em andamento',
    pendente: 'Pendente',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {labels[status] ?? status}
    </span>
  );
}

export default async function LoteamentosPage() {
  const loteamentos = await getLoteamentos();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Loteamentos</h2>
          <p className="text-sm text-slate-500 mt-1">{loteamentos.length} loteamentos cadastrados</p>
        </div>
        <button
          type="button"
          className="px-4 py-2 bg-rose-500 text-white text-sm font-medium rounded-lg hover:bg-rose-600 transition-colors"
        >
          Novo Loteamento
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Loteamento</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Lotes</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Vendas</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Registro</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Score</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loteamentos.length > 0 ? (
              loteamentos.map((lot) => (
                <tr key={lot.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/loteamentos/${lot.id}`} className="text-sm font-medium text-slate-800 hover:text-rose-600">
                      {lot.nome}
                    </Link>
                    <div className="text-xs text-slate-400 mt-0.5">{lot.cidade}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{lot.lotes}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-1.5">
                        <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${(lot.vendidos / lot.lotes) * 100}%` }} />
                      </div>
                      <span className="text-xs text-slate-500">{lot.vendidos}/{lot.lotes}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><RegistroBadge status={lot.registro} /></td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-700">{lot.score}</td>
                  <td className="px-6 py-4"><ComplianceBadge level={lot.level} /></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                  Nenhum loteamento encontrado. Verifique a conexao com a API.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
