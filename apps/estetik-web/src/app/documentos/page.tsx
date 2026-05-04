'use client';

import { useState } from 'react';
import { useClinicas, useClinicaDocuments, useUploadDocument } from '@/hooks/use-clinicas';
import { DocumentUploader } from '@compliancecore/ui';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';

const categorias = ['Todos', 'alvara', 'licenca_sanitaria', 'registro_anvisa', 'pop', 'tcle', 'contrato', 'laudo_tecnico', 'certificado_treinamento', 'pgrss', 'outro'];
const statusOptions = ['Todos', 'valido', 'vencendo', 'vencido'];

function getDocStatus(expiresAt?: string): 'valido' | 'vencendo' | 'vencido' {
  if (!expiresAt) return 'valido';
  const diff = new Date(expiresAt).getTime() - Date.now();
  const days = diff / (1000 * 60 * 60 * 24);
  if (days < 0) return 'vencido';
  if (days < 30) return 'vencendo';
  return 'valido';
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    valido: 'bg-green-100 text-green-700',
    vencendo: 'bg-amber-100 text-amber-700',
    vencido: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}

function DocumentosSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div><div className="h-8 bg-gray-200 rounded w-48" /><div className="h-4 bg-gray-200 rounded w-32 mt-2" /></div>
        <div className="h-10 bg-gray-200 rounded w-40" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}
      </div>
      <div className="h-64 bg-gray-200 rounded-xl" />
    </div>
  );
}

export default function DocumentosPage() {
  const { toast } = useToast();
  const { data: clinicasData, isLoading: loadingClinicas } = useClinicas();
  const clinicaId = clinicasData?.data?.[0]?.id;
  const { data: documents, isLoading, isError, refetch } = useClinicaDocuments(clinicaId || '');
  const uploadMutation = useUploadDocument(clinicaId || '');

  const [catFilter, setCatFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [showUploader, setShowUploader] = useState(false);

  if (isLoading || loadingClinicas) return <DocumentosSkeleton />;

  const docs = (documents || []).map((d: any) => ({
    ...d,
    computedStatus: getDocStatus(d.expiresAt),
  }));

  const filtered = docs.filter((d: any) => {
    if (catFilter !== 'Todos' && d.category !== catFilter) return false;
    if (statusFilter !== 'Todos' && d.computedStatus !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
          <p className="mt-1 text-sm text-gray-500">{docs.length} documentos cadastrados</p>
        </div>
        <button
          type="button"
          onClick={() => setShowUploader(!showUploader)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          {showUploader ? 'Fechar Upload' : 'Upload Documento'}
        </button>
      </div>

      {showUploader && clinicaId && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <DocumentUploader
            categories={['alvara', 'licenca_sanitaria', 'registro_anvisa', 'pop', 'tcle', 'contrato', 'laudo_tecnico', 'certificado_treinamento', 'pgrss', 'outro']}
            onUpload={async (file, metadata) => {
              await (uploadMutation.mutateAsync as any)({
                file,
                fileName: file.name,
                fileKey: `estetik/${clinicaId}/${Date.now()}-${file.name}`,
                fileSize: file.size,
                mimeType: file.type,
                category: metadata.category,
                expiresAt: metadata.expiresAt,
              });
              toast({ title: 'Documento enviado', description: `${file.name} foi enviado com sucesso.` });
              setShowUploader(false);
              refetch();
            }}
            maxSize={10}
            acceptedTypes={['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Categoria</label>
          <div className="flex gap-2 flex-wrap">
            {categorias.map((cat) => (
              <button key={cat} type="button" onClick={() => setCatFilter(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  cat === catFilter ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}>{cat === 'Todos' ? 'Todos' : cat.replace(/_/g, ' ')}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <div className="flex gap-2">
            {statusOptions.map((s) => (
              <button key={s} type="button" onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  s === statusFilter ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}>{s}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{docs.filter((d: any) => d.computedStatus === 'valido').length}</div>
          <div className="text-xs text-green-600 font-medium">Validos</div>
        </div>
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
          <div className="text-2xl font-bold text-amber-700">{docs.filter((d: any) => d.computedStatus === 'vencendo').length}</div>
          <div className="text-xs text-amber-600 font-medium">Vencendo</div>
        </div>
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-center">
          <div className="text-2xl font-bold text-red-700">{docs.filter((d: any) => d.computedStatus === 'vencido').length}</div>
          <div className="text-xs text-red-600 font-medium">Vencidos</div>
        </div>
      </div>

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Erro ao carregar documentos. <button onClick={() => refetch()} className="underline font-medium">Tentar novamente</button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Nome</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Categoria</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Validade</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length > 0 ? filtered.map((doc: any) => (
              <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{doc.fileName || doc.nome}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{(doc.category || doc.categoria || '').replace(/_/g, ' ')}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{doc.expiresAt ? new Date(doc.expiresAt).toLocaleDateString('pt-BR') : 'Sem validade'}</td>
                <td className="px-6 py-4"><StatusBadge status={doc.computedStatus} /></td>
              </tr>
            )) : (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">Nenhum documento encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
