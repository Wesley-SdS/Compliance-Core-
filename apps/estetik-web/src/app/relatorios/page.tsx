'use client';

import { useState } from 'react';
import { useClinicas, useClinicaScore, useClinicaDocuments, useGenerateDossier } from '@/hooks/use-clinicas';
import { DossierPreview } from '@compliancecore/ui';
import { useToast } from '@/components/ui/use-toast';

function RelatoriosSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div><div className="h-8 bg-gray-200 rounded w-48" /><div className="h-4 bg-gray-200 rounded w-64 mt-2" /></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="h-40 bg-gray-200 rounded-xl" />)}
      </div>
      <div className="h-48 bg-gray-200 rounded-xl" />
    </div>
  );
}

export default function RelatoriosPage() {
  const { toast } = useToast();
  const { data: clinicasData, isLoading: loadingClinicas } = useClinicas();
  const clinicas = clinicasData?.data || [];
  const [selectedClinicaId, setSelectedClinicaId] = useState('');

  const selectedClinica = clinicas.find((c: any) => c.id === selectedClinicaId);
  const { data: score } = useClinicaScore(selectedClinicaId);
  const { data: documents } = useClinicaDocuments(selectedClinicaId);
  const generateMutation = useGenerateDossier(selectedClinicaId);

  if (loadingClinicas) return <RelatoriosSkeleton />;

  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatorios</h1>
        <p className="mt-1 text-sm text-gray-500">Gere dossies de compliance e relatorios de auditoria por clinica.</p>
      </div>

      {/* Clinica Cards */}
      {clinicas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {clinicas.slice(0, 6).map((clinica: any) => (
            <button key={clinica.id} type="button" onClick={() => setSelectedClinicaId(clinica.id)}
              className={`text-left rounded-xl border p-6 shadow-sm transition-colors ${
                selectedClinicaId === clinica.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-indigo-300'
              }`}>
              <h3 className="text-sm font-semibold text-gray-900">{clinica.nome}</h3>
              <p className="text-xs text-gray-500 mt-1">{clinica.cnpj}</p>
            </button>
          ))}
        </div>
      )}

      {/* Dossier Preview */}
      {selectedClinica && (
        <DossierPreview
          entityName={selectedClinica.nome}
          period={{ start: sixMonthsAgo.toISOString().split('T')[0], end: now.toISOString().split('T')[0] }}
          score={score?.overall ?? 0}
          level={score?.level ?? 'CRITICO'}
          documentCount={documents?.length ?? 0}
          eventCount={0}
          checklistCount={0}
          generating={generateMutation.isPending}
          onGenerate={async () => {
            try {
              await generateMutation.mutateAsync();
              toast({ title: 'Dossie gerado', description: `Dossie de ${selectedClinica.nome} gerado com sucesso.` });
            } catch {
              toast({ title: 'Erro', description: 'Falha ao gerar dossie.', variant: 'destructive' });
            }
          }}
        />
      )}

      {!selectedClinicaId && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500">Selecione uma clinica acima para gerar o dossie de compliance.</p>
        </div>
      )}
    </div>
  );
}
