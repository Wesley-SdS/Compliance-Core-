'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEmpresa, useOtimizarMix } from '@/hooks';
import { formatCurrency } from '@/lib/utils';
import { OtimizadorComparativo } from '@/components/charts';

export default function OtimizadorPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: empresa } = useEmpresa(id);
  const otimizar = useOtimizarMix();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href={`/empresas/${id}`} className="hover:text-emerald-600">Empresa</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Otimizador de Mix</span>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-slate-800">Otimizador de Mix Tributario</h2>
        <p className="text-sm text-slate-500 mt-1">
          {empresa ? `Analise de otimizacao para ${empresa.razaoSocial}` : 'Carregando...'}
        </p>
      </div>

      {!otimizar.data ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <h3 className="text-lg font-semibold text-slate-700">Otimizacao de Creditos Tributarios</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Analise o mix de fornecedores e regimes tributarios para maximizar creditos e reduzir a carga total.
          </p>
          <button
            type="button"
            onClick={() => otimizar.mutate(id)}
            disabled={otimizar.isPending}
            className="mt-6 px-6 py-2.5 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
          >
            {otimizar.isPending ? 'Analisando...' : 'Executar Otimizacao'}
          </button>
          {otimizar.isError && <p className="text-xs text-red-500 mt-3">Erro ao executar otimizacao.</p>}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Comparativo</h3>
            <OtimizadorComparativo result={otimizar.data} />
          </div>

          {otimizar.data.recomendacoes.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Recomendacoes</h3>
              <div className="space-y-3">
                {otimizar.data.recomendacoes.map((rec, i) => (
                  <div key={i} className="p-4 rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-slate-700">{rec.fornecedor}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {rec.regimeAtual} &rarr; {rec.regimeRecomendado}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-emerald-600">
                        {formatCurrency(rec.economiaEstimada)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
