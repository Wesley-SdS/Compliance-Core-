'use client';

import { useState } from 'react';
import { useObras, useObraRelatorio, useGenerateDossier } from '@/hooks/use-obras';
import { DossierPreview } from '@compliancecore/ui';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';

function RelatoriosSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-4 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}

function ObraCard({ obra, selected, onSelect }: { obra: any; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left p-5 rounded-xl border transition-colors ${
        selected
          ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-500/20'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="text-sm font-medium text-slate-800">{obra.nome}</div>
      <div className="text-xs text-slate-500 mt-1">{obra.endereco}</div>
      <div className="flex items-center gap-3 mt-3">
        <div className="w-full bg-slate-100 rounded-full h-1.5">
          <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${obra.progresso}%` }} />
        </div>
        <span className="text-xs text-slate-500 whitespace-nowrap">{obra.progresso}%</span>
      </div>
    </button>
  );
}

function ObraReport({ obraId }: { obraId: string }) {
  const { data: relatorio, isLoading } = useObraRelatorio(obraId);
  const generateDossier = useGenerateDossier(obraId);

  async function handleGenerate() {
    try {
      await generateDossier.mutateAsync();
      toast({ title: 'Dossie gerado', description: 'O dossie de compliance foi gerado com sucesso.' });
    } catch {
      toast({ title: 'Erro ao gerar dossie', description: 'Tente novamente mais tarde.', variant: 'destructive' });
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const score = relatorio?.compliance;
  const docs = relatorio?.documents ?? [];
  const financeiro = relatorio?.financeiro;

  return (
    <div className="space-y-6">
      {/* Financial Summary */}
      {financeiro && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Resumo Financeiro</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-slate-500">Orcamento</div>
              <div className="text-lg font-semibold text-slate-800">
                R$ {Number(financeiro.orcamentoTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Gasto Atual</div>
              <div className="text-lg font-semibold text-slate-800">
                R$ {Number(financeiro.gastoAtual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Saldo</div>
              <div className={`text-lg font-semibold ${financeiro.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                R$ {Number(financeiro.saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Consumido</div>
              <div className="text-lg font-semibold text-slate-800">{financeiro.percentGasto}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Score Summary */}
      {score && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Score de Compliance</h3>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">{score.overall}</div>
              <div className="text-sm font-medium text-blue-600 mt-1">{score.level}</div>
              <div className="text-xs text-slate-400 mt-1">{score.trend}</div>
            </div>
            {score.breakdown && (
              <div className="flex-1 space-y-3">
                {Object.entries(score.breakdown).map(([key, value]: [string, any]) => (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600 capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="font-medium">{value?.score ?? value}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${Number(value?.score ?? value) >= 80 ? 'bg-green-500' : Number(value?.score ?? value) >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${value?.score ?? value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dossier Preview */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800">Dossie de Compliance</h3>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generateDossier.isPending}
            className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            {generateDossier.isPending ? 'Gerando...' : 'Gerar Dossie'}
          </button>
        </div>

        <DossierPreview
          entityName="Obra"
          period={{ start: new Date().toISOString(), end: new Date().toISOString() }}
          score={score?.overall ?? 0}
          level={score?.level ?? 'CRITICO'}
          documentCount={docs.length}
          eventCount={0}
          checklistCount={0}
          onGenerate={handleGenerate}
          generating={generateDossier.isPending}
        />
      </div>
    </div>
  );
}

export default function RelatoriosPage() {
  const [selectedObraId, setSelectedObraId] = useState<string>('');
  const { data: obras, isLoading } = useObras();

  if (isLoading) return <RelatoriosSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Relatorios</h2>
        <p className="text-sm text-slate-500 mt-1">Gere dossies e relatorios de compliance</p>
      </div>

      {/* Obra selector cards */}
      <div>
        <h3 className="text-sm font-medium text-slate-700 mb-3">Selecione uma obra</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(obras ?? []).map((obra: any) => (
            <ObraCard
              key={obra.id}
              obra={obra}
              selected={selectedObraId === obra.id}
              onSelect={() => setSelectedObraId(obra.id)}
            />
          ))}
        </div>
      </div>

      {selectedObraId ? (
        <ObraReport obraId={selectedObraId} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-sm text-slate-500">Selecione uma obra para gerar relatorios.</p>
        </div>
      )}
    </div>
  );
}
