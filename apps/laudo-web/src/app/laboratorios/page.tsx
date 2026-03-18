'use client';

import Link from 'next/link';
import { ComplianceBadge } from '@compliancecore/ui';
import { useLaboratorios } from '@/hooks/use-laboratorio';

export default function LaboratoriosPage() {
  const { data: labs, isLoading } = useLaboratorios();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Laboratorios</h2>
          <p className="text-sm text-slate-500 mt-1">{labs?.length ?? 0} laboratorios cadastrados</p>
        </div>
        <button
          type="button"
          className="px-4 py-2 bg-violet-500 text-white text-sm font-medium rounded-lg hover:bg-violet-600 transition-colors"
        >
          Novo Laboratorio
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="animate-pulse p-6 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-200 dark:bg-slate-700 rounded" />
            ))}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Laboratorio</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Tipo</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Responsavel</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {(labs ?? []).length > 0 ? (
                (labs ?? []).map((lab) => (
                  <tr key={lab.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/laboratorios/${lab.id}`} className="text-sm font-medium text-slate-800 dark:text-slate-200 hover:text-violet-600">
                        {lab.nome}
                      </Link>
                      <div className="text-xs text-slate-400 mt-0.5">{lab.cnpj}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{lab.tipo_laboratorio}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{lab.responsavel_tecnico}</td>
                    <td className="px-6 py-4">
                      <ComplianceBadge status={lab.level === 'EXCELENTE' || lab.level === 'BOM' ? 'CONFORME' : lab.level === 'ATENCAO' ? 'PARCIAL' : 'NAO_CONFORME'} size="sm" />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">
                    Nenhum laboratorio encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
