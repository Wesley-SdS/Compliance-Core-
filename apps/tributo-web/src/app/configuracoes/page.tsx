'use client';

import { useState } from 'react';

export default function ConfiguracoesPage() {
  const [apiUrl, setApiUrl] = useState(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003');
  const [saved, setSaved] = useState(false);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Configuracoes</h2>
        <p className="text-sm text-slate-500 mt-1">Gerencie as configuracoes da plataforma</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Conexao com API</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">URL da API</label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => { setApiUrl(e.target.value); setSaved(false); }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-slate-400 mt-1">Configurado via NEXT_PUBLIC_API_URL no .env</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Aliquotas Padrao (Reforma LC 214/2025)</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">CBS (%)</label>
              <input type="number" defaultValue="8.8" step="0.1" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" readOnly />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">IBS (%)</label>
              <input type="number" defaultValue="17.7" step="0.1" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" readOnly />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Aliquota Total (%)</label>
              <input type="number" defaultValue="26.5" step="0.1" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" readOnly />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Valores de referencia conforme LC 214/2025. Aliquotas customizaveis por simulacao.</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Notificacoes</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500" />
              <span className="text-sm text-slate-700">Alertas de vencimento de obrigacoes</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500" />
              <span className="text-sm text-slate-700">Novas legislacoes de alto impacto</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500" />
              <span className="text-sm text-slate-700">Resumo semanal por email</span>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-2">Sobre</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-slate-500">Plataforma</dt><dd className="font-medium text-slate-700">TributoSim</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Versao</dt><dd className="font-medium text-slate-700">0.1.0</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Vertical</dt><dd className="font-medium text-slate-700">Tributo</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Framework</dt><dd className="font-medium text-slate-700">ComplianceCore</dd></div>
        </dl>
      </div>
    </div>
  );
}
