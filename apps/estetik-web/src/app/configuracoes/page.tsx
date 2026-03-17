'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { useClinicas } from '@/hooks/use-clinicas';

interface NotificationPrefs {
  email: boolean;
  push: boolean;
  inApp: boolean;
  alertaDocumento: boolean;
  alertaLicenca: boolean;
  alertaVistoria: boolean;
  alertaPrazo: boolean;
}

function ConfigSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div><div className="h-8 bg-gray-200 rounded w-48" /><div className="h-4 bg-gray-200 rounded w-64 mt-2" /></div>
      <div className="h-40 bg-gray-200 rounded-xl" />
      <div className="h-60 bg-gray-200 rounded-xl" />
      <div className="h-32 bg-gray-200 rounded-xl" />
    </div>
  );
}

export default function ConfiguracoesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: clinicasData, isLoading: loadingClinicas } = useClinicas();
  const clinica = clinicasData?.data?.[0];

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cargo, setCargo] = useState('');
  const [notificacoes, setNotificacoes] = useState<NotificationPrefs>({
    email: true, push: true, inApp: true,
    alertaDocumento: true, alertaLicenca: true, alertaVistoria: true, alertaPrazo: true,
  });

  useEffect(() => {
    if (clinica) {
      setNome(clinica.responsavelTecnico?.nome || clinica.nome || '');
      setEmail(clinica.email || '');
    }
  }, [clinica]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => api(`/clinicas/${clinica?.id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinicas'] });
      toast({ title: 'Configuracoes salvas com sucesso' });
    },
    onError: () => {
      toast({ title: 'Erro ao salvar', description: 'Tente novamente.', variant: 'destructive' });
    },
  });

  if (loadingClinicas) return <ConfigSkeleton />;

  function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
      <label className="flex items-center justify-between py-3">
        <span className="text-sm text-gray-700">{label}</span>
        <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${checked ? 'bg-indigo-600' : 'bg-gray-200'}`}>
          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </label>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuracoes</h1>
        <p className="mt-1 text-sm text-gray-500">Gerencie seu perfil, notificacoes e preferencias do sistema.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Perfil</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input id="nome" type="text" value={nome} onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Seu nome" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="seu@email.com" />
          </div>
          <div>
            <label htmlFor="cargo" className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
            <input id="cargo" type="text" value={cargo} onChange={(e) => setCargo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ex: Gerente de Compliance" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Notificacoes</h3>
        <div className="divide-y divide-gray-100">
          <div className="pb-4">
            <p className="text-sm font-medium text-gray-800 mb-2">Canais de Notificacao</p>
            <Toggle checked={notificacoes.email} onChange={(v) => setNotificacoes(n => ({ ...n, email: v }))} label="Notificacoes por Email" />
            <Toggle checked={notificacoes.push} onChange={(v) => setNotificacoes(n => ({ ...n, push: v }))} label="Notificacoes Push" />
            <Toggle checked={notificacoes.inApp} onChange={(v) => setNotificacoes(n => ({ ...n, inApp: v }))} label="Notificacoes In-App" />
          </div>
          <div className="pt-4">
            <p className="text-sm font-medium text-gray-800 mb-2">Tipos de Alerta</p>
            <Toggle checked={notificacoes.alertaDocumento} onChange={(v) => setNotificacoes(n => ({ ...n, alertaDocumento: v }))} label="Alertas de Documento" />
            <Toggle checked={notificacoes.alertaLicenca} onChange={(v) => setNotificacoes(n => ({ ...n, alertaLicenca: v }))} label="Alertas de Licenca" />
            <Toggle checked={notificacoes.alertaVistoria} onChange={(v) => setNotificacoes(n => ({ ...n, alertaVistoria: v }))} label="Alertas de Vistoria" />
            <Toggle checked={notificacoes.alertaPrazo} onChange={(v) => setNotificacoes(n => ({ ...n, alertaPrazo: v }))} label="Alertas de Prazo" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Categorias de Documento</h3>
        <div className="flex flex-wrap gap-2">
          {['Alvara', 'Licenca Sanitaria', 'Registro ANVISA', 'POP', 'TCLE', 'Contrato', 'Laudo Tecnico', 'Certificado', 'PGRSS', 'Outro'].map((cat) => (
            <span key={cat} className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">{cat}</span>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">Categorias sao gerenciadas pelo administrador do sistema.</p>
      </div>

      <div className="flex justify-end">
        <button type="button" disabled={updateMutation.isPending}
          onClick={() => updateMutation.mutate({ email, responsavelTecnico: { nome, especialidade: cargo } })}
          className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50">
          {updateMutation.isPending ? 'Salvando...' : 'Salvar Configuracoes'}
        </button>
      </div>
    </div>
  );
}
