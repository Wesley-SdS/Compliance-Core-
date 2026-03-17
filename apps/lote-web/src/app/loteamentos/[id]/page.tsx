'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const tabs = ['Visao Geral', 'Lotes', 'Compradores', 'Financeiro', 'Score', 'Documentos', 'Timeline'] as const;
type Tab = (typeof tabs)[number];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3006';

interface LoteamentoDetail {
  id: string; nome: string; cidade: string; endereco: string; area: string;
  lotes: number; vendidos: number; registro: string; responsavel: string; score: number; level: string;
}
interface Lote { id: string; quadra: string; lote: string; area: string; valor: string; status: string; comprador: string; }
interface Comprador { id: string; nome: string; cpf: string; lote: string; contrato: string; parcelas: string; adimplente: boolean; }
interface Financeiro { vgv: string; recebido: string; aReceber: string; inadimplencia: string; }
interface Document { id: string; nome: string; status: string; vencimento: string; }
interface TimelineEvent { id: string; data: string; evento: string; tipo: string; }

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    valido: 'bg-green-100 text-green-700', vendido: 'bg-green-100 text-green-700', assinado: 'bg-green-100 text-green-700',
    reservado: 'bg-amber-100 text-amber-700', pendente: 'bg-amber-100 text-amber-700', vencendo: 'bg-amber-100 text-amber-700',
    disponivel: 'bg-blue-100 text-blue-700', expirado: 'bg-red-100 text-red-700',
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>{status}</span>;
}

