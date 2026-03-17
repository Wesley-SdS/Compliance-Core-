import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
  ano: number;
  tipo: string;
  km: number;
  licenciamento: string;
  crlv: string;
  score: number;
  level: string;
}

async function getVeiculos(): Promise<Veiculo[]> {
  try {
    return await apiFetch<Veiculo[]>('/veiculos');
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

function DocBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    valido: 'bg-green-100 text-green-700',
    em_dia: 'bg-green-100 text-green-700',
    vencendo: 'bg-amber-100 text-amber-700',
    expirado: 'bg-red-100 text-red-700',
    vencido: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export default async function VeiculosPage() {
  const veiculos = await getVeiculos();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Veiculos</h2>
          <p className="text-sm text-slate-500 mt-1">{veiculos.length} veiculos cadastrados</p>
        </div>
        <button
          type="button"
          className="px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition-colors"
        >
          Novo Veiculo
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Veiculo</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Tipo</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">KM</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Licenciamento</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">CRLV</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Score</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {veiculos.length > 0 ? (
              veiculos.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/veiculos/${v.id}`} className="text-sm font-medium text-slate-800 hover:text-sky-600">
                      {v.placa}
                    </Link>
                    <div className="text-xs text-slate-400 mt-0.5">{v.modelo} ({v.ano})</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{v.tipo}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-mono">{v.km.toLocaleString('pt-BR')}</td>
                  <td className="px-6 py-4"><DocBadge status={v.licenciamento} /></td>
                  <td className="px-6 py-4"><DocBadge status={v.crlv} /></td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-700">{v.score}</td>
                  <td className="px-6 py-4"><ComplianceBadge level={v.level} /></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
                  Nenhum veiculo encontrado. Verifique a conexao com a API.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
