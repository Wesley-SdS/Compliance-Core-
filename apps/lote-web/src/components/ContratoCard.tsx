'use client';

import Link from 'next/link';

interface ContratoCardProps {
  contrato: {
    id: string;
    comprador_nome?: string;
    lote_quadra?: string;
    lote_numero?: string;
    valor_total: number;
    valor_entrada: number;
    numero_parcelas: number;
    sistema: 'PRICE' | 'SAC';
    status: 'ATIVO' | 'QUITADO' | 'DISTRATADO' | 'INADIMPLENTE';
    parcelas_pagas?: number;
    parcelas_restantes?: number;
  };
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  ATIVO: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Ativo' },
  QUITADO: { bg: 'bg-green-100', text: 'text-green-700', label: 'Quitado' },
  DISTRATADO: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Distratado' },
  INADIMPLENTE: { bg: 'bg-red-100', text: 'text-red-700', label: 'Inadimplente' },
};

export function ContratoCard({ contrato }: ContratoCardProps) {
  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const style = STATUS_STYLES[contrato.status] ?? STATUS_STYLES.ATIVO;
  const parcelasPagas = contrato.parcelas_pagas ?? 0;
  const progresso = contrato.numero_parcelas > 0 ? (parcelasPagas / contrato.numero_parcelas) * 100 : 0;

  return (
    <Link href={`/contratos/${contrato.id}`} className="block">
      <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-sm font-semibold text-slate-800">{contrato.comprador_nome ?? '—'}</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Qd. {contrato.lote_quadra} — Lt. {contrato.lote_numero}
            </div>
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
            {style.label}
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Valor Total</span>
            <span className="font-medium text-slate-700 font-mono">{formatCurrency(contrato.valor_total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Entrada</span>
            <span className="font-medium text-slate-700 font-mono">{formatCurrency(contrato.valor_entrada)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Sistema</span>
            <span className="font-medium text-slate-700">{contrato.sistema} — {contrato.numero_parcelas}x</span>
          </div>
        </div>

        {contrato.status === 'ATIVO' && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
              <span>Parcelas</span>
              <span>{parcelasPagas}/{contrato.numero_parcelas}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${progresso}%` }} />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
