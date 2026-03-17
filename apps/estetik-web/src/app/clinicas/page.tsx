import Link from 'next/link';
import { api } from '@/lib/api';
import type { ComplianceLevel } from '@compliancecore/shared';

interface Clinica {
  id: string;
  nome: string;
  cnpj: string;
  endereco: string;
  email?: string;
  telefone?: string;
  createdAt: string;
}

interface ClinicaWithScore extends Clinica {
  score?: number;
  level?: ComplianceLevel;
}

const LEVEL_COLORS: Record<ComplianceLevel, string> = {
  CRITICO: 'bg-red-100 text-red-800',
  ATENCAO: 'bg-amber-100 text-amber-800',
  BOM: 'bg-blue-100 text-blue-800',
  EXCELENTE: 'bg-green-100 text-green-800',
};

const LEVEL_LABELS: Record<ComplianceLevel, string> = {
  CRITICO: 'Critico',
  ATENCAO: 'Atencao',
  BOM: 'Bom',
  EXCELENTE: 'Excelente',
};

function ComplianceBadge({
  level,
  score,
}: {
  level: ComplianceLevel;
  score: number;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${LEVEL_COLORS[level]}`}
    >
      {score}% - {LEVEL_LABELS[level]}
    </span>
  );
}

async function getClinicas(): Promise<{
  data: ClinicaWithScore[];
  total: number;
}> {
  try {
    const result = await api<{ data: Clinica[]; total: number }>('/clinicas');
    const clinicasWithScores: ClinicaWithScore[] = await Promise.all(
      result.data.map(async (clinica) => {
        try {
          const score = await api<{ overall: number; level: ComplianceLevel }>(
            `/clinicas/${clinica.id}/score`,
          );
          return { ...clinica, score: score.overall, level: score.level };
        } catch {
          return { ...clinica, score: undefined, level: undefined };
        }
      }),
    );
    return { data: clinicasWithScores, total: result.total };
  } catch {
    return { data: [], total: 0 };
  }
}

export default async function ClinicasPage() {
  const { data: clinicas, total } = await getClinicas();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clinicas</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} clinicas cadastradas
          </p>
        </div>
        <Link
          href="/clinicas?action=new"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Nova Clinica
        </Link>
      </div>

      {/* Search/Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nome, CNPJ..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
          <option value="">Todos os status</option>
          <option value="EXCELENTE">Excelente</option>
          <option value="BOM">Bom</option>
          <option value="ATENCAO">Atencao</option>
          <option value="CRITICO">Critico</option>
        </select>
      </div>

      {/* Clinics List */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {clinicas.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Clinica
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  CNPJ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Compliance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Cadastro
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Acoes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clinicas.map((clinica) => (
                <tr
                  key={clinica.id}
                  className="transition-colors hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {clinica.nome}
                      </p>
                      <p className="text-xs text-gray-500">
                        {clinica.endereco}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">{clinica.cnpj}</p>
                  </td>
                  <td className="px-6 py-4">
                    {clinica.level && clinica.score !== undefined ? (
                      <ComplianceBadge
                        level={clinica.level}
                        score={clinica.score}
                      />
                    ) : (
                      <span className="text-xs text-gray-400">
                        Nao calculado
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-500">
                      {new Date(clinica.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/clinicas/${clinica.id}`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      Ver detalhes
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <p className="mt-4 text-sm font-medium text-gray-900">
              Nenhuma clinica cadastrada
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Comece cadastrando sua primeira clinica.
            </p>
            <Link
              href="/clinicas?action=new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              Nova Clinica
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
