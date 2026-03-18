'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  useLoteamento, useLoteamentoScore, useLotes, useContratos, useCompradores,
  useInfraestrutura, useAprovacoes, useFinanceiro, useDocumentos, useDossier,
  useTimeline, useAlertas, useUpdateInfraestrutura, useCreateAprovacao,
  useUpdateAprovacao, useUploadDocumento,
} from '@/hooks/use-api';
import { ScoreGauge, ComplianceBadge, AlertBanner, AuditTimeline, DocumentUploader, DossierPreview } from '@compliancecore/ui';
import { MapaLotes } from '@/components/MapaLotes';
import { ParcelasTable } from '@/components/ParcelasTable';
import { InfraestruturaProgress } from '@/components/InfraestruturaProgress';
import { ContratoCard } from '@/components/ContratoCard';
import { formatCurrency, formatDate, formatArea, formatPercent, formatCPF } from '@/lib/format';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const TABS = [
  'Compliance', 'Mapa de Lotes', 'Lotes', 'Contratos', 'Compradores',
  'Infraestrutura', 'Aprovações', 'Financeiro', 'Documentos', 'Dossiê', 'Atividade',
] as const;
type Tab = (typeof TABS)[number];

const DOC_CATEGORIES = [
  'registro_loteamento', 'matricula_mae', 'licenca_ambiental', 'aprovacao_prefeitura',
  'contrato_compra_venda', 'escritura', 'dimob', 'efd_reinf', 'planta_loteamento',
  'memorial_descritivo', 'termo_consentimento_lgpd',
];

const STATUS_BADGE: Record<string, string> = {
  CONFORME: 'CONFORME', NAO_CONFORME: 'NAO_CONFORME', PARCIAL: 'PARCIAL', NAO_APLICAVEL: 'NAO_APLICAVEL',
};

