'use client';

import { useState } from 'react';
import { useObras, useObraMateriais } from '@/hooks/use-obras';
import { Skeleton } from '@/components/ui/skeleton';

function MateriaisSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-10 w-48 rounded-lg" />
      </div>
      <Skeleton className="h-10 w-64 rounded-lg" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    disponivel: 'bg-green-100 text-green-700',
    em_uso: 'bg-blue-100 text-blue-700',
    esgotado: 'bg-red-100 text-red-700',
    pendente: 'bg-amber-100 text-amber-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}

export default function MateriaisPage() {
  const [selectedObraId, setSelectedObraId] = useState<string>('');
  const [search, setSearch] = useState('');

  const { data: obras, isLoading: obrasLoading } = useObras();
  const { data: materiais, isLoading: materiaisLoading } = useObraMateriais(selectedObraId);

  // Auto-select first obra
  if (!selectedObraId && obras && obras.length > 0) {
    setSelectedObraId(obras[0].id);
  }

  const allMateriais = materiais ?? [];
  const filtered = allMateriais.filter((m: any) =>
    m.nome?.toLowerCase().includes(search.toLowerCase()) ||
    m.fornecedor?.toLowerCase().includes(search.toLowerCase())
  );

  if (obrasLoading) return <MateriaisSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Materiais</h2>
          <p className="text-sm text-slate-500 mt-1">Controle de materiais e notas fiscais</p>
        </div>

        <select
          value={selectedObraId}
          onChange={(e) => setSelectedObraId(e.target.value)}
          className="px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">Selecione uma obra</option>
          {(obras ?? []).map((obra: any) => (
            <option key={obra.id} value={obra.id}>
              {obra.nome}
            </option>
          ))}
        </select>
      </div>

      {selectedObraId && (
        <>
          <input
            type="text"
            placeholder="Buscar material ou fornecedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />

          {materiaisLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Material</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Quantidade</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Unidade</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Fornecedor</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Nota Fiscal</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length > 0 ? (
                    filtered.map((mat: any) => (
                      <tr key={mat.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-800">{mat.nome}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{mat.quantidade}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{mat.unidade}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{mat.fornecedor ?? '-'}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{mat.notaFiscalRef ?? '-'}</td>
                        <td className="px-6 py-4">{statusBadge(mat.status)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                        Nenhum material encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {!selectedObraId && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-sm text-slate-500">Selecione uma obra para visualizar os materiais.</p>
        </div>
      )}
    </div>
  );
}
