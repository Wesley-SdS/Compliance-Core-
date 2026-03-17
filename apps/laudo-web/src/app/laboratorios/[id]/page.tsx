'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const tabs = ['Visao Geral', 'Laudos', 'Equipamentos', 'Qualidade', 'Score', 'Documentos', 'Timeline'] as const;
type Tab = (typeof tabs)[number];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3004';

interface LabDetail {
  id: string;
  nome: string;
  cidade: string;
  endereco: string;
  tipo: string;
  certificacao: string;
  responsavel: string;
  score: number;
  level: string;
}

interface Laudo {
  id: string;
  tipo: string;
  paciente: string;
  data: string;
  status: string;
}

interface Equipamento {
  id: string;
  nome: string;
  marca: string;
  calibracao: string;
  status: string;
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
    aprovado: 'bg-green-100 text-green-700',
    calibrado: 'bg-green-100 text-green-700',
    valido: 'bg-green-100 text-green-700',
    pendente: 'bg-amber-100 text-amber-700',
    vencendo: 'bg-amber-100 text-amber-700',
    rejeitado: 'bg-red-100 text-red-700',
    vencido: 'bg-red-100 text-red-700',
    expirado: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}

export default function LabDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<Tab>('Visao Geral');
  const [loading, setLoading] = useState(true);
  const [lab, setLab] = useState<LabDetail | null>(null);
  const [laudos, setLaudos] = useState<Laudo[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const results = await Promise.allSettled([
          fetch(`${API_URL}/laboratorios/${id}`).then(r => r.ok ? r.json() : null),
          fetch(`${API_URL}/laboratorios/${id}/laudos`).then(r => r.ok ? r.json() : []),
          fetch(`${API_URL}/laboratorios/${id}/equipamentos`).then(r => r.ok ? r.json() : []),
          fetch(`${API_URL}/laboratorios/${id}/documentos`).then(r => r.ok ? r.json() : []),
          fetch(`${API_URL}/laboratorios/${id}/timeline`).then(r => r.ok ? r.json() : []),
        ]);

        if (results[0].status === 'fulfilled' && results[0].value) setLab(results[0].value);
        if (results[1].status === 'fulfilled') setLaudos(results[1].value);
        if (results[2].status === 'fulfilled') setEquipamentos(results[2].value);
        if (results[3].status === 'fulfilled') setDocuments(results[3].value);
        if (results[4].status === 'fulfilled') setTimeline(results[4].value);
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
        <div className="text-sm text-slate-500">Carregando dados do laboratorio...</div>
      </div>
    );
  }

  if (!lab) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-slate-500">Laboratorio nao encontrado ou API indisponivel.</p>
        <Link href="/laboratorios" className="mt-4 text-sm text-violet-600 hover:text-violet-700 font-medium">
          Voltar para laboratorios
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/laboratorios" className="hover:text-violet-600">Laboratorios</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">{lab.nome}</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">{lab.nome}</h2>
            <p className="text-sm text-slate-500 mt-1">{lab.endereco} - {lab.cidade}</p>
            <p className="text-sm text-slate-500">Tipo: {lab.tipo} | Certificacao: {lab.certificacao}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-600">{lab.score}</div>
            <div className="text-xs font-medium text-green-600">{lab.level}</div>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-violet-500 text-violet-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'Visao Geral' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Informacoes do Laboratorio</h3>
            <dl className="space-y-3">
              <div className="flex justify-between"><dt className="text-sm text-slate-500">Nome</dt><dd className="text-sm font-medium text-slate-700">{lab.nome}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-slate-500">Tipo</dt><dd className="text-sm font-medium text-slate-700">{lab.tipo}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-slate-500">Certificacao</dt><dd className="text-sm font-medium text-slate-700">{lab.certificacao}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-slate-500">Responsavel Tecnico</dt><dd className="text-sm font-medium text-slate-700">{lab.responsavel}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-slate-500">Endereco</dt><dd className="text-sm font-medium text-slate-700">{lab.endereco}, {lab.cidade}</dd></div>
            </dl>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Resumo de Atividade</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-slate-50">
                <div className="text-2xl font-bold text-slate-800">{laudos.length}</div>
                <div className="text-xs text-slate-500">Laudos recentes</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50">
                <div className="text-2xl font-bold text-green-600">{laudos.length > 0 ? Math.round((laudos.filter(l => l.status === 'aprovado').length / laudos.length) * 100) : 0}%</div>
                <div className="text-xs text-slate-500">Aprovados</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50">
                <div className="text-2xl font-bold text-slate-800">{equipamentos.length}</div>
                <div className="text-xs text-slate-500">Equipamentos</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50">
                <div className="text-2xl font-bold text-amber-600">{equipamentos.filter(e => e.status === 'vencendo' || e.status === 'vencido').length}</div>
                <div className="text-xs text-slate-500">Calibracoes pendentes</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Laudos' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Tipo de Exame</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Paciente/Amostra</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Data</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {laudos.map((laudo) => (
                <tr key={laudo.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">{laudo.tipo}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{laudo.paciente}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{laudo.data}</td>
                  <td className="px-6 py-4"><StatusBadge status={laudo.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Equipamentos' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Equipamento</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Marca</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Proxima Calibracao</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {equipamentos.map((eq) => (
                <tr key={eq.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">{eq.nome}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{eq.marca}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{eq.calibracao}</td>
                  <td className="px-6 py-4"><StatusBadge status={eq.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Qualidade' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Indicadores de Qualidade</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1"><span className="text-slate-600">Laudos entregues no prazo</span><span className="font-medium">94%</span></div>
              <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: '94%' }} /></div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1"><span className="text-slate-600">Ensaios de proficiencia aprovados</span><span className="font-medium">100%</span></div>
              <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }} /></div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1"><span className="text-slate-600">Equipamentos calibrados</span><span className="font-medium">83%</span></div>
              <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-amber-500 h-2 rounded-full" style={{ width: '83%' }} /></div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1"><span className="text-slate-600">Nao conformidades resolvidas</span><span className="font-medium">90%</span></div>
              <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: '90%' }} /></div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1"><span className="text-slate-600">Treinamentos em dia</span><span className="font-medium">95%</span></div>
              <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }} /></div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Score' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-green-600">{lab.score}</div>
              <div className="text-sm font-medium text-green-600 mt-1">{lab.level}</div>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="text-slate-600">Documentacao</span><span className="font-medium">95%</span></div>
                <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="text-slate-600">Equipamentos</span><span className="font-medium">83%</span></div>
                <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-amber-500 h-2 rounded-full" style={{ width: '83%' }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="text-slate-600">Processos</span><span className="font-medium">96%</span></div>
                <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: '96%' }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="text-slate-600">Pessoal</span><span className="font-medium">92%</span></div>
                <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }} /></div>
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
                  <div className="absolute left-2.5 w-3 h-3 rounded-full bg-violet-500 border-2 border-white" />
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