export default function LoteamentoDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<Tab>('Compliance');

  const { data: loteamento, isLoading } = useLoteamento(id);
  const { data: score } = useLoteamentoScore(id);
  const { data: lotes } = useLotes(id);
  const { data: contratos } = useContratos(id);
  const { data: compradores } = useCompradores(id);
  const { data: infraestrutura } = useInfraestrutura(id);
  const { data: aprovacoes } = useAprovacoes(id);
  const { data: financeiro } = useFinanceiro(id);
  const { data: documentos } = useDocumentos(id);
  const { data: dossier } = useDossier(id);
  const { data: timelineData } = useTimeline(id);
  const { data: alertas } = useAlertas(id);

  const updateInfra = useUpdateInfraestrutura();
  const uploadDoc = useUploadDocumento(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded" />
        <div className="h-40 bg-slate-100 animate-pulse rounded-xl" />
        <div className="h-10 bg-slate-100 animate-pulse rounded" />
      </div>
    );
  }

  if (!loteamento) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-slate-500">Loteamento não encontrado.</p>
        <Link href="/loteamentos" className="mt-4 text-sm text-rose-600 hover:text-rose-700 font-medium">
          Voltar para loteamentos
        </Link>
      </div>
    );
  }

  const scoreLevel = (score?.level ?? 'CRITICO') as any;
  const scoreTrend = (score?.trend ?? 'ESTAVEL') as any;
  const criteria = score?.criteria ?? [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/loteamentos" className="hover:text-rose-600">Loteamentos</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">{loteamento.nome}</span>
      </div>

      {/* Alerts */}
      {alertas && alertas.length > 0 && (
        <AlertBanner alerts={alertas.map((a: any) => ({
          id: a.id,
          title: a.title ?? a.type,
          message: a.message ?? a.description,
          dueDate: a.due_date,
          daysUntilDue: Math.ceil((new Date(a.due_date).getTime() - Date.now()) / 86400000),
          channel: 'in_app' as const,
          status: a.status,
          urgency: 'high' as const,
        }))} />
      )}

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">{loteamento.nome}</h2>
            <p className="text-sm text-slate-500 mt-1">{loteamento.endereco} — {loteamento.cidade}, {loteamento.estado}</p>
            <p className="text-sm text-slate-500">
              Área: {formatArea(loteamento.area_total)} | {loteamento.total_lotes} lotes | {loteamento.status}
            </p>
          </div>
          <ScoreGauge score={score?.score ?? 0} level={scoreLevel} size={80} trend={scoreTrend} />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <nav className="flex gap-4 min-w-max">
          {TABS.map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab ? 'border-rose-500 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}>
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* ================== TAB CONTENT ================== */}

      {/* COMPLIANCE */}
      {activeTab === 'Compliance' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Breakdown de Compliance — 8 Critérios</h3>
            <div className="space-y-3">
              {criteria.length > 0 ? criteria.map((c: any) => (
                <div key={c.criterionId} className="flex items-center gap-4">
                  <div className="w-48 text-sm text-slate-700">{c.name ?? c.criterionId}</div>
                  <div className="flex-1">
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${c.score >= 80 ? 'bg-green-500' : c.score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${c.score}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-right text-sm font-medium text-slate-700">{c.score}%</div>
                  <ComplianceBadge status={STATUS_BADGE[c.status] as any ?? 'NAO_CONFORME'} size="sm" />
                  {c.weight && <span className="text-xs text-slate-400">peso {c.weight}</span>}
                </div>
              )) : (
                <p className="text-sm text-slate-500">Score não calculado ainda.</p>
              )}
            </div>
          </div>
          {criteria.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Recomendações</h3>
              <ul className="space-y-2">
                {criteria.filter((c: any) => c.status !== 'CONFORME' && c.status !== 'NAO_APLICAVEL').map((c: any) => (
                  <li key={c.criterionId} className="flex items-start gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                    <span className="text-slate-600">{c.details}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* MAPA DE LOTES */}
      {activeTab === 'Mapa de Lotes' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Mapa Visual dos Lotes</h3>
          {lotes && lotes.length > 0 ? (
            <MapaLotes lotes={lotes} />
          ) : (
            <p className="text-sm text-slate-500">Nenhum lote cadastrado.</p>
          )}
        </div>
      )}

      {/* LOTES */}
      {activeTab === 'Lotes' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Lotes do Loteamento</h3>
            <span className="text-xs text-slate-500">{lotes?.length ?? 0} lotes</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Quadra/Lote</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Área</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Valor</th>
                <th className="text-center text-xs font-medium text-slate-500 uppercase px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(lotes ?? []).map((lote: any) => {
                const statusColors: Record<string, string> = {
                  DISPONIVEL: 'bg-emerald-100 text-emerald-700',
                  RESERVADO: 'bg-amber-100 text-amber-700',
                  VENDIDO: 'bg-rose-100 text-rose-700',
                  QUITADO: 'bg-blue-100 text-blue-700',
                };
                return (
                  <tr key={lote.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">Qd. {lote.quadra} — Lt. {lote.numero}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-600">{formatArea(lote.area_m2)}</td>
                    <td className="px-4 py-3 text-sm text-right font-mono text-slate-700">{formatCurrency(lote.valor_venda)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[lote.status] ?? 'bg-slate-100 text-slate-700'}`}>
                        {lote.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CONTRATOS */}
      {activeTab === 'Contratos' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">{contratos?.length ?? 0} contratos</h3>
          </div>
          {contratos && contratos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contratos.map((c: any) => (
                <ContratoCard key={c.id} contrato={c} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <p className="text-sm text-slate-500">Nenhum contrato registrado.</p>
            </div>
          )}
        </div>
      )}

      {/* COMPRADORES */}
      {activeTab === 'Compradores' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Nome</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">CPF</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Email</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Telefone</th>
                <th className="text-center text-xs font-medium text-slate-500 uppercase px-4 py-3">LGPD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(compradores ?? []).map((c: any) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-700">{c.nome}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 font-mono">{formatCPF(c.cpf || '')}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{c.email}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{c.telefone}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.lgpd_consentimento ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {c.lgpd_consentimento ? 'Consentido' : 'Pendente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* INFRAESTRUTURA */}
      {activeTab === 'Infraestrutura' && (
        <InfraestruturaProgress
          itens={infraestrutura ?? []}
          onUpdate={(itemId, pct) => updateInfra.mutate({ id: itemId, percentual: pct })}
        />
      )}

      {/* APROVAÇÕES */}
      {activeTab === 'Aprovações' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Timeline de Aprovações Regulatórias</h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
              <div className="space-y-6">
                {(aprovacoes ?? []).map((a: any) => {
                  const statusColors: Record<string, string> = {
                    PENDENTE: 'bg-slate-400',
                    EM_ANALISE: 'bg-amber-500',
                    APROVADO: 'bg-green-500',
                    NEGADO: 'bg-red-500',
                  };
                  return (
                    <div key={a.id} className="relative flex items-start gap-4 pl-10">
                      <div className={`absolute left-2.5 w-3 h-3 rounded-full ${statusColors[a.status] ?? 'bg-slate-400'} border-2 border-white`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-700">{a.tipo}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            a.status === 'APROVADO' ? 'bg-green-100 text-green-700' :
                            a.status === 'NEGADO' ? 'bg-red-100 text-red-700' :
                            a.status === 'EM_ANALISE' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {a.status}
                          </span>
                        </div>
                        {a.protocolo && <div className="text-xs text-slate-500 mt-0.5">Protocolo: {a.protocolo}</div>}
                        {a.observacoes && <div className="text-xs text-slate-500 mt-0.5">{a.observacoes}</div>}
                        <div className="text-xs text-slate-400 mt-1">{formatDate(a.created_at)}</div>
                      </div>
                    </div>
                  );
                })}
                {(!aprovacoes || aprovacoes.length === 0) && (
                  <p className="pl-10 text-sm text-slate-500">Nenhuma aprovação registrada.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FINANCEIRO */}
      {activeTab === 'Financeiro' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-xs text-slate-500 font-medium">VGV Total</div>
              <div className="text-lg font-bold text-slate-800 mt-1 font-mono">
                {formatCurrency(financeiro?.vgv ?? 0)}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-xs text-slate-500 font-medium">Recebido</div>
              <div className="text-lg font-bold text-green-600 mt-1 font-mono">
                {formatCurrency(financeiro?.recebido ?? 0)}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-xs text-slate-500 font-medium">A Receber</div>
              <div className="text-lg font-bold text-amber-600 mt-1 font-mono">
                {formatCurrency(financeiro?.a_receber ?? 0)}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-xs text-slate-500 font-medium">Inadimplência</div>
              <div className="text-lg font-bold text-red-600 mt-1">
                {formatCurrency(financeiro?.inadimplencia_rs ?? 0)}
                <span className="text-xs font-normal text-slate-400 ml-1">
                  ({formatPercent(financeiro?.inadimplencia_pct ?? 0)})
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-xs text-slate-500 font-medium">Contratos Ativos</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">{financeiro?.contratos_ativos ?? 0}</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-xs text-slate-500 font-medium">Contratos Quitados</div>
              <div className="text-2xl font-bold text-green-600 mt-1">{financeiro?.contratos_quitados ?? 0}</div>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENTOS */}
      {activeTab === 'Documentos' && (
        <div className="space-y-4">
          <DocumentUploader
            categories={DOC_CATEGORIES}
            onUpload={async (file, metadata) => {
              const reader = new FileReader();
              reader.onload = () => {
                uploadDoc.mutate({
                  fileName: file.name,
                  content: reader.result as string,
                  category: metadata.category,
                });
              };
              reader.readAsDataURL(file);
            }}
          />
          {documentos && documentos.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Documento</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Categoria</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documentos.map((doc: any) => (
                    <tr key={doc.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">{doc.file_name}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{doc.category}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{formatDate(doc.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* DOSSIÊ */}
      {activeTab === 'Dossiê' && (
        <DossierPreview
          entityName={loteamento.nome}
          period={{ start: loteamento.created_at, end: new Date().toISOString() }}
          score={score?.score ?? 0}
          level={scoreLevel}
          documentCount={documentos?.length ?? 0}
          eventCount={timelineData?.data?.length ?? 0}
          checklistCount={0}
          onGenerate={() => {}}
        />
      )}

      {/* ATIVIDADE */}
      {activeTab === 'Atividade' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Histórico de Eventos</h3>
          {timelineData?.data && timelineData.data.length > 0 ? (
            <AuditTimeline
              events={timelineData.data.map((e: any) => ({
                id: e.id,
                type: e.type,
                description: JSON.stringify(e.data),
                timestamp: e.timestamp,
                actor: e.actor_id ?? 'system',
              }))}
              maxItems={50}
            />
          ) : (
            <p className="text-sm text-slate-500">Nenhum evento registrado.</p>
          )}
        </div>
      )}
    </div>
  );
}
