'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  useObra,
  useObraScore,
  useObraEtapas,
  useObraDocuments,
  useObraTimeline,
  useObraAlerts,
  useObraChecklist,
  useObraNotas,
  useObraFotos,
  useObraMateriais,
  useUploadDocument,
  useUploadNota,
  useUploadFoto,
  useGenerateDossier,
  useSubmitEtapaChecklist,
} from '@/hooks/use-obras';
import { useAcknowledgeAlert } from '@/hooks/use-alertas';
import { toast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ScoreGauge,
  ComplianceBadge,
  AlertBanner,
  AuditTimeline,
  ChecklistForm,
  DocumentUploader,
  DossierPreview,
} from '@compliancecore/ui';

const tabs = [
  'Compliance',
  'Etapas',
  'Notas Fiscais',
  'Materiais',
  'Fotos',
  'Documentos',
  'Alertas',
  'Dossie',
  'Atividade',
] as const;
type Tab = (typeof tabs)[number];

const COMPLIANCE_CRITERIA = [
  { key: 'nr18_condicoes_trabalho', label: 'NR-18 Seguranca' },
  { key: 'alvara_construcao', label: 'Alvara de Construcao' },
  { key: 'art_rrt', label: 'ART/RRT' },
  { key: 'licenca_ambiental', label: 'Licenca Ambiental' },
  { key: 'epi_trabalhadores', label: 'EPI dos Trabalhadores' },
  { key: 'diario_obra', label: 'Diario de Obra' },
  { key: 'seguro_responsabilidade', label: 'Seguro Responsabilidade' },
  { key: 'pcmso_ppra', label: 'PCMSO/PPRA' },
] as const;

const DOCUMENT_CATEGORIES = [
  'alvara',
  'art_rrt',
  'licenca_ambiental',
  'seguro',
  'nr_treinamento',
  'diario_obra',
  'epi_registro',
  'pcmso_ppra',
  'crea_registro',
  'projeto_aprovado',
  'habite_se',
  'outro',
];

function scoreBarColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

