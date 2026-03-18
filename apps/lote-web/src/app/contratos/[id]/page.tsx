'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useContrato, useRegistrarPagamento, useDistrato, useParcelas } from '@/hooks/use-api';
import { ComplianceBadge } from '@compliancecore/ui';
import { ParcelasTable } from '@/components/ParcelasTable';
import { SimuladorPriceSAC } from '@/components/SimuladorPriceSAC';
import { formatCurrency, formatDate, formatPercent } from '@/lib/format';

export default function ContratoDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<'parcelas' | 'simulador'>('parcelas');
  const [showPagamento, setShowPagamento] = useState(false);
  const [pagamentoData, setPagamentoData] = useState({ parcelaNumero: 0, valorPago: 0, dataPagamento: '' });

  const { data: contrato, isLoading } = useContrato(id);
  const registrarPagamento = useRegistrarPagamento(id);
  const distrato = useDistrato(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded" />
        <div className="h-40 bg-slate-100 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!contrato) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-slate-500">Contrato não encontrado.</p>
        <Link href="/loteamentos" className="mt-4 text-sm text-rose-600 hover:text-rose-700 font-medium">Voltar</Link>
      </div>
    );
  }

  const parcelas = contrato.parcelas ?? [];
  const pagas = parcelas.filter((p: any) => p.status === 'PAGO').length;
  const progresso = contrato.numero_parcelas > 0 ? (pagas / contrato.numero_parcelas) * 100 : 0;

  const statusStyles: Record<string, string> = {
    ATIVO: 'bg-blue-100 text-blue-700',
    QUITADO: 'bg-green-100 text-green-700',
    DISTRATADO: 'bg-slate-100 text-slate-700',
    INADIMPLENTE: 'bg-red-100 text-red-700',
  };

  function handlePagar(parcela: any) {
    setPagamentoData({ parcelaNumero: parcela.numero, valorPago: parcela.valor, dataPagamento: new Date().toISOString().split('T')[0] });
    setShowPagamento(true);
  }

  function submitPagamento() {
    registrarPagamento.mutate(pagamentoData, {
      onSuccess: () => setShowPagamento(false),
    });
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/loteamentos" className="hover:text-rose-600">Loteamentos</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Contrato</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              {contrato.comprador_nome ?? 'Contrato'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Qd. {contrato.lote_quadra} — Lt. {contrato.lote_numero}
            </p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusStyles[contrato.status] ?? 'bg-slate-100 text-slate-700'}`}>
            {contrato.status}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
          <div>
            <div className="text-xs text-slate-500">Valor Total</div>
            <div className="text-sm font-bold text-slate-700 font-mono">{formatCurrency(contrato.valor_total)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Entrada</div>
            <div className="text-sm font-bold text-slate-700 font-mono">{formatCurrency(contrato.valor_entrada)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Parcelas</div>
            <div className="text-sm font-bold text-slate-700">{pagas}/{contrato.numero_parcelas}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Sistema</div>
            <div className="text-sm font-bold text-slate-700">{contrato.sistema}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Taxa Mensal</div>
            <div className="text-sm font-bold text-slate-700">{contrato.taxa_juros_mensal}%</div>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Progresso</span>
            <span>{progresso.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="bg-rose-500 h-2 rounded-full" style={{ width: `${progresso}%` }} />
          </div>
        </div>

        {/* Actions */}
        {contrato.status === 'ATIVO' && (
          <div className="mt-4 flex gap-3">
            <button type="button" onClick={() => setShowPagamento(true)}
              className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600">
              Registrar Pagamento
            </button>
            <button type="button" onClick={() => { if (confirm('Confirma distrato?')) distrato.mutate(); }}
              className="px-4 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50">
              Distrato
            </button>
          </div>
        )}
      </div>

      {/* Payment modal */}
      {showPagamento && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Registrar Pagamento</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Nº Parcela</label>
              <input type="number" value={pagamentoData.parcelaNumero}
                onChange={e => setPagamentoData(p => ({ ...p, parcelaNumero: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Valor Pago (R$)</label>
              <input type="number" step="0.01" value={pagamentoData.valorPago}
                onChange={e => setPagamentoData(p => ({ ...p, valorPago: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Data</label>
              <input type="date" value={pagamentoData.dataPagamento}
                onChange={e => setPagamentoData(p => ({ ...p, dataPagamento: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button type="button" onClick={submitPagamento} disabled={registrarPagamento.isPending}
              className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 disabled:opacity-50">
              {registrarPagamento.isPending ? 'Salvando...' : 'Confirmar'}
            </button>
            <button type="button" onClick={() => setShowPagamento(false)}
              className="px-4 py-2 border border-slate-300 text-sm rounded-lg hover:bg-slate-50">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Tab toggle */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6">
          <button type="button" onClick={() => setActiveTab('parcelas')}
            className={`pb-3 text-sm font-medium border-b-2 ${activeTab === 'parcelas' ? 'border-rose-500 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            Parcelas
          </button>
          <button type="button" onClick={() => setActiveTab('simulador')}
            className={`pb-3 text-sm font-medium border-b-2 ${activeTab === 'simulador' ? 'border-rose-500 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            Simulador
          </button>
        </nav>
      </div>

      {activeTab === 'parcelas' && (
        <ParcelasTable
          parcelas={parcelas.map((p: any) => ({
            ...p,
            valor: p.valor ?? p.prestacao,
            vencimento: p.vencimento ?? p.data_vencimento,
          }))}
          onPagar={handlePagar}
        />
      )}

      {activeTab === 'simulador' && (
        <SimuladorPriceSAC
          valorInicial={contrato.valor_total}
        />
      )}
    </div>
  );
}
