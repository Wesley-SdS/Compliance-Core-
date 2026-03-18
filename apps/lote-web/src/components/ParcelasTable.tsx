'use client';

interface Parcela {
  id?: string;
  numero: number;
  valor: number;
  amortizacao?: number;
  juros?: number;
  saldo_devedor?: number;
  vencimento: string;
  status: 'PENDENTE' | 'PAGO' | 'ATRASADO';
  data_pagamento?: string;
  valor_pago?: number;
}

interface ParcelasTableProps {
  parcelas: Parcela[];
  onPagar?: (parcela: Parcela) => void;
  onBoleto?: (parcela: Parcela) => void;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  PAGO: { bg: 'bg-green-100', text: 'text-green-700', label: 'Pago' },
  PENDENTE: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pendente' },
  ATRASADO: { bg: 'bg-red-100', text: 'text-red-700', label: 'Atrasado' },
};

export function ParcelasTable({ parcelas, onPagar, onBoleto }: ParcelasTableProps) {
  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

  const pagas = parcelas.filter(p => p.status === 'PAGO').length;
  const atrasadas = parcelas.filter(p => p.status === 'ATRASADO').length;
  const totalPago = parcelas.filter(p => p.status === 'PAGO').reduce((s, p) => s + (p.valor_pago ?? p.valor), 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-slate-600">{pagas} pagas</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-slate-600">{parcelas.length - pagas - atrasadas} pendentes</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-slate-600">{atrasadas} atrasadas</span>
        </div>
        <div className="ml-auto text-xs text-slate-500">
          Total pago: <span className="font-medium text-green-600 font-mono">{formatCurrency(totalPago)}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">#</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Vencimento</th>
              <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Valor</th>
              <th className="text-center text-xs font-medium text-slate-500 uppercase px-4 py-3">Status</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Pagamento</th>
              {(onPagar || onBoleto) && <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {parcelas.map(p => {
              const style = STATUS_STYLES[p.status] ?? STATUS_STYLES.PENDENTE;
              return (
                <tr key={p.numero} className={`hover:bg-slate-50 ${p.status === 'ATRASADO' ? 'bg-red-50/50' : ''}`}>
                  <td className="px-4 py-3 text-sm text-slate-600">{p.numero}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{formatDate(p.vencimento)}</td>
                  <td className="px-4 py-3 text-sm text-right font-mono text-slate-700">{formatCurrency(p.valor)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {p.data_pagamento ? formatDate(p.data_pagamento) : '—'}
                  </td>
                  {(onPagar || onBoleto) && (
                    <td className="px-4 py-3 text-right space-x-2">
                      {p.status !== 'PAGO' && onPagar && (
                        <button type="button" onClick={() => onPagar(p)}
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Pagar</button>
                      )}
                      {p.status !== 'PAGO' && onBoleto && (
                        <button type="button" onClick={() => onBoleto(p)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium">Boleto</button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
