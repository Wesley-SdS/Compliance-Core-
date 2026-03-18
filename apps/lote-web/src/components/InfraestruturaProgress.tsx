'use client';

interface InfraItem {
  id: string;
  item: string;
  percentual: number;
  responsavel?: string;
  prazo?: string;
  observacoes?: string;
}

interface InfraestruturaProgressProps {
  itens: InfraItem[];
  onUpdate?: (id: string, percentual: number) => void;
}

const ITEM_LABELS: Record<string, string> = {
  agua: 'Rede de Água',
  esgoto: 'Rede de Esgoto',
  energia: 'Rede Elétrica',
  pavimentacao: 'Pavimentação',
  drenagem: 'Drenagem Pluvial',
  iluminacao: 'Iluminação Pública',
};

const ITEM_ICONS: Record<string, string> = {
  agua: '💧', esgoto: '🔧', energia: '⚡', pavimentacao: '🛤️', drenagem: '🌊', iluminacao: '💡',
};

export function InfraestruturaProgress({ itens, onUpdate }: InfraestruturaProgressProps) {
  const mediaGeral = itens.length > 0
    ? Math.round(itens.reduce((s, i) => s + i.percentual, 0) / itens.length)
    : 0;

  const progressColor = (pct: number) =>
    pct === 100 ? 'bg-emerald-500' : pct >= 70 ? 'bg-blue-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500';

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

  return (
    <div className="space-y-4">
      {/* General progress */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700">Progresso Geral da Infraestrutura</span>
          <span className="text-lg font-bold text-slate-800">{mediaGeral}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3">
          <div className={`h-3 rounded-full transition-all ${progressColor(mediaGeral)}`} style={{ width: `${mediaGeral}%` }} />
        </div>
      </div>

      {/* Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {itens.map(item => (
          <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{ITEM_ICONS[item.item] ?? '📦'}</span>
              <span className="text-sm font-semibold text-slate-700">{ITEM_LABELS[item.item] ?? item.item}</span>
              <span className={`ml-auto text-sm font-bold ${item.percentual === 100 ? 'text-emerald-600' : 'text-slate-700'}`}>
                {item.percentual}%
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
              <div className={`h-2 rounded-full transition-all ${progressColor(item.percentual)}`} style={{ width: `${item.percentual}%` }} />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              {item.responsavel && <span>Resp: {item.responsavel}</span>}
              {item.prazo && <span>Prazo: {formatDate(item.prazo)}</span>}
            </div>
            {onUpdate && item.percentual < 100 && (
              <div className="mt-2 flex items-center gap-2">
                <input type="range" min={0} max={100} value={item.percentual}
                  onChange={e => onUpdate(item.id, Number(e.target.value))}
                  className="flex-1 accent-rose-500 h-1" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
