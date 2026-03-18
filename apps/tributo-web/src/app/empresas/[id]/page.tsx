'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEmpresa, useEmpresaScore, useObrigacoes, useSimulacoes, useSimular, useSpedFiles, useDecisoes, useCreateDecisao, useDocumentos, useUploadDocumento, useTimeline, useAlerts, useChecklist, useUpdateChecklist, useGenerateDossier } from '@/hooks';
import { formatCurrency, formatPercent, formatCNPJ, formatDate, formatDateTime, scoreLevelColor, scoreLevelBg } from '@/lib/utils';
import { ImpactoBarChart, ProjecaoLineChart, DistribuicaoChart } from '@/components/charts';
import { ScoreGauge, AuditTimeline, DocumentUploader, DossierPreview, AlertBanner, ComplianceBadge, ChecklistForm } from '@compliancecore/ui';
import type { ComplianceLevel, ScoreTrend } from '@compliancecore/shared';
import type { Simulacao, TipoOperacao } from '@/lib/types';

const TRIBUTO_DOC_CATEGORIES = ['certidao_negativa', 'sped_fiscal', 'sped_contabil', 'procuracao', 'contrato_servico', 'darf', 'guia_recolhimento', 'balancete'];

const tabs = ['Visao Geral', 'Simulacao', 'Obrigacoes', 'SPED', 'Score', 'Decisoes', 'Documentos', 'Alertas', 'Checklist', 'Dossie', 'Timeline'] as const;
type Tab = (typeof tabs)[number];

const simulacaoSchema = z.object({
  faturamentoBruto: z.coerce.number().min(1, 'Informe o faturamento'),
  tipoOperacao: z.enum(['VENDA_MERCADORIA', 'PRESTACAO_SERVICO', 'IMPORTACAO']),
  aliquotaCbs: z.coerce.number().optional(),
  aliquotaIbs: z.coerce.number().optional(),
  aliquotaIs: z.coerce.number().optional(),
  creditosPis: z.coerce.number().optional(),
  creditosCofins: z.coerce.number().optional(),
  competencia: z.string().min(1, 'Informe a competencia'),
  descricao: z.string().optional(),
});

