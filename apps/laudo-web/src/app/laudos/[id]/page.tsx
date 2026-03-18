'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ComplianceBadge } from '@compliancecore/ui';
import { AuditTimeline } from '@compliancecore/ui';
import { useLaudo, useUpdateLaudo, useRevisaoIA, useLiberarLaudo, useLaudoHistorico, useAlertaIAAction } from '@/hooks/use-laudos';
import { ResultadosTable } from '@/components/ResultadosTable';
import { RevisaoIAPanel } from '@/components/RevisaoIAPanel';
import { useLaudoEditorStore } from '@/lib/store';
import type { Resultado, AlertaIA, StatusLaudo } from '@/lib/types';

const statusBadgeMap: Record<string, 'PARCIAL' | 'NAO_CONFORME' | 'CONFORME' | 'NAO_APLICAVEL'> = {
  RASCUNHO: 'NAO_APLICAVEL',
  EM_REVISAO: 'PARCIAL',
  REVISADO: 'PARCIAL',
  LIBERADO: 'CONFORME',
};

const statusLabels: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  EM_REVISAO: 'Em Revisao',
  REVISADO: 'Revisado',
  LIBERADO: 'Liberado',
};

export default function LaudoEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: laudo, isLoading: loadingLaudo } = useLaudo(id);
  const { data: historico } = useLaudoHistorico(id);
  const updateMutation = useUpdateLaudo();
  const revisaoMutation = useRevisaoIA();
  const liberarMutation = useLiberarLaudo();
  const alertaActionMutation = useAlertaIAAction();
  const { isDirty, setDirty, isReviewing, setReviewing } = useLaudoEditorStore();

  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [observacoes, setObservacoes] = useState('');
  const [alertasIA, setAlertasIA] = useState<AlertaIA[]>([]);
  const [showLiberar, setShowLiberar] = useState(false);
  const [visibleAlertCount, setVisibleAlertCount] = useState(0);

  // Progressive alert animation
  useEffect(() => {
    if (alertasIA.length === 0) { setVisibleAlertCount(0); return; }
    setVisibleAlertCount(0);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleAlertCount(i);
      if (i >= alertasIA.length) clearInterval(interval);
    }, 400);
    return () => clearInterval(interval);
  }, [alertasIA]);

  // Initialize from server data
  useEffect(() => {
    if (laudo) {
      setResultados(laudo.resultados ?? []);
      setObservacoes(laudo.observacoes ?? '');
    }
  }, [laudo]);

  const handleResultadosChange = useCallback((updated: Resultado[]) => {
    setResultados(updated);
    setDirty(true);
  }, [setDirty]);

  const handleFieldEdit = useCallback(
    (analito: string, field: string, oldValue: string, newValue: string) => {
      // Auto-save debounced changes
      updateMutation.mutate({
        id,
        resultados: resultados.map((r) =>
          r.analito === analito ? { ...r, [field]: newValue } : r,
        ),
      });
      setDirty(false);
    },
    [id, resultados, updateMutation, setDirty],
  );

  const handleSaveRascunho = () => {
    updateMutation.mutate({ id, observacoes, resultado: JSON.stringify(resultados) });
    setDirty(false);
  };

  const handleRevisarIA = async () => {
    setReviewing(true);
    try {
      const result = await revisaoMutation.mutateAsync(id);
      // Transform AI review into alerts
      const newAlertas: AlertaIA[] = (result.alertas ?? []).map((a: AlertaIA, i: number) => ({
        id: a.id ?? `alerta-${i}`,
        tipo: a.tipo,
        mensagem: a.mensagem,
        analito: a.analito,
        acao: 'pendente',
      }));
      setAlertasIA(newAlertas);
    } catch {
      // Error handled by mutation
    } finally {
      setReviewing(false);
    }
  };

  const handleAceitarAlerta = (alertaId: string) => {
    setAlertasIA((prev) =>
      prev.map((a) => (a.id === alertaId ? { ...a, acao: 'aceitar' as const } : a)),
    );
    const alerta = alertasIA.find(a => a.id === alertaId);
    alertaActionMutation.mutate({ laudoId: id, alertaId, acao: 'aceitar', analito: alerta?.analito });
  };

  const handleIgnorarAlerta = (alertaId: string) => {
    setAlertasIA((prev) =>
      prev.map((a) => (a.id === alertaId ? { ...a, acao: 'ignorar' as const } : a)),
    );
    const alerta = alertasIA.find(a => a.id === alertaId);
    alertaActionMutation.mutate({ laudoId: id, alertaId, acao: 'ignorar', analito: alerta?.analito });
  };

  const handleObservacaoAlerta = (alertaId: string, obs: string) => {
    setAlertasIA((prev) =>
      prev.map((a) => (a.id === alertaId ? { ...a, observacao: obs } : a)),
    );
  };

  const handleLiberar = async () => {
    await liberarMutation.mutateAsync(id);
    setShowLiberar(false);
    router.refresh();
  };

  if (loadingLaudo) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="grid grid-cols-3 gap-6">
          <div className="h-96 bg-slate-200 rounded-xl" />
          <div className="col-span-2 h-96 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!laudo) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Laudo nao encontrado.</p>
        <Link href="/laudos" className="text-violet-600 text-sm mt-2 inline-block">Voltar</Link>
      </div>
    );
  }

  const isLiberado = laudo.status === 'LIBERADO';

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/laudos" className="hover:text-violet-600">Laudos</Link>
        <span>/</span>
        <span className="text-slate-800 dark:text-slate-200 font-medium">{laudo.tipo_exame}</span>
      </div>

      <div className="flex gap-6">
        {/* Sidebar esquerda (35%) */}
        <div className="w-[35%] space-y-4">
          {/* Paciente */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Dados do Paciente</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Nome</dt>
                <dd className="font-medium text-slate-700 dark:text-slate-300">{laudo.paciente?.nome ?? '--'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">CPF</dt>
                <dd className="font-medium text-slate-700 dark:text-slate-300">{laudo.paciente?.cpf ?? '--'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Nascimento</dt>
                <dd className="font-medium text-slate-700 dark:text-slate-300">{laudo.paciente?.dataNascimento ? new Date(laudo.paciente.dataNascimento).toLocaleDateString('pt-BR') : '--'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Sexo</dt>
                <dd className="font-medium text-slate-700 dark:text-slate-300">{laudo.paciente?.sexo === 'M' ? 'Masculino' : laudo.paciente?.sexo === 'F' ? 'Feminino' : '--'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Medico</dt>
                <dd className="font-medium text-slate-700 dark:text-slate-300">{laudo.paciente?.medicoSolicitante ?? '--'}</dd>
              </div>
            </dl>
          </div>

          {/* Exame info */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Exame</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Tipo</dt>
                <dd className="font-medium text-slate-700 dark:text-slate-300">{laudo.tipo_exame}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Material</dt>
                <dd className="font-medium text-slate-700 dark:text-slate-300">{laudo.material_biologico}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Data Coleta</dt>
                <dd className="font-medium text-slate-700 dark:text-slate-300">{laudo.data_coleta ? new Date(laudo.data_coleta).toLocaleDateString('pt-BR') : '--'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Equipamento</dt>
                <dd className="font-medium text-slate-700 dark:text-slate-300">
                  {laudo.equipamento?.nome ?? '--'}
                  {laudo.equipamento && (
                    <span className={`ml-1 text-xs ${laudo.equipamento.calibracao_valida ? 'text-green-600' : 'text-red-600'}`}>
                      {laudo.equipamento.calibracao_valida ? '(Calibrado)' : '(Vencido)'}
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {/* Status */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Status</h3>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                laudo.status === 'LIBERADO'
                  ? 'bg-green-100 text-green-700'
                  : laudo.status === 'EM_REVISAO' || laudo.status === 'REVISADO'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-700'
              }`}>
                {statusLabels[laudo.status] ?? laudo.status}
              </span>
              <ComplianceBadge status={statusBadgeMap[laudo.status] ?? 'NAO_APLICAVEL'} size="sm" />
            </div>
            {laudo.bioquimico_responsavel && (
              <p className="text-xs text-slate-500 mt-2">Bioquimico: {laudo.bioquimico_responsavel}</p>
            )}
            {laudo.data_liberacao && (
              <p className="text-xs text-slate-500 mt-1">Liberado em: {new Date(laudo.data_liberacao).toLocaleDateString('pt-BR')}</p>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {!isLiberado && (
              <>
                <button
                  type="button"
                  onClick={handleSaveRascunho}
                  disabled={updateMutation.isPending}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                >
                  {updateMutation.isPending ? 'Salvando...' : 'Salvar Rascunho'}
                </button>
                <button
                  type="button"
                  onClick={handleRevisarIA}
                  disabled={isReviewing}
                  className="w-full px-4 py-2.5 bg-violet-500 text-white text-sm font-medium rounded-lg hover:bg-violet-600 disabled:opacity-50 transition-colors"
                >
                  {isReviewing ? 'Revisando...' : 'Enviar para Revisao IA'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLiberar(true)}
                  className="w-full px-4 py-2.5 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
                >
                  Liberar Laudo
                </button>
              </>
            )}
            <Link
              href={`/laudos/${id}/pdf`}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors inline-flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 12h.008v.008h-.008V12zm-2.25 0h.008v.008H16.5V12z" />
              </svg>
              {isLiberado ? 'Download PDF' : 'Preview PDF'}
            </Link>
          </div>
        </div>

        {/* Centro (65%) */}
        <div className="flex-1 space-y-6">
          {/* Resultados */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">Resultados</h3>
            {resultados.length > 0 ? (
              <ResultadosTable
                resultados={resultados}
                onChange={handleResultadosChange}
                onFieldEdit={handleFieldEdit}
                readOnly={isLiberado}
              />
            ) : (
              <p className="text-sm text-slate-400 text-center py-6">Nenhum resultado registrado.</p>
            )}
          </div>

          {/* Revisao IA */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <RevisaoIAPanel
              alertas={alertasIA.slice(0, visibleAlertCount)}
              isLoading={isReviewing}
              onAceitar={handleAceitarAlerta}
              onIgnorar={handleIgnorarAlerta}
              onObservacao={handleObservacaoAlerta}
              onRevisar={handleRevisarIA}
            />
          </div>

          {/* Observacoes */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Observacoes</h3>
            <textarea
              value={observacoes}
              onChange={(e) => {
                setObservacoes(e.target.value);
                setDirty(true);
              }}
              readOnly={isLiberado}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              placeholder="Observacoes do bioquimico..."
            />
          </div>

          {/* Historico do laudo */}
          {historico && historico.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">Historico do Laudo</h3>
              <AuditTimeline
                events={historico.map((e) => ({
                  ...e,
                  timestamp: new Date(e.timestamp),
                }))}
                maxItems={20}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modal Liberar */}
      {showLiberar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Liberar Laudo</h3>
            <p className="text-sm text-slate-500 mt-2">
              Ao liberar, o laudo sera assinado digitalmente e disponibilizado ao paciente.
              Esta acao nao pode ser desfeita.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowLiberar(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleLiberar}
                disabled={liberarMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                {liberarMutation.isPending ? 'Liberando...' : 'Confirmar Liberacao'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
