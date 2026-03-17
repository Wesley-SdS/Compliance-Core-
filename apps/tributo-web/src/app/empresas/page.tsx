import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  regime: string;
  score: number;
  level: string;
  cidade: string;
}

const regimes = ['Todos', 'Simples Nacional', 'Lucro Presumido', 'Lucro Real'];

async function getEmpresas(): Promise<Empresa[]> {
  try {
    return await apiFetch<Empresa[]>('/empresas');
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

export default async function EmpresasPage() {
  const empresas = await getEmpresas();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Empresas</h2>
          <p className="text-sm text-slate-500 mt-1">{empresas.length} empresas cadastradas</p>
        </div>
        <button
          type="button"
          className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors"
        >
          Nova Empresa
        </button>
      </div>

      {/* Filtro por regime */}
      <div className="flex gap-2">
        {regimes.map((regime) => (
          <button
            key={regime}
            type="button"
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              regime === 'Todos'
                ? 'bg-emerald-500 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {regime}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Empresa</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">CNPJ</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Regime</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Score</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Cidade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {empresas.length > 0 ? (
              empresas.map((empresa) => (
                <tr key={empresa.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/empresas/${empresa.id}`} className="text-sm font-medium text-slate-800 hover:text-emerald-600">
                      {empresa.nome}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-mono">{empresa.cnpj}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{empresa.regime}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-700">{empresa.score}</span>
                  </td>
                  <td className="px-6 py-4">
                    <ComplianceBadge level={empresa.level} />
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{empresa.cidade}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                  Nenhuma empresa encontrada. Verifique a conexao com a API.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