type SimulacaoForm = z.infer<typeof simulacaoSchema>;

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    entregue: 'bg-green-100 text-green-700',
    pendente: 'bg-amber-100 text-amber-700',
    atrasado: 'bg-red-100 text-red-700',
    valido: 'bg-green-100 text-green-700',
    transmitido: 'bg-green-100 text-green-700',
    expirado: 'bg-red-100 text-red-700',
    PROCESSADO: 'bg-green-100 text-green-700',
    PENDENTE: 'bg-amber-100 text-amber-700',
    ERRO: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-blue-500' : value >= 40 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function EmpresaDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<Tab>('Visao Geral');
  const [selectedSim, setSelectedSim] = useState<Simulacao | null>(null);

  const [decisaoDesc, setDecisaoDesc] = useState('');
  const [decisaoFund, setDecisaoFund] = useState('');

  const { data: empresa, isLoading } = useEmpresa(id);
  const { data: score } = useEmpresaScore(id);
  const { data: obrigacoes } = useObrigacoes({ empresaId: id });
  const { data: simulacoes } = useSimulacoes(id);
  const { data: spedFiles } = useSpedFiles(id);
  const { data: decisoes } = useDecisoes(id);
  const { data: documentos } = useDocumentos(id);
  const { data: timeline } = useTimeline(id);
  const { data: alerts } = useAlerts(id);
  const { data: checklists } = useChecklist(id);

  const simular = useSimular();
  const createDecisao = useCreateDecisao();
  const uploadDocumento = useUploadDocumento();
  const updateChecklist = useUpdateChecklist();
  const generateDossier = useGenerateDossier();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SimulacaoForm>({
    resolver: zodResolver(simulacaoSchema),
    defaultValues: {
      faturamentoBruto: 1000000,
      tipoOperacao: 'VENDA_MERCADORIA',
      competencia: new Date().toISOString().slice(0, 7),
    },
  });

  function onSimular(data: SimulacaoForm) {
    simular.mutate(
      { empresaId: id, ...data },
      { onSuccess: (result) => setSelectedSim(result) },
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-slate-500">Carregando dados da empresa...</div>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-slate-500">Empresa nao encontrada ou API indisponivel.</p>
        <Link href="/empresas" className="mt-4 text-sm text-emerald-600 hover:text-emerald-700 font-medium">
          Voltar para empresas
        </Link>
      </div>
    );
  }

  const activeSim = selectedSim ?? (simulacoes && simulacoes.length > 0 ? simulacoes[0] : null);

  // Build chart data from the active simulation
  const impactoData = activeSim
    ? [
        { tributo: 'CBS', atual: 0, novo: activeSim.cbs },
        { tributo: 'IBS', atual: 0, novo: activeSim.ibs },
        { tributo: 'IS', atual: 0, novo: activeSim.is },
        { tributo: 'Creditos', atual: 0, novo: activeSim.creditosAproveitados },
      ]
    : [];

  const distribuicaoData = activeSim
    ? [
        { name: 'CBS', value: activeSim.cbs },
        { name: 'IBS', value: activeSim.ibs },
        { name: 'IS', value: activeSim.is },
      ].filter((d) => d.value > 0)
    : [];

  const projecaoData = simulacoes
    ? simulacoes
        .slice(0, 12)
        .reverse()
        .map((s) => ({
          competencia: s.competencia,
          cargaAtual: s.faturamentoBruto * 0.27,
          cargaNova: s.totalTributos,
        }))
    : [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/empresas" className="hover:text-emerald-600">Empresas</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">{empresa.razaoSocial}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">{empresa.razaoSocial}</h2>
            {empresa.nomeFantasia && <p className="text-sm text-slate-600">{empresa.nomeFantasia}</p>}
            <p className="text-sm text-slate-500 mt-1">CNPJ: {formatCNPJ(empresa.cnpj)}</p>
            <p className="text-sm text-slate-500">Regime: {empresa.regimeTributario.replace(/_/g, ' ')}</p>
          </div>
          <ScoreGauge
            score={score?.value ?? empresa.score ?? 0}
            level={(score?.level as ComplianceLevel) ?? (empresa.level as ComplianceLevel) ?? 'CRITICO'}
            size={80}
            showLabel
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <nav className="flex gap-6 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* ========== VISAO GERAL ========== */}
      {activeTab === 'Visao Geral' && (
        <div className="space-y-6">
          {alerts && alerts.length > 0 && (
            <AlertBanner alerts={alerts} onDismiss={() => {}} />
          )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Dados da Empresa</h3>
            <dl className="space-y-3">
              <div className="flex justify-between"><dt className="text-sm text-slate-500">Razao Social</dt><dd className="text-sm font-medium text-slate-700">{empresa.razaoSocial}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-slate-500">CNPJ</dt><dd className="text-sm font-medium text-slate-700 font-mono">{formatCNPJ(empresa.cnpj)}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-slate-500">Regime</dt><dd className="text-sm font-medium text-slate-700">{empresa.regimeTributario.replace(/_/g, ' ')}</dd></div>
              {empresa.cnaePrincipal && <div className="flex justify-between"><dt className="text-sm text-slate-500">CNAE</dt><dd className="text-sm font-medium text-slate-700">{empresa.cnaePrincipal}</dd></div>}
              {empresa.email && <div className="flex justify-between"><dt className="text-sm text-slate-500">Email</dt><dd className="text-sm font-medium text-slate-700">{empresa.email}</dd></div>}
              {empresa.inscricaoEstadual && <div className="flex justify-between"><dt className="text-sm text-slate-500">IE</dt><dd className="text-sm font-medium text-slate-700">{empresa.inscricaoEstadual}</dd></div>}
              {empresa.inscricaoMunicipal && <div className="flex justify-between"><dt className="text-sm text-slate-500">IM</dt><dd className="text-sm font-medium text-slate-700">{empresa.inscricaoMunicipal}</dd></div>}
            </dl>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Proximas Obrigacoes</h3>
            <div className="space-y-3">
              {obrigacoes && obrigacoes.filter((o) => o.status === 'pendente').slice(0, 5).map((obr) => (
                <div key={obr.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
                  <div>
                    <div className="text-sm font-medium text-slate-700">{obr.nome}</div>
                    <div className="text-xs text-slate-500">Competencia: {obr.competencia}</div>
                  </div>
                  <span className="text-xs text-slate-500">{formatDate(obr.vencimento)}</span>
                </div>
              ))}
              {(!obrigacoes || obrigacoes.filter((o) => o.status === 'pendente').length === 0) && (
                <p className="text-sm text-slate-500">Nenhuma obrigacao pendente.</p>
              )}
            </div>
          </div>
        </div>
        </div>
      )}

      {/* ========== SIMULACAO (Hero Feature) ========== */}
      {activeTab === 'Simulacao' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar - Parametros */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Parametros da Simulacao</h3>
              <form onSubmit={handleSubmit(onSimular)} className="space-y-3">
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
                  {errors.competencia && <p className="text-xs text-red-500 mt-1">{errors.competencia.message}</p>}
                </div>

                <details className="pt-2">
                  <summary className="text-xs font-medium text-emerald-600 cursor-pointer">Aliquotas customizadas</summary>
                  <div className="space-y-2 mt-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">CBS (%)</label>
                      <input {...register('aliquotaCbs')} type="number" step="0.01" placeholder="8.8" className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">IBS (%)</label>
                      <input {...register('aliquotaIbs')} type="number" step="0.01" placeholder="17.7" className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">IS (%)</label>
                      <input {...register('aliquotaIs')} type="number" step="0.01" placeholder="0" className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Creditos PIS (R$)</label>
                      <input {...register('creditosPis')} type="number" step="100" className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Creditos COFINS (R$)</label>
                      <input {...register('creditosCofins')} type="number" step="100" className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm" />
                    </div>
                  </div>
                </details>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Descricao (opcional)</label>
                  <input {...register('descricao')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Ex: Cenario otimista Q2" />
                </div>

                <button type="submit" disabled={simular.isPending} className="w-full px-4 py-2.5 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors">
                  {simular.isPending ? 'Simulando...' : 'Simular'}
                </button>
                {simular.isError && <p className="text-xs text-red-500">Erro na simulacao. Verifique os dados.</p>}
              </form>
            </div>

            {/* Historico */}
            {simulacoes && simulacoes.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Historico de Simulacoes</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {simulacoes.map((sim) => (
                    <button
                      key={sim.id}
                      type="button"
                      onClick={() => setSelectedSim(sim)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        activeSim?.id === sim.id ? 'border-emerald-300 bg-emerald-50' : 'border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between">
                        <span className="text-xs font-medium text-slate-700">{sim.competencia}</span>
                        <span className="text-xs text-slate-500">{formatCurrency(sim.totalTributos)}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Faturamento: {formatCurrency(sim.faturamentoBruto)} | Carga: {(sim.cargaTributariaEfetiva * 100).toFixed(1)}%
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Center - Charts & Results */}
          <div className="lg:col-span-8 space-y-6">
            {activeSim ? (
              <>
                {/* KPI Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                    <div className="text-xs text-slate-500 font-medium">Faturamento</div>
                    <div className="text-lg font-bold text-slate-800 mt-1">{formatCurrency(activeSim.faturamentoBruto)}</div>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                    <div className="text-xs text-slate-500 font-medium">Total Tributos</div>
                    <div className="text-lg font-bold text-amber-600 mt-1">{formatCurrency(activeSim.totalTributos)}</div>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                    <div className="text-xs text-slate-500 font-medium">Carga Efetiva</div>
                    <div className="text-lg font-bold text-blue-600 mt-1">{(activeSim.cargaTributariaEfetiva * 100).toFixed(2)}%</div>
                  </div>
                  <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 text-center">
                    <div className="text-xs text-emerald-600 font-medium">Valor Liquido</div>
                    <div className="text-lg font-bold text-emerald-700 mt-1">{formatCurrency(activeSim.valorLiquido)}</div>
                  </div>
                </div>

                {/* Detalhamento */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="text-sm font-semibold text-slate-800 mb-4">Detalhamento dos Tributos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="text-xs text-blue-600 font-medium">CBS</div>
                      <div className="text-xl font-bold text-blue-700 mt-1">{formatCurrency(activeSim.cbs)}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-violet-50 border border-violet-200">
                      <div className="text-xs text-violet-600 font-medium">IBS</div>
                      <div className="text-xl font-bold text-violet-700 mt-1">{formatCurrency(activeSim.ibs)}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                      <div className="text-xs text-amber-600 font-medium">IS</div>
                      <div className="text-xl font-bold text-amber-700 mt-1">{formatCurrency(activeSim.is)}</div>
                    </div>
                  </div>
                  {activeSim.creditosAproveitados > 0 && (
                    <div className="mt-4 p-4 rounded-lg bg-green-50 border border-green-200">
                      <div className="flex justify-between">
                        <span className="text-sm text-green-700 font-medium">Creditos Aproveitados</span>
                        <span className="text-sm font-bold text-green-700">{formatCurrency(activeSim.creditosAproveitados)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {distribuicaoData.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                      <h3 className="text-sm font-semibold text-slate-800 mb-4">Distribuicao dos Tributos</h3>
                      <DistribuicaoChart data={distribuicaoData} />
                    </div>
                  )}
                  {projecaoData.length > 1 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                      <h3 className="text-sm font-semibold text-slate-800 mb-4">Projecao Historica</h3>
                      <ProjecaoLineChart data={projecaoData} />
                    </div>
                  )}
                </div>

                {impactoData.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4">Impacto por Tributo</h3>
                    <ImpactoBarChart data={impactoData} />
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-semibold text-slate-700">Simulador de Reforma Tributaria</h3>
                <p className="text-sm text-slate-500 mt-2">Preencha os parametros ao lado e clique em "Simular" para ver o impacto da reforma CBS/IBS/IS nesta empresa.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== OBRIGACOES ========== */}
      {activeTab === 'Obrigacoes' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Obrigacao</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Competencia</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Vencimento</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {obrigacoes && obrigacoes.length > 0 ? obrigacoes.map((obr) => (
                <tr key={obr.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">{obr.nome}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{obr.competencia}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{formatDate(obr.vencimento)}</td>
                  <td className="px-6 py-4"><StatusBadge status={obr.status} /></td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">Nenhuma obrigacao encontrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ========== SPED ========== */}
      {activeTab === 'SPED' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Link href={`/empresas/${id}/sped/importar`} className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors">
              Importar SPED
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Tipo</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Competencia</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Arquivo</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {spedFiles && spedFiles.length > 0 ? spedFiles.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">{s.tipoSped}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{s.competencia}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-mono text-xs">{s.fileName}</td>
                    <td className="px-6 py-4"><StatusBadge status={s.status} /></td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatDate(s.createdAt)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">Nenhum arquivo SPED encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== SCORE ========== */}
      {activeTab === 'Score' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-8">
            <ScoreGauge
              score={score?.value ?? empresa.score ?? 0}
              level={(score?.level as ComplianceLevel) ?? (empresa.level as ComplianceLevel) ?? 'CRITICO'}
              trend={(score?.trend as ScoreTrend) ?? 'ESTAVEL'}
              showLabel
              size={140}
            />
            <div className="flex-1 space-y-3">
              {score?.criteria && score.criteria.length > 0 ? (
                score.criteria.map((c) => (
                  <div key={c.criterionId} className="flex items-center gap-3">
                    <div className="flex-1">
                      <ScoreBar label={c.name} value={c.score} />
                    </div>
                    <ComplianceBadge status={c.status as any} size="sm" />
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Score calculado sem detalhamento de criterios.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== DECISOES FISCAIS ========== */}
      {activeTab === 'Decisoes' && (
        <div className="space-y-4">
          {/* Form para criar decisao */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Registrar Decisao Fiscal</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Descricao</label>
                <textarea value={decisaoDesc} onChange={(e) => setDecisaoDesc(e.target.value)} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Descreva a decisao fiscal..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Fundamentacao Legal</label>
                <input value={decisaoFund} onChange={(e) => setDecisaoFund(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Ex: Art. 135, LC 214/2025" />
              </div>
              <button
                type="button"
                disabled={!decisaoDesc || !decisaoFund || createDecisao.isPending}
                onClick={() => {
                  createDecisao.mutate(
                    { empresaId: id, descricao: decisaoDesc, fundamentacaoLegal: decisaoFund, simulacaoId: activeSim?.id },
                    { onSuccess: () => { setDecisaoDesc(''); setDecisaoFund(''); } },
                  );
                }}
                className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
              >
                {createDecisao.isPending ? 'Registrando...' : 'Registrar com Assinatura Digital'}
              </button>
              {createDecisao.isError && <p className="text-xs text-red-500">Erro ao registrar decisao.</p>}
            </div>
          </div>

          {/* Lista de decisoes */}
          {decisoes && decisoes.length > 0 ? decisoes.map((dec) => (
            <div key={dec.id} className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm text-slate-700">{dec.descricao}</p>
                  <p className="text-xs text-slate-500 mt-2">Fundamentacao: {dec.fundamentacaoLegal}</p>
                </div>
                <div className="text-right ml-4">
                  <div className="text-xs text-slate-400">{formatDateTime(dec.createdAt)}</div>
                  <div className="text-xs text-slate-500 mt-1 font-mono">{dec.assinatura.slice(0, 16)}...</div>
                </div>
              </div>
            </div>
          )) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <p className="text-sm text-slate-500">Nenhuma decisao fiscal registrada.</p>
            </div>
          )}
        </div>
      )}

      {/* ========== DOCUMENTOS ========== */}
      {activeTab === 'Documentos' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Upload de Documento</h3>
            <DocumentUploader
              categories={TRIBUTO_DOC_CATEGORIES}
              onUpload={async (file, metadata) => {
                await uploadDocumento.mutateAsync({ file, empresaId: id, category: metadata.category });
              }}
              maxSize={50}
              acceptedTypes={['.pdf', '.xml', '.txt', '.jpg', '.png']}
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Documento</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Categoria</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documentos && documentos.length > 0 ? documentos.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">{doc.nome}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{doc.category}</td>
                    <td className="px-6 py-4"><StatusBadge status={doc.status} /></td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatDate(doc.createdAt)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">Nenhum documento encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== ALERTAS ========== */}
      {activeTab === 'Alertas' && (
        <div className="space-y-4">
          {alerts && alerts.length > 0 ? (
            <AlertBanner alerts={alerts} onDismiss={() => {}} />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <p className="text-sm text-slate-500">Nenhum alerta pendente para esta empresa.</p>
            </div>
          )}
        </div>
      )}

      {/* ========== CHECKLIST ========== */}
      {activeTab === 'Checklist' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          {checklists && checklists.length > 0 ? (
            <ChecklistForm
              checklist={checklists[0]}
              onSubmit={(responses) => {
                updateChecklist.mutate({
                  empresaId: id,
                  checklistId: checklists[0].id,
                  responses,
                });
              }}
            />
          ) : (
            <p className="text-sm text-slate-500">Nenhum checklist disponivel para esta empresa.</p>
          )}
        </div>
      )}

      {/* ========== DOSSIE ========== */}
      {activeTab === 'Dossie' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <DossierPreview
            entityName={empresa.razaoSocial}
            period={{ start: new Date(new Date().getFullYear(), 0, 1).toISOString(), end: new Date().toISOString() }}
            score={score?.value ?? empresa.score ?? 0}
            level={(score?.level as ComplianceLevel) ?? 'CRITICO'}
            documentCount={documentos?.length ?? 0}
            eventCount={timeline?.length ?? 0}
            checklistCount={0}
            generating={generateDossier.isPending}
            onGenerate={() => {
              generateDossier.mutate(id);
            }}
          />
        </div>
      )}

      {/* ========== TIMELINE ========== */}
      {activeTab === 'Timeline' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Historico de Eventos</h3>
          {timeline && timeline.length > 0 ? (
            <AuditTimeline events={timeline as any} maxItems={50} />
          ) : (
            <p className="text-sm text-slate-500">Nenhum evento registrado.</p>
          )}
        </div>
      )}
    </div>
  );
}
