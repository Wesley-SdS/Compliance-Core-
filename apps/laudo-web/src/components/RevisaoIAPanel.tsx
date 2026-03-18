'use client';

import { useState } from 'react';
import type { AlertaIA } from '@/lib/types';

interface RevisaoIAPanelProps {
  alertas: AlertaIA[];
  isLoading: boolean;
  onAceitar: (alertaId: string) => void;
  onIgnorar: (alertaId: string) => void;
  onObservacao: (alertaId: string, obs: string) => void;
  onRevisar: () => void;
}

const tipoConfig = {
  critico: {
    icon: '\uD83D\uDD34',
    label: 'Valor Critico',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-300',
  },
  inconsistencia: {
    icon: '\uD83D\uDFE1',
    label: 'Inconsistencia',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-800 dark:text-amber-300',
  },
  sugestao: {
    icon: '\uD83D\uDD35',
    label: 'Sugestao',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-300',
  },
};

export function RevisaoIAPanel({
  alertas,
  isLoading,
  onAceitar,
  onIgnorar,
  onObservacao,
  onRevisar,
}: RevisaoIAPanelProps) {
  const [obsInputs, setObsInputs] = useState<Record<string, string>>({});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Revisao IA</h3>
        <button
          type="button"
          onClick={onRevisar}
          disabled={isLoading}
          className="px-4 py-2 bg-violet-500 text-white text-xs font-medium rounded-lg hover:bg-violet-600 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Revisando...
            </>
          ) : (
            'Revisar com IA'
          )}
        </button>
      </div>

      {isLoading && alertas.length === 0 && (
        <div className="flex flex-col items-center py-8 text-slate-400">
          <div className="w-8 h-8 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin mb-3" />
          <p className="text-sm">Analisando resultados...</p>
        </div>
      )}

      {alertas.length === 0 && !isLoading && (
        <div className="text-center py-6 text-slate-400 text-sm">
          Clique em &quot;Revisar com IA&quot; para analisar os resultados.
        </div>
      )}

      <div className="space-y-3">
        {alertas.map((alerta) => {
          const config = tipoConfig[alerta.tipo];
          return (
            <div
              key={alerta.id}
              className={`rounded-lg border p-4 ${config.bg} ${config.border} transition-all ${
                alerta.acao === 'aceitar'
                  ? 'opacity-60'
                  : alerta.acao === 'ignorar'
                  ? 'opacity-40'
                  : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">{config.icon}</span>
                <div className="flex-1">
                  <div className={`text-xs font-semibold uppercase tracking-wide ${config.text}`}>
                    {config.label}
                  </div>
                  <p className={`text-sm mt-1 ${config.text}`}>{alerta.mensagem}</p>

                  {alerta.acao === 'pendente' || !alerta.acao ? (
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => onAceitar(alerta.id)}
                        className="px-3 py-1 text-xs font-medium bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                      >
                        Aceitar sugestao
                      </button>
                      <button
                        type="button"
                        onClick={() => onIgnorar(alerta.id)}
                        className="px-3 py-1 text-xs font-medium bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                      >
                        Ignorar
                      </button>
                      <div className="flex-1 flex gap-1">
                        <input
                          type="text"
                          placeholder="Observacao..."
                          value={obsInputs[alerta.id] ?? ''}
                          onChange={(e) =>
                            setObsInputs((prev) => ({ ...prev, [alerta.id]: e.target.value }))
                          }
                          className="flex-1 px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-violet-500"
                        />
                        {obsInputs[alerta.id] && (
                          <button
                            type="button"
                            onClick={() => {
                              onObservacao(alerta.id, obsInputs[alerta.id]);
                              setObsInputs((prev) => ({ ...prev, [alerta.id]: '' }));
                            }}
                            className="px-2 py-1 text-xs font-medium bg-violet-500 text-white rounded hover:bg-violet-600"
                          >
                            Salvar
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-slate-500">
                      {alerta.acao === 'aceitar' ? 'Aceito' : 'Ignorado'}
                      {alerta.observacao && ` — ${alerta.observacao}`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
