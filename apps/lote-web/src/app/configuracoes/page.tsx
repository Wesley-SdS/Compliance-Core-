'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

const settingsSchema = z.object({
  razaoSocial: z.string().min(1, 'Razão social obrigatória'),
  cnpj: z.string().min(14, 'CNPJ obrigatório'),
  creci: z.string().optional(),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  asaasApiKey: z.string().optional(),
  clicksignApiKey: z.string().optional(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

const alertPrefs = [
  { id: 'parcela_vencendo', label: 'Parcela vencendo (D-5)', default: true },
  { id: 'parcela_vencida', label: 'Parcela vencida (D+1)', default: true },
  { id: 'doc_expirando', label: 'Documento expirando', default: true },
  { id: 'licenca_renewal', label: 'Renovação de licença', default: true },
  { id: 'infra_deadline', label: 'Prazo de infraestrutura', default: true },
  { id: 'dimob_deadline', label: 'Prazo DIMOB', default: true },
];

export default function ConfiguracoesPage() {
  const [activeSection, setActiveSection] = useState<'dados' | 'alertas' | 'integracoes' | 'equipe'>('dados');
  const [alerts, setAlerts] = useState<Record<string, boolean>>(
    Object.fromEntries(alertPrefs.map(a => [a.id, a.default]))
  );
  const [saveMsg, setSaveMsg] = useState('');
  const qc = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ['lote-config'],
    queryFn: () => apiFetch<any>('/loteamentos?page=1&limit=1').catch(() => null),
  });

  const saveMutation = useMutation({
    mutationFn: (data: SettingsForm) => apiFetch('/loteamentos', {
      method: 'POST',
      body: JSON.stringify({
        nome: data.razaoSocial,
        cnpjLoteador: data.cnpj,
        responsavel: data.razaoSocial,
        endereco: data.endereco || '',
        cidade: '',
        estado: '',
        areaTotal: 0,
        totalLotes: 0,
      }),
    }),
    onSuccess: () => {
      setSaveMsg('Dados salvos com sucesso!');
      qc.invalidateQueries({ queryKey: ['lote-config'] });
      setTimeout(() => setSaveMsg(''), 3000);
    },
    onError: () => setSaveMsg('Erro ao salvar. Tente novamente.'),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      razaoSocial: '',
      cnpj: '',
      creci: '',
      email: '',
      telefone: '',
      endereco: '',
    },
  });

  function onSubmit(data: SettingsForm) {
    saveMutation.mutate(data);
  }

  const sections = [
    { id: 'dados' as const, label: 'Dados da Loteadora' },
    { id: 'alertas' as const, label: 'Preferências de Alerta' },
    { id: 'integracoes' as const, label: 'Integrações' },
    { id: 'equipe' as const, label: 'Equipe' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Configurações</h2>
        <p className="text-sm text-slate-500 mt-1">Gerencie dados, alertas e integrações</p>
      </div>

      {saveMsg && (
        <div className={`p-3 rounded-lg text-sm ${saveMsg.includes('Erro') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {saveMsg}
        </div>
      )}

      <div className="flex gap-6">
        <nav className="w-48 flex-shrink-0">
          <div className="space-y-1">
            {sections.map(s => (
              <button key={s.id} type="button" onClick={() => setActiveSection(s.id)}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                  activeSection === s.id ? 'bg-rose-50 text-rose-600 font-medium' : 'text-slate-600 hover:bg-slate-100'
                }`}>
                {s.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="flex-1">
          {activeSection === 'dados' && (
            <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-800">Dados da Loteadora</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Razão Social</label>
                  <input {...register('razaoSocial')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                  {errors.razaoSocial && <p className="text-xs text-red-500 mt-1">{errors.razaoSocial.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">CNPJ</label>
                  <input {...register('cnpj')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">CRECI</label>
                  <input {...register('creci')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                  <input type="email" {...register('email')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Telefone</label>
                  <input {...register('telefone')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Endereço</label>
                  <input {...register('endereco')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                </div>
              </div>
              <button type="submit" disabled={saveMutation.isPending}
                className="px-6 py-2 bg-rose-500 text-white text-sm font-medium rounded-lg hover:bg-rose-600 disabled:opacity-50">
                {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </form>
          )}

          {activeSection === 'alertas' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Preferências de Alerta</h3>
              <div className="space-y-3">
                {alertPrefs.map(pref => (
                  <label key={pref.id} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={alerts[pref.id] ?? false}
                      onChange={e => setAlerts(prev => ({ ...prev, [pref.id]: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-300 text-rose-500 focus:ring-rose-500" />
                    <span className="text-sm text-slate-700">{pref.label}</span>
                  </label>
                ))}
              </div>
              <button type="button" className="mt-4 px-6 py-2 bg-rose-500 text-white text-sm font-medium rounded-lg hover:bg-rose-600">
                Salvar Preferências
              </button>
            </div>
          )}

          {activeSection === 'integracoes' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">Gateway de Pagamento — Asaas</h3>
                <p className="text-xs text-slate-500 mb-4">Conecte sua conta Asaas para gerar boletos automaticamente</p>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">API Key</label>
                  <input {...register('asaasApiKey')} type="password"
                    className="w-full max-w-md px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="$aas_..." />
                </div>
                <button type="button" className="mt-3 px-4 py-2 bg-rose-500 text-white text-sm font-medium rounded-lg hover:bg-rose-600">
                  Conectar
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">Assinatura Digital — Clicksign</h3>
                <p className="text-xs text-slate-500 mb-4">Assine contratos digitalmente</p>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">API Key</label>
                  <input {...register('clicksignApiKey')} type="password"
                    className="w-full max-w-md px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="Sua API key Clicksign" />
                </div>
                <button type="button" className="mt-3 px-4 py-2 bg-rose-500 text-white text-sm font-medium rounded-lg hover:bg-rose-600">
                  Conectar
                </button>
              </div>
            </div>
          )}

          {activeSection === 'equipe' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Equipe</h3>
              <p className="text-sm text-slate-500">Gerenciamento de equipe disponível em breve.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
