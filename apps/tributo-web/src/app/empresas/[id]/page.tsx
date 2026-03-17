'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const tabs = ['Visao Geral', 'Obrigacoes', 'Calculos', 'SPED', 'Score', 'Documentos', 'Timeline'] as const;
type Tab = (typeof tabs)[number];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';

interface EmpresaDetail {
  id: string;
  nome: string;
  cnpj: string;
  regime: string;
  score: number;
  level: string;
  responsavel: string;
  cidade: string;
  faturamentoAnual: string;
  atividade: string;
}

interface Obrigacao {
  id: string;
  nome: string;
  competencia: string;
  vencimento: string;
  status: string;
}

interface Calculo {
  tributo: string;
  base: string;
  aliquota: string;
  valor: string;
}

interface SpedRecord {
  id: string;
  tipo: string;
  competencia: string;
  status: string;
  recibo: string;
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    valido: 'bg-green-100 text-green-700',
    entregue: 'bg-green-100 text-green-700',
    transmitido: 'bg-green-100 text-green-700',
    pendente: 'bg-amber-100 text-amber-700',
    expirado: 'bg-red-100 text-red-700',
    atrasado: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}

export default function EmpresaDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<Tab>('Visao Geral');
  const [loading, setLoading] = useState(true);
  const [empresa, setEmpresa] = useState<EmpresaDetail | null>(null);
  const [obrigacoes, setObrigacoes] = useState<Obrigacao[]>([]);
  const [calculos, setCalculos] = useState<Calculo[]>([]);
  const [sped, setSped] = useState<SpedRecord[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const results = await Promise.allSettled([
          fetch(`${API_URL}/empresas/${id}`).then(r => r.ok ? r.json() : null),
          fetch(`${API_URL}/empresas/${id}/obrigacoes`).then(r => r.ok ? r.json() : []),
          fetch(`${API_URL}/empresas/${id}/calculos`).then(r => r.ok ? r.json() : []),
          fetch(`${API_URL}/empresas/${id}/sped`).then(r => r.ok ? r.json() : []),
          fetch(`${API_URL}/empresas/${id}/documentos`).then(r => r.ok ? r.json() : []),
          fetch(`${API_URL}/empresas/${id}/timeline`).then(r => r.ok ? r.json() : []),
        ]);

        if (results[0].status === 'fulfilled' && results[0].value) setEmpresa(results[0].value);
        if (results[1].status === 'fulfilled') setObrigacoes(results[1].value);
        if (results[2].status === 'fulfilled') setCalculos(results[2].value);
        if (results[3].status === 'fulfilled') setSped(results[3].value);
        if (results[4].status === 'fulfilled') setDocuments(results[4].value);
        if (results[5].status === 'fulfilled') setTimeline(results[5].value);
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

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/empresas" className="hover:text-emerald-600">Empresas</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">{empresa.nome}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">{empresa.nome}</h2>
            <p className="text-sm text-slate-500 mt-1">CNPJ: {empresa.cnpj}</p>
            <p className="text-sm text-slate-500">Regime: {empresa.regime} | {empresa.cidade}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-600">{empresa.score}</div>
            <div className="text-xs font-medium text-green-600">{empresa.level}</div>
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
                  ? 'border-emerald-500 text-emerald-600'
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
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Dados da Empresa</h3>
            <dl className="space-y-3">
              <div className="flex justify-between"><dt className="text-sm text-slate-500">Razao Social</dt><dd className="text-sm font-medium text-slate-700">{empresa.nome}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-slate-500">CNPJ</dt><dd className="text-sm font-medium text-slate-700 font-mono">{empresa.cnpj}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-slate-500">Regime</dt><dd className="text-sm font-medium text-slate-700">{empresa.regime}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-slate-500">Atividade</dt><dd className="text-sm font-medium text-slate-700">{empresa.atividade}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-slate-500">Faturamento Anual</dt><dd className="text-sm font-medium text-slate-700">{empresa.faturamentoAnual}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-slate-500">Responsavel</dt><dd className="text-sm font-medium text-slate-700">{empresa.responsavel}</dd></div>
            </dl>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Proximas Obrigacoes</h3>
            <div className="space-y-3">
              {obrigacoes.filter((o) => o.status === 'pendente').slice(0, 3).map((obr) => (
                <div key={obr.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
                  <div>
                    <div className="text-sm font-medium text-slate-700">{obr.nome}</div>
                    <div className="text-xs text-slate-500">Competencia: {obr.competencia}</div>
                  </div>
                  <span className="text-xs text-slate-500">{obr.vencimento}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
              {obrigacoes.map((obr) => (
                <tr key={obr.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">{obr.nome}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{obr.competencia}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{obr.vencimento}</td>
                  <td className="px-6 py-4"><StatusBadge status={obr.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Calculos' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Calculos Tributarios - Trimestre Atual</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Tributo</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Base de Calculo</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Aliquota</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {calculos.map((calc) => (
                <tr key={calc.tributo}>
                  <td className="py-3 text-sm font-medium text-slate-700">{calc.tributo}</td>
                  <td className="py-3 text-sm text-slate-500 font-mono">{calc.base}</td>
                  <td className="py-3 text-sm text-slate-500">{calc.aliquota}</td>
                  <td className="py-3 text-sm font-semibold text-slate-700 text-right font-mono">{calc.valor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'SPED' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Tipo</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Competencia</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Recibo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sped.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">{s.tipo}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{s.competencia}</td>
                  <td className="px-6 py-4"><StatusBadge status={s.status} /></td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-mono">{s.recibo}</td>
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
              <div className="text-5xl font-bold text-green-600">{empresa.score}</div>
              <div className="text-sm font-medium text-green-600 mt-1">{empresa.level}</div>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="text-slate-600">Obrigacoes Acessorias</span><span className="font-medium">95%</span></div>
                <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="text-slate-600">Pagamentos em Dia</span><span className="font-medium">90%</span></div>
                <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: '90%' }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="text-slate-600">Certidoes Negativas</span><span className="font-medium">75%</span></div>
                <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-amber-500 h-2 rounded-full" style={{ width: '75%' }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="text-slate-600">SPED Compliance</span><span className="font-medium">100%</span></div>
                <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }} /></div>
              </div>
            </div>
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

      {activeTab === 'Timeline' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Historico de Eventos</h3>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
            <div className="space-y-6">
              {timeline.map((event) => (
                <div key={event.id} className="relative flex items-start gap-4 pl-10">
                  <div className="absolute left-2.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
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
    </div>
  );
}
