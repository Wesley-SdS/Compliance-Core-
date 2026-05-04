'use client';

import { useState } from 'react';
import { useObras, useObraDocuments, useUploadDocument } from '@/hooks/use-obras';
import { DocumentUploader } from '@compliancecore/ui';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';

const DOCUMENT_CATEGORIES = [
  'alvara',
  'art_rrt',
  'licenca_ambiental',
  'seguro',
  'nr_treinamento',
  'diario_obra',
  'epi_registro',
  'pcmso_ppra',
  'crea_registro',
  'projeto_aprovado',
  'habite_se',
  'outro',
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  alvara: 'Alvara',
  art_rrt: 'ART/RRT',
  licenca_ambiental: 'Licenca Ambiental',
  seguro: 'Seguro',
  nr_treinamento: 'NR Treinamento',
  diario_obra: 'Diario de Obra',
  epi_registro: 'Registro EPI',
  pcmso_ppra: 'PCMSO/PPRA',
  crea_registro: 'Registro CREA',
  projeto_aprovado: 'Projeto Aprovado',
  habite_se: 'Habite-se',
  outro: 'Outro',
};

function statusStyle(status: string) {
  const styles: Record<string, string> = {
    valido: 'bg-green-100 text-green-700',
    pendente: 'bg-amber-100 text-amber-700',
    expirado: 'bg-red-100 text-red-700',
    vencendo: 'bg-orange-100 text-orange-700',
  };
  return styles[status] ?? 'bg-slate-100 text-slate-700';
}

function DocumentosSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-48 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

export default function DocumentosPage() {
  const [selectedObraId, setSelectedObraId] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');

  const { data: obras, isLoading: obrasLoading } = useObras();
  const { data: docs, isLoading: docsLoading } = useObraDocuments(selectedObraId);
  const uploadDocument = useUploadDocument(selectedObraId);

  // Auto-select first obra
  if (!selectedObraId && obras && obras.length > 0) {
    setSelectedObraId(obras[0].id);
  }

  const allDocs = docs ?? [];
  const filtered = allDocs.filter((d: any) => {
    if (categoryFilter !== 'Todos' && d.category !== categoryFilter) return false;
    if (statusFilter !== 'Todos' && d.status !== statusFilter) return false;
    return true;
  });

  const validCount = allDocs.filter((d: any) => d.status === 'valido').length;
  const expiringCount = allDocs.filter((d: any) => d.status === 'vencendo').length;
  const expiredCount = allDocs.filter((d: any) => d.status === 'expirado').length;

  async function handleUpload(data: any) {
    try {
      await uploadDocument.mutateAsync(data);
      toast({ title: 'Documento enviado', description: 'O documento foi salvo com sucesso.' });
    } catch {
      toast({ title: 'Erro ao enviar', description: 'Nao foi possivel enviar o documento.', variant: 'destructive' });
    }
  }

  if (obrasLoading) return <DocumentosSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Documentos</h2>
          <p className="text-sm text-slate-500 mt-1">Gestao de documentos de compliance</p>
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
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-green-200 p-5">
              <div className="text-sm text-green-600 font-medium">Validos</div>
              <div className="text-3xl font-bold text-green-700 mt-1">{validCount}</div>
              <div className="text-xs text-green-400 mt-1">documentos em dia</div>
            </div>
            <div className="bg-white rounded-xl border border-orange-200 p-5">
              <div className="text-sm text-orange-600 font-medium">Vencendo</div>
              <div className="text-3xl font-bold text-orange-700 mt-1">{expiringCount}</div>
              <div className="text-xs text-orange-400 mt-1">proximos ao vencimento</div>
            </div>
            <div className="bg-white rounded-xl border border-red-200 p-5">
              <div className="text-sm text-red-600 font-medium">Vencidos</div>
              <div className="text-3xl font-bold text-red-700 mt-1">{expiredCount}</div>
              <div className="text-xs text-red-400 mt-1">requerem renovacao</div>
            </div>
          </div>

          {/* Upload */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Enviar Documento</h3>
            <DocumentUploader
              categories={[...DOCUMENT_CATEGORIES]}
              onUpload={handleUpload}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="Todos">Todas as categorias</option>
              {DOCUMENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="Todos">Todos os status</option>
              <option value="valido">Valido</option>
              <option value="vencendo">Vencendo</option>
              <option value="expirado">Expirado</option>
              <option value="pendente">Pendente</option>
            </select>
          </div>

          {/* Document table */}
          {docsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Documento</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Categoria</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Vencimento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length > 0 ? (
                    filtered.map((doc: any) => (
                      <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-800">{doc.nome}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {CATEGORY_LABELS[doc.category] ?? doc.category}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle(doc.status)}`}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">{doc.vencimento ?? '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">
                        Nenhum documento encontrado.
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
          <p className="text-sm text-slate-500">Selecione uma obra para visualizar os documentos.</p>
        </div>
      )}
    </div>
  );
}
