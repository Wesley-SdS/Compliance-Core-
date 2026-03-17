import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface Lab {
  id: string;
  nome: string;
  cidade: string;
  tipo: string;
  certificacao: string;
  statusCert: string;
  score: number;
  level: string;
}

async function getLabs(): Promise<Lab[]> {
  try {
    return await apiFetch<Lab[]>('/laboratorios');
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

function CertBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ativo: 'bg-green-100 text-green-700',
    vencendo: 'bg-amber-100 text-amber-700',
    expirado: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}

export default async function LaboratoriosPage() {
  const labs = await getLabs();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Laboratorios</h2>
          <p className="text-sm text-slate-500 mt-1">{labs.length} laboratorios cadastrados</p>
        </div>
        <button
          type="button"
          className="px-4 py-2 bg-violet-500 text-white text-sm font-medium rounded-lg hover:bg-violet-600 transition-colors"
        >
          Novo Laboratorio
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Laboratorio</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Tipo</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Certificacao</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status Cert.</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Score</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Compliance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {labs.length > 0 ? (
              labs.map((lab) => (
                <tr key={lab.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/laboratorios/${lab.id}`} className="text-sm font-medium text-slate-800 hover:text-violet-600">
                      {lab.nome}
                    </Link>
                    <div className="text-xs text-slate-400 mt-0.5">{lab.cidade}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{lab.tipo}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{lab.certificacao}</td>
                  <td className="px-6 py-4"><CertBadge status={lab.statusCert} /></td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-700">{lab.score}</td>
                  <td className="px-6 py-4"><ComplianceBadge level={lab.level} /></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                  Nenhum laboratorio encontrado. Verifique a conexao com a API.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
