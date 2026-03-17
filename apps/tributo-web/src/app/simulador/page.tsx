'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEmpresas, useSimular } from '@/hooks';
import { formatCurrency } from '@/lib/utils';
import { ImpactoBarChart, DistribuicaoChart, ProjecaoLineChart } from '@/components/charts';
import type { Simulacao } from '@/lib/types';

const schema = z.object({
  empresaId: z.string().min(1, 'Selecione uma empresa'),
  faturamentoBruto: z.coerce.number().min(1, 'Informe o faturamento'),
  tipoOperacao: z.enum(['VENDA_MERCADORIA', 'PRESTACAO_SERVICO', 'IMPORTACAO']),
  competencia: z.string().min(1, 'Informe a competencia'),
  aliquotaCbs: z.coerce.number().optional(),
  aliquotaIbs: z.coerce.number().optional(),
  aliquotaIs: z.coerce.number().optional(),
  creditosPis: z.coerce.number().optional(),
  creditosCofins: z.coerce.number().optional(),
  descricao: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function SimuladorPage() {
  const [result, setResult] = useState<Simulacao | null>(null);
  const { data: empresas } = useEmpresas();
  const simular = useSimular();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      faturamentoBruto: 1000000,
      tipoOperacao: 'VENDA_MERCADORIA',
      competencia: new Date().toISOString().slice(0, 7),
    },
  });

  function onSubmit(data: FormData) {
    simular.mutate(data, {
      onSuccess: (res) => setResult(res),
    });
  }

  const distribuicaoData = result
    ? [
        { name: 'CBS', value: result.cbs },
        { name: 'IBS', value: result.ibs },
        { name: 'IS', value: result.is },
      ].filter((d) => d.value > 0)
    : [];

  // LC 214/2025: transicao progressiva 2026-2033
  const transicaoPercent = [
    { ano: '2026', fator: 0.1 },
    { ano: '2027', fator: 0.2 },
    { ano: '2028', fator: 0.3 },
    { ano: '2029', fator: 0.4 },
    { ano: '2030', fator: 0.5 },
    { ano: '2031', fator: 0.6 },
    { ano: '2032', fator: 0.8 },
    { ano: '2033', fator: 1.0 },
  ];

  const cargaAtualEstimada = result ? result.faturamentoBruto * 0.2725 : 0;
  const projecaoData = result
    ? transicaoPercent.map(({ ano, fator }) => ({
        competencia: ano,
        cargaAtual: cargaAtualEstimada * (1 - fator),
        cargaNova: result.totalTributos * fator,
      }))
    : [];

  const impactoData = result
    ? [
        { tributo: 'CBS', atual: result.faturamentoBruto * 0.0925, novo: result.cbs },
        { tributo: 'IBS', atual: result.faturamentoBruto * 0.18, novo: result.ibs },
        { tributo: 'IS', atual: 0, novo: result.is },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Simulador de Reforma Tributaria</h2>
        <p className="text-sm text-slate-500 mt-1">Compare a carga tributaria atual com o novo regime (CBS/IBS/IS) — LC 214/2025</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Parametros da Simulacao</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Empresa</label>
                <select {...register('empresaId')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">Selecione...</option>
                  {empresas?.map((e) => (
                    <option key={e.id} value={e.id}>{e.razaoSocial}</option>
                  ))}
                </select>
                {errors.empresaId && <p className="text-xs text-red-500 mt-1">{errors.empresaId.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Faturamento Bruto (R$)</label>
                <input {...register('faturamentoBruto')} type="number" step="1000" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                {errors.faturamentoBruto && <p className="text-xs text-red-500 mt-1">{errors.faturamentoBruto.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de Operacao</label>
                <select {...register('tipoOperacao')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="VENDA_MERCADORIA">Venda de Mercadoria</option>
                  <option value="PRESTACAO_SERVICO">Prestacao de Servico</option>
                  <option value="IMPORTACAO">Importacao</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Competencia</label>
                <input {...register('competencia')} type="month" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>

              <details className="pt-2">
                <summary className="text-xs font-medium text-emerald-600 cursor-pointer">Aliquotas customizadas</summary>
                <div className="space-y-2 mt-3">
                  <div><label className="block text-xs text-slate-500 mb-1">CBS (%)</label><input {...register('aliquotaCbs')} type="number" step="0.01" placeholder="8.8" className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm" /></div>
                  <div><label className="block text-xs text-slate-500 mb-1">IBS (%)</label><input {...register('aliquotaIbs')} type="number" step="0.01" placeholder="17.7" className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm" /></div>
                  <div><label className="block text-xs text-slate-500 mb-1">IS (%)</label><input {...register('aliquotaIs')} type="number" step="0.01" placeholder="0" className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm" /></div>
                  <div><label className="block text-xs text-slate-500 mb-1">Creditos PIS (R$)</label><input {...register('creditosPis')} type="number" step="100" className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm" /></div>
                  <div><label className="block text-xs text-slate-500 mb-1">Creditos COFINS (R$)</label><input {...register('creditosCofins')} type="number" step="100" className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm" /></div>
                </div>
              </details>

              <button type="submit" disabled={simular.isPending} className="w-full px-4 py-2.5 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors">
                {simular.isPending ? 'Simulando...' : 'Simular'}
              </button>
              {simular.isError && <p className="text-xs text-red-500">Erro na simulacao. Verifique os dados e tente novamente.</p>}
            </form>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-8 space-y-6">
          {result ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                  <div className="text-xs text-slate-500">Faturamento</div>
                  <div className="text-lg font-bold text-slate-800 mt-1">{formatCurrency(result.faturamentoBruto)}</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                  <div className="text-xs text-slate-500">Total Tributos</div>
                  <div className="text-lg font-bold text-amber-600 mt-1">{formatCurrency(result.totalTributos)}</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                  <div className="text-xs text-slate-500">Carga Efetiva</div>
                  <div className="text-lg font-bold text-blue-600 mt-1">{(result.cargaTributariaEfetiva * 100).toFixed(2)}%</div>
                </div>
                <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 text-center">
                  <div className="text-xs text-emerald-600">Valor Liquido</div>
                  <div className="text-lg font-bold text-emerald-700 mt-1">{formatCurrency(result.valorLiquido)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="text-xs text-blue-600 font-medium">CBS</div>
                  <div className="text-xl font-bold text-blue-700 mt-1">{formatCurrency(result.cbs)}</div>
                </div>
                <div className="p-4 rounded-lg bg-violet-50 border border-violet-200">
                  <div className="text-xs text-violet-600 font-medium">IBS</div>
                  <div className="text-xl font-bold text-violet-700 mt-1">{formatCurrency(result.ibs)}</div>
                </div>
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="text-xs text-amber-600 font-medium">IS</div>
                  <div className="text-xl font-bold text-amber-700 mt-1">{formatCurrency(result.is)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="text-sm font-semibold text-slate-800 mb-4">Comparativo Atual vs Novo</h3>
                  <ImpactoBarChart data={impactoData} />
                </div>
                {distribuicaoData.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4">Distribuicao dos Tributos</h3>
                    <DistribuicaoChart data={distribuicaoData} />
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">Projecao 2026–2033</h3>
                <p className="text-xs text-slate-500 mb-4">Transicao progressiva conforme LC 214/2025 — carga atual sendo substituida pelo novo regime</p>
                <ProjecaoLineChart data={projecaoData} />
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-slate-700">Simulador de Reforma Tributaria</h3>
              <p className="text-sm text-slate-500 mt-2">Selecione uma empresa, preencha os parametros e clique em "Simular" para visualizar o impacto da reforma CBS/IBS/IS.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
