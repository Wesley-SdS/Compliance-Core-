'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ComplianceBadge, AuditTimeline, DocumentUploader } from '@compliancecore/ui';
import { useEquipamento, useCalibracoes } from '@/hooks/use-equipamentos';
import { apiFetch } from '@/lib/api';

export default function EquipamentoDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: eq, isLoading } = useEquipamento(id);
  const { data: calibracoes } = useCalibracoes(id);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="h-64 bg-slate-200 rounded-xl" />
        <div className="h-48 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (!eq) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Equipamento nao encontrado.</p>
        <Link href="/equipamentos" className="text-violet-600 text-sm mt-2 inline-block">Voltar</Link>
      </div>
    );
  }

  const diasAte = Math.ceil((new Date(eq.proxima_calibracao).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/equipamentos" className="hover:text-violet-600">Equipamentos</Link>
        <span>/</span>
        <span className="text-slate-800 dark:text-slate-200 font-medium">{eq.nome}</span>
      </div>

      {/* Info card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">{eq.nome}</h2>
            <p className="text-sm text-slate-500 mt-1">{eq.fabricante} — {eq.modelo}</p>
          </div>
          <ComplianceBadge status={eq.calibracao_valida ? 'CONFORME' : 'NAO_CONFORME'} size="lg" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div>
            <p className="text-xs text-slate-500">Numero de Serie</p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{eq.numero_serie}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Data Aquisicao</p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{new Date(eq.data_aquisicao).toLocaleDateString('pt-BR')}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Proxima Calibracao</p>
            <p className={`text-sm font-medium ${diasAte < 0 ? 'text-red-600' : diasAte <= 30 ? 'text-amber-600' : 'text-green-600'}`}>
              {new Date(eq.proxima_calibracao).toLocaleDateString('pt-BR')}
              <span className="ml-1 text-xs">({diasAte < 0 ? `vencida ha ${Math.abs(diasAte)}d` : `em ${diasAte}d`})</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Rastreabilidade</p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{eq.rastreabilidade ? 'Sim' : 'Nao'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Historico calibracoes */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">Historico de Calibracoes</h3>
          {(calibracoes ?? []).length > 0 ? (
            <div className="space-y-3">
              {(calibracoes ?? []).map((cal) => (
                <div key={cal.id} className="p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {new Date(cal.data_calibracao).toLocaleDateString('pt-BR')}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      cal.resultado === 'APROVADO' ? 'bg-green-100 text-green-700' :
                      cal.resultado === 'REPROVADO' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {cal.resultado}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Lab: {cal.laboratorio_calibrador} | Cert: {cal.certificado_numero}</p>
                  {cal.observacoes && <p className="text-xs text-slate-400 mt-1">{cal.observacoes}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Nenhuma calibracao registrada.</p>
          )}
        </div>

        {/* Upload certificado */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">Certificados</h3>
          <DocumentUploader
            categories={['Certificado de Calibracao', 'Laudo de Manutencao', 'Manual Tecnico']}
            onUpload={async (file, metadata) => {
              const formData = new FormData();
              formData.append('file', file);
              formData.append('category', metadata.category);
              if (metadata.expiresAt) formData.append('expiresAt', metadata.expiresAt);
              await apiFetch(`/equipamentos/${id}/documents`, {
                method: 'POST',
                body: JSON.stringify({ fileName: file.name, content: '', category: metadata.category }),
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}