function ocrStatusStyle(status: string): string {
  switch (status) {
    case 'CONCLUIDO':
      return 'bg-green-100 text-green-700';
    case 'PROCESSANDO':
      return 'bg-blue-100 text-blue-700';
    case 'PENDENTE':
      return 'bg-amber-100 text-amber-700';
    case 'ERRO':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function etapaStatusColor(status: string): string {
  switch (status) {
    case 'concluida':
      return 'bg-green-500';
    case 'em_andamento':
      return 'bg-amber-500';
    default:
      return 'bg-slate-300';
  }
}

function etapaTextColor(status: string): string {
  return status === 'pendente' ? 'text-slate-400' : 'text-white';
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

function EtapaChecklistSection({ obraId, etapa }: { obraId: string; etapa: any }) {
  const submitChecklist = useSubmitEtapaChecklist(obraId, etapa.id);
  const items = etapa.checklist || etapa.checklistItems || [];

  return (
    <ChecklistForm
      checklist={etapa as any}
      onSubmit={async (responses: any[]) => {
        try {
          await submitChecklist.mutateAsync({ responses });
          toast({ title: 'Checklist enviado com sucesso' });
        } catch {
          toast({ title: 'Erro ao enviar checklist', variant: 'destructive' });
        }
      }}
    />
  );
}

export default function ObraDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<Tab>('Compliance');
  const [expandedEtapaId, setExpandedEtapaId] = useState<string | null>(null);

  const { data: obra, isLoading: obraLoading } = useObra(id);
  const { data: score } = useObraScore(id);
  const { data: etapas } = useObraEtapas(id);
  const { data: documents } = useObraDocuments(id);
  const { data: timeline } = useObraTimeline(id);
  const { data: alerts } = useObraAlerts(id);
  const { data: checklist } = useObraChecklist(id);
  const { data: notas } = useObraNotas(id);
  const { data: fotos } = useObraFotos(id);

  const { data: materiais } = useObraMateriais(id);

  const uploadDocument = useUploadDocument(id);
  const uploadNota = useUploadNota(id);
  const uploadFoto = useUploadFoto(id);
  const generateDossier = useGenerateDossier(id);
  const acknowledgeAlert = useAcknowledgeAlert();

  if (obraLoading) {
    return <LoadingSkeleton />;
  }

  if (!obra) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-slate-500">Obra nao encontrada ou API indisponivel.</p>
        <Link href="/obras" className="mt-4 text-sm text-amber-600 hover:text-amber-700 font-medium">
          Voltar para obras
        </Link>
      </div>
    );
  }

  const breakdown = score?.breakdown ?? {};
  const urgentAlerts = (alerts ?? []).filter((a: any) => a.severity === 'CRITICAL' || a.severity === 'HIGH');

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/obras" className="hover:text-amber-600">
          Obras
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">{obra.nome}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-slate-800">{obra.nome}</h2>
              {obra.status && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                  {obra.status}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">{obra.endereco}</p>
            {obra.responsavel && (
              <p className="text-sm text-slate-500">Responsavel: {obra.responsavel}</p>
            )}

            {/* Progress bar */}
            {obra.progresso != null && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Progresso geral</span>
                  <span>{obra.progresso}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div
                    className="bg-amber-500 h-2.5 rounded-full transition-all"
                    style={{ width: `${obra.progresso}%` }}
                  />
                </div>
              </div>
            )}

            {/* Score breakdown summary (8 criteria) */}
            {score && (
              <div className="mt-4 grid grid-cols-4 gap-2">
                {COMPLIANCE_CRITERIA.map((c) => {
                  const criterion = breakdown[c.key];
                  const criterionScore = criterion?.score ?? 0;
                  return (
                    <div key={c.key} className="text-xs">
                      <div className="flex justify-between text-slate-500 mb-0.5">
                        <span className="truncate">{c.label}</span>
                        <span className="font-medium ml-1">{criterionScore}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1">
                        <div
                          className={`h-1 rounded-full ${scoreBarColor(criterionScore)}`}
                          style={{ width: `${criterionScore}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Score Gauge */}
          {score && (
            <div className="flex-shrink-0">
              <ScoreGauge
                score={score.overall}
                level={score.level}
                size={180}
                showLabel
                trend={score.trend}
              />
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* ===================== TAB: Compliance ===================== */}
      {activeTab === 'Compliance' && (
        <div className="space-y-4">
          {COMPLIANCE_CRITERIA.map((c) => {
            const criterion = breakdown[c.key];
            if (!criterion) {
              return (
                <div
                  key={c.key}
                  className="bg-white rounded-xl border border-slate-200 p-5"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-800">{c.label}</h4>
                    <span className="text-xs text-slate-400">Sem dados</span>
                  </div>
                </div>
              );
            }
            return (
              <div
                key={c.key}
                className="bg-white rounded-xl border border-slate-200 p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h4 className="text-sm font-semibold text-slate-800">{c.label}</h4>
                    {criterion.weight != null && (
                      <span className="text-xs text-slate-400">Peso: {criterion.weight}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <ComplianceBadge status={criterion.status} size="sm" showIcon />
                    <span className="text-sm font-semibold text-slate-700">
                      {criterion.score}%
                    </span>
                  </div>
                </div>

                {/* Score bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
                  <div
                    className={`h-2 rounded-full transition-all ${scoreBarColor(criterion.score)}`}
                    style={{ width: `${criterion.score}%` }}
                  />
                </div>

                {/* Details */}
                {criterion.details && (
                  <p className="text-xs text-slate-500 mb-2">{criterion.details}</p>
                )}

                {/* Evidence list */}
                {criterion.evidence && criterion.evidence.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-slate-600 mb-1">Evidencias:</p>
                    <ul className="space-y-1">
                      {criterion.evidence.map((ev: any, idx: number) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2 text-xs text-slate-500"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                          {typeof ev === 'string' ? ev : ev.description ?? ev.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ===================== TAB: Etapas ===================== */}
      {activeTab === 'Etapas' && (
        <div className="space-y-6">
          {/* Visual pipeline */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Pipeline de Etapas</h3>
            <div className="flex items-center gap-1 overflow-x-auto py-2">
              {(etapas ?? []).map((etapa: any, index: number) => (
                <div key={etapa.id ?? etapa.nome} className="flex items-center">
                  <div
                    className={`${etapaStatusColor(etapa.status)} ${etapaTextColor(etapa.status)} px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap`}
                  >
                    {etapa.nome}
                    {etapa.status === 'em_andamento' && (
                      <span className="ml-1">({etapa.progresso}%)</span>
                    )}
                  </div>
                  {index < (etapas ?? []).length - 1 && (
                    <div className="w-4 h-0.5 bg-slate-300 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Etapa detail cards */}
          <div className="space-y-3">
            {(etapas ?? []).map((etapa: any) => (
              <div
                key={etapa.id ?? etapa.nome}
                className="bg-white rounded-xl border border-slate-200 p-5"
              >
                <button
                  type="button"
                  className="w-full"
                  onClick={() =>
                    setExpandedEtapaId(expandedEtapaId === etapa.id ? null : etapa.id)
                  }
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${etapaStatusColor(etapa.status)}`}
                      />
                      <span className="text-sm font-medium text-slate-700">{etapa.nome}</span>
                      <span className="text-xs text-slate-400 capitalize">
                        {etapa.status?.replace('_', ' ')}
                      </span>
                    </div>
                    {etapa.checklistItems != null && (
                      <span className="text-xs text-slate-500">
                        {etapa.checklistItemsDone ?? 0}/{etapa.checklistItems} itens
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${etapaStatusColor(etapa.status)}`}
                        style={{ width: `${etapa.progresso ?? 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-10 text-right">
                      {etapa.progresso ?? 0}%
                    </span>
                  </div>
                </button>

                {expandedEtapaId === etapa.id && (etapa.checklist || etapa.checklistItems) && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <EtapaChecklistSection obraId={id} etapa={etapa} />
                  </div>
                )}
              </div>
            ))}
            {(!etapas || etapas.length === 0) && (
              <p className="text-sm text-slate-400 text-center py-8">
                Nenhuma etapa cadastrada.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ===================== TAB: Notas Fiscais ===================== */}
      {activeTab === 'Notas Fiscais' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-800">Notas Fiscais</h3>
            <label className="px-3 py-1.5 text-xs font-medium text-amber-600 border border-amber-300 rounded-lg hover:bg-amber-50 cursor-pointer">
              Upload Nota
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      uploadNota.mutate(
                        { imagemUrl: reader.result as string },
                        {
                          onSuccess: () =>
                            toast({ title: 'Nota enviada com sucesso' }),
                          onError: () =>
                            toast({
                              title: 'Erro ao enviar nota',
                              variant: 'destructive',
                            }),
                        },
                      );
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                  Fornecedor
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                  Itens
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                  Valor
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                  Status OCR
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(notas ?? []).map((nota: any) => (
                <tr key={nota.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">
                    {nota.fornecedor}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {nota.items?.length ?? 0} itens
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {nota.valor != null
                      ? `R$ ${Number(nota.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ocrStatusStyle(nota.statusOcr ?? nota.ocrStatus ?? 'PENDENTE')}`}
                    >
                      {nota.statusOcr ?? nota.ocrStatus ?? 'PENDENTE'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!notas || notas.length === 0) && (
            <p className="text-sm text-slate-400 text-center py-8">
              Nenhuma nota fiscal cadastrada.
            </p>
          )}
        </div>
      )}

      {/* ===================== TAB: Materiais ===================== */}
      {activeTab === 'Materiais' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-800">Inventario de Materiais</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Materiais registrados nesta obra
            </p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                  Material
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                  Quantidade
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                  Fornecedor
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                  Nota Fiscal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(materiais ?? []).map((m: any) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">{m.nome}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {m.quantidade} {m.unidade}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{m.fornecedor}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{m.notaRef}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!materiais || materiais.length === 0) && (
            <p className="text-sm text-slate-400 text-center py-8">
              Nenhum material registrado.
            </p>
          )}
        </div>
      )}

      {/* ===================== TAB: Fotos ===================== */}
      {activeTab === 'Fotos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Galeria de Fotos</h3>
            <label className="px-3 py-1.5 text-xs font-medium text-amber-600 border border-amber-300 rounded-lg hover:bg-amber-50 cursor-pointer">
              Upload Foto
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      uploadFoto.mutate(
                        { fileName: file.name, data: reader.result },
                        {
                          onSuccess: () =>
                            toast({ title: 'Foto enviada com sucesso' }),
                          onError: () =>
                            toast({
                              title: 'Erro ao enviar foto',
                              variant: 'destructive',
                            }),
                        },
                      );
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(fotos ?? []).map((foto: any) => (
              <div
                key={foto.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden group"
              >
                <div className="aspect-square bg-slate-100 relative overflow-hidden">
                  {foto.url || foto.thumbnailUrl ? (
                    <img
                      src={foto.thumbnailUrl ?? foto.url}
                      alt={foto.descricao ?? foto.description ?? ''}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <svg
                        className="w-10 h-10"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                        />
                      </svg>
                    </div>
                  )}
                  {(foto.etapa || foto.etapaNome) && (
                    <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                      {foto.etapaNome ?? foto.etapa}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  {(foto.descricao || foto.description) && (
                    <p className="text-xs text-slate-700 line-clamp-2 mb-1">
                      {foto.descricao ?? foto.description}
                    </p>
                  )}
                  {foto.timestamp && (
                    <p className="text-[10px] text-slate-400">
                      {new Date(foto.timestamp).toLocaleString('pt-BR')}
                    </p>
                  )}
                  {(foto.gps || foto.coordinates) && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      GPS: {foto.gps?.lat ?? foto.coordinates?.lat},{' '}
                      {foto.gps?.lng ?? foto.coordinates?.lng}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {(!fotos || fotos.length === 0) && (
            <p className="text-sm text-slate-400 text-center py-8">
              Nenhuma foto registrada.
            </p>
          )}
        </div>
      )}

      {/* ===================== TAB: Documentos ===================== */}
      {activeTab === 'Documentos' && (
        <div className="space-y-6">
          <DocumentUploader
            categories={DOCUMENT_CATEGORIES}
            onUpload={async (file, metadata) => {
              await uploadDocument.mutateAsync({ file, ...metadata });
              toast({ title: 'Documento enviado com sucesso' });
            }}
            maxSize={20 * 1024 * 1024}
            acceptedTypes={['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']}
          />

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                    Documento
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                    Categoria
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                    Validade
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(documents ?? []).map((doc: any) => (
                  <tr key={doc.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                      {doc.nome ?? doc.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 capitalize">
                      {(doc.categoria ?? doc.category ?? '').replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4">
                      <ComplianceBadge
                        status={doc.status ?? 'NAO_APLICAVEL'}
                        size="sm"
                        showIcon
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {doc.validade ?? doc.vencimento ?? '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!documents || documents.length === 0) && (
              <p className="text-sm text-slate-400 text-center py-8">
                Nenhum documento cadastrado.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ===================== TAB: Alertas ===================== */}
      {activeTab === 'Alertas' && (
        <div className="space-y-6">
          {urgentAlerts.length > 0 && (
            <AlertBanner
              alerts={urgentAlerts}
              onAcknowledge={(alertId: string) => {
                acknowledgeAlert.mutate(alertId, {
                  onSuccess: () =>
                    toast({ title: 'Alerta reconhecido' }),
                  onError: () =>
                    toast({
                      title: 'Erro ao reconhecer alerta',
                      variant: 'destructive',
                    }),
                });
              }}
            />
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Todos os Alertas</h3>
            <div className="space-y-3">
              {(alerts ?? []).map((alert: any) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-100"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          alert.severity === 'CRITICAL'
                            ? 'bg-red-500'
                            : alert.severity === 'HIGH'
                              ? 'bg-amber-500'
                              : alert.severity === 'MEDIUM'
                                ? 'bg-yellow-400'
                                : 'bg-slate-300'
                        }`}
                      />
                      <span className="text-sm font-medium text-slate-700">
                        {alert.title ?? alert.message}
                      </span>
                    </div>
                    {alert.description && (
                      <p className="text-xs text-slate-500 mt-1 ml-4">
                        {alert.description}
                      </p>
                    )}
                    {alert.dueDate && (
                      <p className="text-xs text-slate-400 mt-0.5 ml-4">
                        Vence: {new Date(alert.dueDate).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                  {alert.status !== 'ACKNOWLEDGED' && (
                    <button
                      type="button"
                      onClick={() =>
                        acknowledgeAlert.mutate(alert.id, {
                          onSuccess: () =>
                            toast({ title: 'Alerta reconhecido' }),
                          onError: () =>
                            toast({
                              title: 'Erro ao reconhecer alerta',
                              variant: 'destructive',
                            }),
                        })
                      }
                      disabled={acknowledgeAlert.isPending}
                      className="px-3 py-1.5 text-xs font-medium text-amber-600 border border-amber-300 rounded-lg hover:bg-amber-50 disabled:opacity-50"
                    >
                      Reconhecer
                    </button>
                  )}
                  {alert.status === 'ACKNOWLEDGED' && (
                    <span className="text-xs text-green-600 font-medium">Reconhecido</span>
                  )}
                </div>
              ))}
              {(!alerts || alerts.length === 0) && (
                <p className="text-sm text-slate-400 text-center py-8">
                  Nenhum alerta ativo.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB: Dossie ===================== */}
      {activeTab === 'Dossie' && (
        <DossierPreview
          entityName={obra.nome}
          period={{
            start: obra.inicio ?? obra.dataInicio ?? obra.createdAt ?? '',
            end: obra.previsaoTermino ?? obra.dataFim ?? '',
          }}
          score={score?.overall ?? 0}
          level={score?.level ?? ''}
          documentCount={(documents ?? []).length}
          eventCount={(timeline ?? []).length}
          checklistCount={checklist?.items?.length ?? 0}
          onGenerate={() => {
            generateDossier.mutate(undefined, {
              onSuccess: () =>
                toast({ title: 'Dossie gerado com sucesso' }),
              onError: () =>
                toast({
                  title: 'Erro ao gerar dossie',
                  variant: 'destructive',
                }),
            });
          }}
          generating={generateDossier.isPending}
        />
      )}

      {/* ===================== TAB: Atividade ===================== */}
      {activeTab === 'Atividade' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">
            Historico de Atividades
          </h3>
          <AuditTimeline events={timeline ?? []} />
          {(!timeline || timeline.length === 0) && (
            <p className="text-sm text-slate-400 text-center py-8">
              Nenhuma atividade registrada.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
