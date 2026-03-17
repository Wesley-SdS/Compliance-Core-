'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const tabs = ['Dados', 'Manutencao', 'Documentos', 'Viagens', 'Score', 'Timeline'] as const;
type Tab = (typeof tabs)[number];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3005';

interface VeiculoDetail {
  id: string;
  placa: string;
  modelo: string;
  ano: number;
  tipo: string;
  chassi: string;
  renavam: string;
  km: number;
  score: number;
  level: string;
  proprietario: string;
}

interface Manutencao { id: string; tipo: string; data: string; km: number; status: string; custo: string; }
interface Document { id: string; nome: string; status: string; vencimento: string; }
interface Viagem { id: string; motorista: string; origem: string; destino: string; data: string; status: string; ciot: string; }
interface TimelineEvent { id: string; data: string; evento: string; tipo: string; }

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    valido: 'bg-green-100 text-green-700',
    concluida: 'bg-green-100 text-green-700',
    em_transito: 'bg-sky-100 text-sky-700',
    agendada: 'bg-blue-100 text-blue-700',
    vencendo: 'bg-amber-100 text-amber-700',
    vencido: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export default function VeiculoDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<Tab>('Dados');
  const [loading, setLoading] = useState(true);
  const [veiculo, setVeiculo] = useState<VeiculoDetail | null>(null);
  const [manutencao, setManutencao] = useState<Manutencao[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [viagens, setViagens] = useState<Viagem[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const results = await Promise.allSettled([
          fetch(`${API_URL}/veiculos/${id}`).then(r => r.ok ? r.json() : null),
          fetch(`${API_URL}/veiculos/${id}/manutencao`).then(r => r.ok ? r.json() : []),
          fetch(`${API_URL}/veiculos/${id}/documentos`).then(r => r.ok ? r.json() : []),
          fetch(`${API_URL}/veiculos/${id}/viagens`).then(r => r.ok ? r.json() : []),
          fetch(`${API_URL}/veiculos/${id}/timeline`).then(r => r.ok ? r.json() : []),
        ]);
        if (results[0].status === 'fulfilled' && results[0].value) setVeiculo(results[0].value);
        if (results[1].status === 'fulfilled') setManutencao(results[1].value);
        if (results[2].status === 'fulfilled') setDocuments(results[2].value);
        if (results[3].status === 'fulfilled') setViagens(results[3].value);
        if (results[4].status === 'fulfilled') setTimeline(results[4].value);
      } catch { /* defaults */ } finally { setLoading(false); }
    }
    fetchData();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="text-sm text-slate-500">Carregando dados do veiculo...</div></div>;
  if (!veiculo) return <div className="flex flex-col items-center justify-center py-20"><p className="text-sm text-slate-500">Veiculo nao encontrado ou API indisponivel.</p><Link href="/veiculos" className="mt-4 text-sm text-sky-600 hover:text-sky-700 font-medium">Voltar para veiculos</Link></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/veiculos" className="hover:text-sky-600">Veiculos</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">{veiculo.placa}</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">{veiculo.placa} - {veiculo.modelo}</h2>
            <p className="text-sm text-slate-500 mt-1">{veiculo.tipo} | Ano: {veiculo.ano} | KM: {veiculo.km.toLocaleString('pt-BR')}</p>
            <p className="text-sm text-slate-500">{veiculo.proprietario}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{veiculo.score}</div>
            <div className="text-xs font-medium text-blue-600">{veiculo.level}</div>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'Dados' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Dados do Veiculo</h3>
            <dl className="space-y-3">
              <div className="flex justify-between"><dt className="text-sm text-slate-500">Placa</dt><dd className="text-sm font-medium text-slate-700">{veiculo.placa}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-slate-500">Modelo</dt><dd className="text-sm font-medium text-slate-700">{veiculo.modelo}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-slate-500">Ano</dt><dd className="text-sm font-medium text-slate-700">{veiculo.ano}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-slate-500">Tipo</dt><dd className="text-sm font-medium text-slate-700">{veiculo.tipo}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-slate-500">Chassi</dt><dd className="text-sm font-medium text-slate-700 font-mono">{veiculo.chassi}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-slate-500">RENAVAM</dt><dd className="text-sm font-medium text-slate-700 font-mono">{veiculo.renavam}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-slate-500">KM Atual</dt><dd className="text-sm font-medium text-slate-700">{veiculo.km.toLocaleString('pt-BR')}</dd></div>
            </dl>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Proximas Manutencoes</h3>
            <div className="space-y-3">
              {manutencao.filter((m) => m.status === 'agendada').map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
                  <div>
                    <div className="text-sm font-medium text-slate-700">{m.tipo}</div>
                    <div className="text-xs text-slate-500">KM previsto: {m.km.toLocaleString('pt-BR')}</div>
                  </div>
                  <span className="text-xs text-slate-500">{m.data}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Manutencao' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Tipo</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Data</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">KM</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
              <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Custo</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {manutencao.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">{m.tipo}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{m.data}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-mono">{m.km.toLocaleString('pt-BR')}</td>
                  <td className="px-6 py-4"><StatusBadge status={m.status} /></td>
                  <td className="px-6 py-4 text-sm text-slate-700 text-right font-mono">{m.custo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Documentos' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Documento</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Vencimento</th>
            </tr></thead>
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

      {activeTab === 'Viagens' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Motorista</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Rota</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Data</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">CIOT</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {viagens.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">{v.motorista}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{v.origem} → {v.destino}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{v.data}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-mono">{v.ciot}</td>
                  <td className="px-6 py-4"><StatusBadge status={v.status} /></td>
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
              <div className="text-5xl font-bold text-blue-600">{veiculo.score}</div>
              <div className="text-sm font-medium text-blue-600 mt-1">{veiculo.level}</div>
            </div>
            <div className="flex-1 space-y-3">
              <div><div className="flex justify-between text-sm mb-1"><span className="text-slate-600">Documentacao</span><span className="font-medium">90%</span></div><div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: '90%' }} /></div></div>
              <div><div className="flex justify-between text-sm mb-1"><span className="text-slate-600">Manutencao</span><span className="font-medium">80%</span></div><div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: '80%' }} /></div></div>
              <div><div className="flex justify-between text-sm mb-1"><span className="text-slate-600">Seguranca</span><span className="font-medium">85%</span></div><div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }} /></div></div>
              <div><div className="flex justify-between text-sm mb-1"><span className="text-slate-600">Conformidade Legal</span><span className="font-medium">88%</span></div><div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: '88%' }} /></div></div>
            </div>
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
                  <div className="absolute left-2.5 w-3 h-3 rounded-full bg-sky-500 border-2 border-white" />
                  <div><p className="text-sm text-slate-700">{event.evento}</p><p className="text-xs text-slate-400 mt-0.5">{event.data}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
