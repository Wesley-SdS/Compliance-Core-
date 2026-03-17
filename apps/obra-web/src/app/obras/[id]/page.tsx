'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const tabs = ['Visao Geral', 'Etapas', 'Documentos', 'Score', 'Checklist', 'Timeline', 'Dossie'] as const;
type Tab = (typeof tabs)[number];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002';

interface ObraDetail {
  id: string;
  nome: string;
  endereco: string;
  responsavel: string;
  inicio: string;
  previsaoTermino: string;
  score: number;
  level: string;
  progresso: number;
  etapaAtual: string;
}

interface Etapa {
  nome: string;
  status: string;
  progresso: number;
}

interface Document {
  id: string;
  nome: string;
  status: string;
  vencimento: string;
}

interface TimelineEvent {
  id: string;
  data: string;
  evento: string;
  tipo: string;
}

interface ChecklistItem {
  id: string;
  item: string;
  concluido: boolean;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    valido: 'bg-green-100 text-green-700',
    pendente: 'bg-amber-100 text-amber-700',
    expirado: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}

function EtapaPipeline({ etapas }: { etapas: Etapa[] }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto py-4">
      {etapas.map((etapa, index) => {
        const bgColor = etapa.status === 'concluida' ? 'bg-green-500' : etapa.status === 'em_andamento' ? 'bg-amber-500' : 'bg-slate-200';
        const textColor = etapa.status === 'pendente' ? 'text-slate-400' : 'text-white';
        return (
          <div key={etapa.nome} className="flex items-center">
            <div className={`${bgColor} ${textColor} px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap`}>
              {etapa.nome}
              {etapa.status === 'em_andamento' && <span className="ml-1">({etapa.progresso}%)</span>}
            </div>
            {index < etapas.length - 1 && (
              <div className="w-4 h-0.5 bg-slate-300 flex-shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ObraDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<Tab>('Visao Geral');
  const [loading, setLoading] = useState(true);
  const [obra, setObra] = useState<ObraDetail | null>(null);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const results = await Promise.allSettled([
          fetch(`${API_URL}/obras/${id}`).then(r => r.ok ? r.json() : null),
          fetch(`${API_URL}/obras/${id}/etapas`).then(r => r.ok ? r.json() : []),
          fetch(`${API_URL}/obras/${id}/documentos`).then(r => r.ok ? r.json() : []),
          fetch(`${API_URL}/obras/${id}/timeline`).then(r => r.ok ? r.json() : []),
          fetch(`${API_URL}/obras/${id}/checklist`).then(r => r.ok ? r.json() : []),
        ]);

        if (results[0].status === 'fulfilled' && results[0].value) setObra(results[0].value);
        if (results[1].status === 'fulfilled') setEtapas(results[1].value);
        if (results[2].status === 'fulfilled') setDocuments(results[2].value);
        if (results[3].status === 'fulfilled') setTimeline(results[3].value);
        if (results[4].status === 'fulfilled') setChecklist(results[4].value);
      } catch {
        // Data stays at defaults
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-slate-500">Carregando dados da obra...</div>
      </div>
    );
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

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/obras" className="hover:text-amber-600">Obras</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">{obra.nome}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">{obra.nome}</h2>
            <p className="text-sm text-slate-500 mt-1">{obra.endereco}</p>
            <p className="text-sm text-slate-500">Responsavel: {obra.responsavel}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{obra.score}</div>
            <div className="text-xs font-medium text-blue-600">{obra.level}</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Progresso geral</span>
            <span>{obra.progresso}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5">
            <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: `${obra.progresso}%` }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
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

      {/* Tab Content */}
      {activeTab === 'Visao Geral' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Informacoes da Obra</h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">Inicio</dt>
                <dd className="text-sm font-medium text-slate-700">{obra.inicio}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">Previsao de Termino</dt>
                <dd className="text-sm font-medium text-slate-700">{obra.previsaoTermino}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">Etapa Atual</dt>
                <dd className="text-sm font-medium text-slate-700">{obra.etapaAtual}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">Progresso</dt>
                <dd className="text-sm font-medium text-slate-700">{obra.progresso}%</dd>
              </div>
            </dl>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Pipeline de Etapas</h3>
            <EtapaPipeline etapas={etapas} />
          </div>
        </div>
      )}

      {activeTab === 'Etapas' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Etapas da Obra</h3>
          <EtapaPipeline etapas={etapas} />
          <div className="mt-6 space-y-3">
            {etapas.map((etapa) => (
              <div key={etapa.nome} className="flex items-center justify-between p-4 rounded-lg border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${etapa.status === 'concluida' ? 'bg-green-500' : etapa.status === 'em_andamento' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                  <span className="text-sm font-medium text-slate-700">{etapa.nome}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 bg-slate-100 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${etapa.status === 'concluida' ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${etapa.progresso}%` }} />
                  </div>
                  <span className="text-xs text-slate-500 w-10 text-right">{etapa.progresso}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Documentos' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Documento</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Vencimento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">{doc.nome}</td>
                  <td className="px-6 py-4"><StatusBadge status={doc.status} /></td>
                  <td className="px-6 py-4 text-sm text-slate-500">{doc.vencimento}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Score' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600">{obra.score}</div>
              <div className="text-sm font-medium text-blue-600 mt-1">{obra.level}</div>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="text-slate-600">Documentacao</span><span className="font-medium">85%</span></div>
                <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="text-slate-600">Seguranca</span><span className="font-medium">90%</span></div>
                <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: '90%' }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="text-slate-600">Ambiental</span><span className="font-medium">70%</span></div>
                <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-amber-500 h-2 rounded-full" style={{ width: '70%' }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="text-slate-600">Trabalhista</span><span className="font-medium">75%</span></div>
                <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-amber-500 h-2 rounded-full" style={{ width: '75%' }} /></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Checklist' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Checklist de Compliance</h3>
          <div className="space-y-2">
            {checklist.map((item) => (
              <label key={item.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.concluido}
                  readOnly
                  className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                />
                <span className={`text-sm ${item.concluido ? 'text-slate-500 line-through' : 'text-slate-700 font-medium'}`}>
                  {item.item}
                </span>
              </label>
            ))}
          </div>
          <div className="mt-4 text-sm text-slate-500">
            {checklist.filter((i) => i.concluido).length} de {checklist.length} itens concluidos
          </div>
        </div>
      )}

      {activeTab === 'Timeline' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Historico de Eventos</h3>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
            <div className="space-y-6">
              {timeline.map((event) => (
                <div key={event.id} className="relative flex items-start gap-4 pl-10">
                  <div className="absolute left-2.5 w-3 h-3 rounded-full bg-amber-500 border-2 border-white" />
                  <div>
                    <p className="text-sm text-slate-700">{event.evento}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{event.data}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Dossie' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Dossie de Compliance</h3>
          <p className="text-sm text-slate-500 mb-6">Compilacao completa de todos os documentos e evidencias de compliance da obra.</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-lg border border-slate-100">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <span className="text-sm font-medium text-slate-700">Dossie Completo - {obra.nome}</span>
              </div>
              <button type="button" className="px-3 py-1.5 text-xs font-medium text-amber-600 border border-amber-300 rounded-lg hover:bg-amber-50">
                Gerar PDF
              </button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border border-slate-100">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <span className="text-sm font-medium text-slate-700">Relatorio de Score - Ultimo Mes</span>
              </div>
              <button type="button" className="px-3 py-1.5 text-xs font-medium text-amber-600 border border-amber-300 rounded-lg hover:bg-amber-50">
                Gerar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