export default function LoteamentoDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<Tab>('Visao Geral');
  const [loading, setLoading] = useState(true);
  const [loteamento, setLoteamento] = useState<LoteamentoDetail | null>(null);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [compradores, setCompradores] = useState<Comprador[]>([]);
  const [financeiro, setFinanceiro] = useState<Financeiro>({ vgv: '-', recebido: '-', aReceber: '-', inadimplencia: '-' });
  const [documents, setDocuments] = useState<Document[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const results = await Promise.allSettled([
          fetch(`${API_URL}/loteamentos/${id}`).then(r => r.ok ? r.json() : null),
          fetch(`${API_URL}/loteamentos/${id}/lotes`).then(r => r.ok ? r.json() : []),
          fetch(`${API_URL}/loteamentos/${id}/compradores`).then(r => r.ok ? r.json() : []),
          fetch(`${API_URL}/loteamentos/${id}/financeiro`).then(r => r.ok ? r.json() : null),
          fetch(`${API_URL}/loteamentos/${id}/documentos`).then(r => r.ok ? r.json() : []),
          fetch(`${API_URL}/loteamentos/${id}/timeline`).then(r => r.ok ? r.json() : []),
        ]);
        if (results[0].status === 'fulfilled' && results[0].value) setLoteamento(results[0].value);
        if (results[1].status === 'fulfilled') setLotes(results[1].value);
        if (results[2].status === 'fulfilled') setCompradores(results[2].value);
        if (results[3].status === 'fulfilled' && results[3].value) setFinanceiro(results[3].value);
        if (results[4].status === 'fulfilled') setDocuments(results[4].value);
        if (results[5].status === 'fulfilled') setTimeline(results[5].value);
      } catch { /* defaults */ } finally { setLoading(false); }
    }
    fetchData();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="text-sm text-slate-500">Carregando dados do loteamento...</div></div>;
  if (!loteamento) return <div className="flex flex-col items-center justify-center py-20"><p className="text-sm text-slate-500">Loteamento nao encontrado ou API indisponivel.</p><Link href="/loteamentos" className="mt-4 text-sm text-rose-600 hover:text-rose-700 font-medium">Voltar para loteamentos</Link></div>;

  const vendaPercent = (loteamento.vendidos / loteamento.lotes) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/loteamentos" className="hover:text-rose-600">Loteamentos</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">{loteamento.nome}</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">{loteamento.nome}</h2>
            <p className="text-sm text-slate-500 mt-1">{loteamento.endereco} - {loteamento.cidade}</p>
            <p className="text-sm text-slate-500">Area: {loteamento.area} | {loteamento.lotes} lotes</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{loteamento.score}</div>
            <div className="text-xs font-medium text-blue-600">{loteamento.level}</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Vendas</span>
            <span>{loteamento.vendidos}/{loteamento.lotes} ({vendaPercent.toFixed(0)}%)</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5">
            <div className="bg-rose-500 h-2.5 rounded-full" style={{ width: `${vendaPercent}%` }} />
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-rose-500 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'Visao Geral' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Informacoes do Loteamento</h3>
            <dl className="space-y-3">
              <div className="flex justify-between"><dt className="text-sm text-slate-500">Nome</dt><dd className="text-sm font-medium text-slate-700">{loteamento.nome}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-slate-500">Cidade</dt><dd className="text-sm font-medium text-slate-700">{loteamento.cidade}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-slate-500">Area Total</dt><dd className="text-sm font-medium text-slate-700">{loteamento.area}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-slate-500">Total de Lotes</dt><dd className="text-sm font-medium text-slate-700">{loteamento.lotes}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-slate-500">Registro</dt><dd className="text-sm font-medium text-slate-700">{loteamento.registro}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-slate-500">Responsavel</dt><dd className="text-sm font-medium text-slate-700">{loteamento.responsavel}</dd></div>
            </dl>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Resumo Financeiro</h3>
            <dl className="space-y-3">
              <div className="flex justify-between"><dt className="text-sm text-slate-500">VGV Total</dt><dd className="text-sm font-bold text-slate-700 font-mono">{financeiro.vgv}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-slate-500">Recebido</dt><dd className="text-sm font-bold text-green-600 font-mono">{financeiro.recebido}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-slate-500">A Receber</dt><dd className="text-sm font-bold text-amber-600 font-mono">{financeiro.aReceber}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-slate-500">Inadimplencia</dt><dd className="text-sm font-bold text-red-600">{financeiro.inadimplencia}</dd></div>
            </dl>
          </div>
        </div>
      )}

      {activeTab === 'Lotes' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Quadra/Lote</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Area</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Valor</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Comprador</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {lotes.map((lote) => (
                <tr key={lote.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">Qd. {lote.quadra} - Lt. {lote.lote}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{lote.area}</td>
                  <td className="px-6 py-4 text-sm text-slate-700 font-mono">{lote.valor}</td>
                  <td className="px-6 py-4"><StatusBadge status={lote.status} /></td>
                  <td className="px-6 py-4 text-sm text-slate-500">{lote.comprador}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Compradores' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Nome</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">CPF</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Lote</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Contrato</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Parcelas</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Situacao</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {compradores.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">{c.nome}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-mono">{c.cpf}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{c.lote}</td>
                  <td className="px-6 py-4"><StatusBadge status={c.contrato} /></td>
                  <td className="px-6 py-4 text-sm text-slate-500">{c.parcelas}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.adimplente ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {c.adimplente ? 'Adimplente' : 'Inadimplente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Financeiro' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-xs text-slate-500 font-medium">VGV Total</div><div className="text-lg font-bold text-slate-800 mt-1 font-mono">{financeiro.vgv}</div></div>
            <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-xs text-slate-500 font-medium">Recebido</div><div className="text-lg font-bold text-green-600 mt-1 font-mono">{financeiro.recebido}</div></div>
            <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-xs text-slate-500 font-medium">A Receber</div><div className="text-lg font-bold text-amber-600 mt-1 font-mono">{financeiro.aReceber}</div></div>
            <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-xs text-slate-500 font-medium">Inadimplencia</div><div className="text-lg font-bold text-red-600 mt-1">{financeiro.inadimplencia}</div></div>
          </div>
        </div>
      )}

      {activeTab === 'Score' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600">{loteamento.score}</div>
              <div className="text-sm font-medium text-blue-600 mt-1">{loteamento.level}</div>
            </div>
            <div className="flex-1 space-y-3">
              <div><div className="flex justify-between text-sm mb-1"><span className="text-slate-600">Documentacao</span><span className="font-medium">90%</span></div><div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: '90%' }} /></div></div>
              <div><div className="flex justify-between text-sm mb-1"><span className="text-slate-600">Registros</span><span className="font-medium">85%</span></div><div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }} /></div></div>
              <div><div className="flex justify-between text-sm mb-1"><span className="text-slate-600">Contratos</span><span className="font-medium">88%</span></div><div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: '88%' }} /></div></div>
              <div><div className="flex justify-between text-sm mb-1"><span className="text-slate-600">DIMOB</span><span className="font-medium">80%</span></div><div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-amber-500 h-2 rounded-full" style={{ width: '80%' }} /></div></div>
            </div>
          </div>
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

      {activeTab === 'Timeline' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Historico de Eventos</h3>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
            <div className="space-y-6">
              {timeline.map((event) => (
                <div key={event.id} className="relative flex items-start gap-4 pl-10">
                  <div className="absolute left-2.5 w-3 h-3 rounded-full bg-rose-500 border-2 border-white" />
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
