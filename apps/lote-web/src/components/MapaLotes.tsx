'use client';

import { useState, useMemo } from 'react';

interface Lote {
  id: string;
  quadra: string;
  numero: string;
  area_m2: number;
  valor_venda: number;
  status: 'DISPONIVEL' | 'RESERVADO' | 'VENDIDO' | 'QUITADO';
  comprador_id?: string;
  comprador_nome?: string;
}

interface MapaLotesProps {
  lotes: Lote[];
  onSelectLote?: (lote: Lote) => void;
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  DISPONIVEL: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', label: 'Disponível' },
  RESERVADO: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', label: 'Reservado' },
  VENDIDO: { bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-700', label: 'Vendido' },
  QUITADO: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', label: 'Quitado' },
};

export function MapaLotes({ lotes, onSelectLote }: MapaLotesProps) {
  const [selectedLote, setSelectedLote] = useState<Lote | null>(null);
  const [filterQuadra, setFilterQuadra] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Group lots by quadra
  const quadras = useMemo(() => {
    const grouped: Record<string, Lote[]> = {};
    for (const lote of lotes) {
      const q = lote.quadra;
      if (!grouped[q]) grouped[q] = [];
      grouped[q].push(lote);
    }
    // Sort quadras and lotes within each quadra
    const sorted = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
    return sorted.map(([quadra, lots]) => ({
      quadra,
      lotes: lots.sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true })),
    }));
  }, [lotes]);

  const quadraNames = useMemo(() => quadras.map(q => q.quadra), [quadras]);

  const filteredQuadras = useMemo(() => {
    return quadras
      .filter(q => !filterQuadra || q.quadra === filterQuadra)
      .map(q => ({
        ...q,
        lotes: q.lotes.filter(l => !filterStatus || l.status === filterStatus),
      }))
      .filter(q => q.lotes.length > 0);
  }, [quadras, filterQuadra, filterStatus]);

  // Stats
  const stats = useMemo(() => {
    const total = lotes.length;
    const disponiveis = lotes.filter(l => l.status === 'DISPONIVEL').length;
    const reservados = lotes.filter(l => l.status === 'RESERVADO').length;
    const vendidos = lotes.filter(l => l.status === 'VENDIDO').length;
    const quitados = lotes.filter(l => l.status === 'QUITADO').length;
    return { total, disponiveis, reservados, vendidos, quitados };
  }, [lotes]);

  function handleClick(lote: Lote) {
    setSelectedLote(lote);
    onSelectLote?.(lote);
  }

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-4">
      {/* Legend + Stats */}
      <div className="flex flex-wrap items-center gap-4">
        {Object.entries(STATUS_COLORS).map(([status, colors]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${colors.bg} ${colors.border} border`} />
            <span className="text-xs text-slate-600">{colors.label}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
          <span>{stats.total} lotes</span>
          <span>•</span>
          <span className="text-emerald-600">{stats.disponiveis} disponíveis</span>
          <span>•</span>
          <span className="text-rose-600">{stats.vendidos + stats.quitados} vendidos</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={filterQuadra}
          onChange={e => setFilterQuadra(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
        >
          <option value="">Todas as quadras</option>
          {quadraNames.map(q => <option key={q} value={q}>Quadra {q}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_COLORS).map(([s, c]) => <option key={s} value={s}>{c.label}</option>)}
        </select>
      </div>

      {/* Grid per quadra */}
      <div className="space-y-6">
        {filteredQuadras.map(({ quadra, lotes: quadraLotes }) => (
          <div key={quadra}>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Quadra {quadra}</h4>
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5">
              {quadraLotes.map(lote => {
                const colors = STATUS_COLORS[lote.status] ?? STATUS_COLORS.DISPONIVEL;
                const isSelected = selectedLote?.id === lote.id;
                return (
                  <button
                    key={lote.id}
                    type="button"
                    onClick={() => handleClick(lote)}
                    className={`relative aspect-square rounded-md border-2 flex flex-col items-center justify-center transition-all hover:scale-105 hover:shadow-md ${colors.bg} ${isSelected ? 'border-slate-800 ring-2 ring-slate-400' : colors.border}`}
                    title={`Lote ${lote.numero} - ${colors.label}`}
                  >
                    <span className={`text-xs font-bold ${colors.text}`}>{lote.numero}</span>
                    <span className="text-[9px] text-slate-400">{lote.area_m2}m²</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Selected lote sidebar */}
      {selectedLote && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 mt-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-800">
                Quadra {selectedLote.quadra} — Lote {selectedLote.numero}
              </h4>
              <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${STATUS_COLORS[selectedLote.status].bg} ${STATUS_COLORS[selectedLote.status].text}`}>
                {STATUS_COLORS[selectedLote.status].label}
              </div>
            </div>
            <button type="button" onClick={() => setSelectedLote(null)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
          </div>
          <dl className="mt-3 space-y-2">
            <div className="flex justify-between">
              <dt className="text-xs text-slate-500">Área</dt>
              <dd className="text-xs font-medium text-slate-700">{selectedLote.area_m2} m²</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-xs text-slate-500">Valor</dt>
              <dd className="text-xs font-medium text-slate-700 font-mono">{formatCurrency(selectedLote.valor_venda)}</dd>
            </div>
            {selectedLote.comprador_nome && (
              <div className="flex justify-between">
                <dt className="text-xs text-slate-500">Comprador</dt>
                <dd className="text-xs font-medium text-slate-700">{selectedLote.comprador_nome}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
