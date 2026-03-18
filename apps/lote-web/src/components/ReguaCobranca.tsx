'use client';

import { useState } from 'react';

interface EtapaRegua {
  dias: number;
  canal: string;
  template: string;
}

interface ReguaCobrancaProps {
  etapas: EtapaRegua[];
  onSave?: (etapas: EtapaRegua[]) => void;
}

const CANAIS = ['email', 'whatsapp', 'sms', 'carta'];

export function ReguaCobranca({ etapas: initialEtapas, onSave }: ReguaCobrancaProps) {
  const [etapas, setEtapas] = useState<EtapaRegua[]>(initialEtapas.length > 0 ? initialEtapas : [
    { dias: -5, canal: 'email', template: 'Lembrete: sua parcela vence em 5 dias.' },
    { dias: 1, canal: 'whatsapp', template: 'Sua parcela venceu ontem. Regularize para evitar juros.' },
    { dias: 7, canal: 'email', template: 'Parcela em atraso há 7 dias. Entre em contato.' },
    { dias: 30, canal: 'carta', template: 'Notificação extrajudicial: parcela em atraso há 30 dias.' },
  ]);

  function updateEtapa(index: number, field: keyof EtapaRegua, value: any) {
    setEtapas(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
  }

  function addEtapa() {
    setEtapas(prev => [...prev, { dias: 0, canal: 'email', template: '' }]);
  }

  function removeEtapa(index: number) {
    setEtapas(prev => prev.filter((_, i) => i !== index));
  }

  const diaLabel = (d: number) => d < 0 ? `D${d}` : d === 0 ? 'D' : `D+${d}`;
  const diaColor = (d: number) => d < 0 ? 'bg-blue-100 text-blue-700 border-blue-300' : d <= 1 ? 'bg-amber-100 text-amber-700 border-amber-300' : d <= 7 ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-red-100 text-red-700 border-red-300';

  return (
    <div className="space-y-6">
      {/* Visual timeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Régua de Cobrança</h3>
        <div className="relative">
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-200" />
          <div className="flex justify-between relative">
            {etapas.sort((a, b) => a.dias - b.dias).map((etapa, i) => (
              <div key={i} className="flex flex-col items-center" style={{ minWidth: '80px' }}>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${diaColor(etapa.dias)}`}>
                  {diaLabel(etapa.dias)}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 text-center">{etapa.canal}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-400">
          <span>D = dia do vencimento</span>
          <span>|</span>
          <span>Todas as cobranças respeitam horários e linguagem do CDC</span>
        </div>
      </div>

      {/* Editable list */}
      <div className="space-y-3">
        {etapas.map((etapa, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg border flex items-center justify-center text-xs font-bold flex-shrink-0 ${diaColor(etapa.dias)}`}>
                {diaLabel(etapa.dias)}
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Dias (relativo ao vencimento)</label>
                  <input type="number" value={etapa.dias} onChange={e => updateEtapa(i, 'dias', Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Canal</label>
                  <select value={etapa.canal} onChange={e => updateEtapa(i, 'canal', e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500">
                    {CANAIS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <button type="button" onClick={() => removeEtapa(i)}
                    className="px-3 py-1.5 text-xs text-red-600 hover:text-red-700 font-medium border border-red-200 rounded-lg hover:bg-red-50">
                    Remover
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-3 ml-14">
              <label className="block text-xs text-slate-500 mb-1">Template da mensagem</label>
              <textarea value={etapa.template} onChange={e => updateEtapa(i, 'template', e.target.value)}
                rows={2} className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={addEtapa}
          className="px-4 py-2 border border-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 text-slate-700">
          + Adicionar Etapa
        </button>
        {onSave && (
          <button type="button" onClick={() => onSave(etapas)}
            className="px-4 py-2 bg-rose-500 text-white text-sm font-medium rounded-lg hover:bg-rose-600">
            Salvar Régua
          </button>
        )}
      </div>
    </div>
  );
}
