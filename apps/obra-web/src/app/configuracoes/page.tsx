'use client';

import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';

const DOCUMENT_CATEGORIES = [
  { key: 'alvara', label: 'Alvara' },
  { key: 'art_rrt', label: 'ART/RRT' },
  { key: 'licenca_ambiental', label: 'Licenca Ambiental' },
  { key: 'seguro', label: 'Seguro' },
  { key: 'nr_treinamento', label: 'NR Treinamento' },
  { key: 'diario_obra', label: 'Diario de Obra' },
  { key: 'epi_registro', label: 'Registro EPI' },
  { key: 'pcmso_ppra', label: 'PCMSO/PPRA' },
  { key: 'crea_registro', label: 'Registro CREA' },
  { key: 'projeto_aprovado', label: 'Projeto Aprovado' },
  { key: 'habite_se', label: 'Habite-se' },
];

const NOTIFICATION_PREFS = [
  { key: 'emailAlerts', label: 'Alertas por e-mail', description: 'Receber alertas de compliance por e-mail' },
  { key: 'smsAlerts', label: 'Alertas por SMS', description: 'Receber alertas criticos via SMS' },
  { key: 'documentExpiry', label: 'Vencimento de documentos', description: 'Notificar sobre documentos proximos ao vencimento' },
  { key: 'weeklyReport', label: 'Relatorio semanal', description: 'Receber resumo semanal de compliance' },
  { key: 'scoreChanges', label: 'Mudancas no score', description: 'Notificar quando o score sofrer alteracoes significativas' },
];

export default function ConfiguracoesPage() {
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    nome: '',
    email: '',
    cnpj: '',
    creaCau: '',
  });
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    emailAlerts: true,
    smsAlerts: false,
    documentExpiry: true,
    weeklyReport: true,
    scoreChanges: true,
  });

  const inputClass =
    'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1';

  function toggleNotification(key: string) {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Simulated save — replace with actual mutation when API is ready
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast({ title: 'Configuracoes salvas', description: 'Suas preferencias foram atualizadas com sucesso.' });
    } catch {
      toast({ title: 'Erro ao salvar', description: 'Nao foi possivel salvar as configuracoes.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Configuracoes</h2>
        <p className="text-sm text-slate-500 mt-1">Gerencie seu perfil e preferencias</p>
      </div>

      {/* Profile */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <h3 className="text-sm font-semibold text-slate-800">Perfil</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Nome</label>
            <input
              type="text"
              value={profile.nome}
              onChange={(e) => setProfile({ ...profile, nome: e.target.value })}
              className={inputClass}
              placeholder="Seu nome completo"
            />
          </div>

          <div>
            <label className={labelClass}>E-mail</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className={inputClass}
              placeholder="email@empresa.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>CNPJ</label>
            <input
              type="text"
              value={profile.cnpj}
              onChange={(e) => setProfile({ ...profile, cnpj: e.target.value })}
              className={inputClass}
              placeholder="00.000.000/0000-00"
            />
          </div>

          <div>
            <label className={labelClass}>CREA/CAU</label>
            <input
              type="text"
              value={profile.creaCau}
              onChange={(e) => setProfile({ ...profile, creaCau: e.target.value })}
              className={inputClass}
              placeholder="CREA-XX 000000"
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">Preferencias de Notificacao</h3>

        <div className="space-y-4">
          {NOTIFICATION_PREFS.map((pref) => (
            <div key={pref.key} className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm font-medium text-slate-700">{pref.label}</div>
                <div className="text-xs text-slate-500">{pref.description}</div>
              </div>
              <button
                type="button"
                onClick={() => toggleNotification(pref.key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications[pref.key] ? 'bg-amber-500' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications[pref.key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Document Categories */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">Categorias de Documentos</h3>
        <p className="text-xs text-slate-500">Categorias disponiveis para classificacao de documentos</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {DOCUMENT_CATEGORIES.map((cat) => (
            <div
              key={cat.key}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50"
            >
              <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm text-slate-700">{cat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Salvando...' : 'Salvar Configuracoes'}
        </button>
      </div>
    </div>
  );
}
