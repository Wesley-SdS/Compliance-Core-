'use client';

import { useState, useEffect, useRef } from 'react';
import { Settings, Building, Bell, Users, Wrench, CheckCircle2 } from 'lucide-react';
import { useSession } from '@/lib/auth-client';

const LS_KEY_TRANSPORTADORA = 'frota:config:transportadora';
const LS_KEY_ALERTAS = 'frota:config:alertas';
const LS_KEY_SLA = 'frota:config:sla';

function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  function show(text: string) {
    setMsg(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 3000);
  }
  const Toast = msg ? (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-green-600 text-white text-sm font-medium rounded-lg shadow-lg">
      <CheckCircle2 className="w-4 h-4" />
      {msg}
    </div>
  ) : null;
  return { show, Toast };
}

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export default function ConfiguracoesPage() {
  const { data: session } = useSession();
  const toast = useToast();

  const [transportadora, setTransportadora] = useState({ cnpj: '', rntrc: '', razaoSocial: '' });

  const [alertasConfig, setAlertasConfig] = useState({
    cnhVencimento: true,
    moppVencimento: true,
    manutencaoProgramada: true,
    horasConducao: true,
    documentosVeiculos: true,
    legislacaoNova: true,
  });

  const [slaConfig, setSlaConfig] = useState({
    revisaoMotor: '50000',
    trocaOleo: '10000',
    trocaPneus: '80000',
    revisaoFreios: '30000',
  });

  // Load from localStorage on mount
  useEffect(() => {
    setTransportadora(loadJson(LS_KEY_TRANSPORTADORA, { cnpj: '', rntrc: '', razaoSocial: '' }));
    setAlertasConfig(loadJson(LS_KEY_ALERTAS, alertasConfig));
    setSlaConfig(loadJson(LS_KEY_SLA, slaConfig));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveTransportadora() {
    localStorage.setItem(LS_KEY_TRANSPORTADORA, JSON.stringify(transportadora));
    toast.show('Dados da transportadora salvos com sucesso');
  }

  function toggleAlerta(key: keyof typeof alertasConfig) {
    setAlertasConfig((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(LS_KEY_ALERTAS, JSON.stringify(next));
      return next;
    });
    toast.show('Preferencia de alerta atualizada');
  }

  function saveSla() {
    localStorage.setItem(LS_KEY_SLA, JSON.stringify(slaConfig));
    toast.show('SLAs de manutencao salvos com sucesso');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <Settings className="w-5 h-5 text-sky-500" />
          Configuracoes
        </h2>
        <p className="text-sm text-slate-500 mt-1">Gerencie as configuracoes da sua transportadora</p>
      </div>

      {/* Dados da Transportadora */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Building className="w-4 h-4 text-slate-400" />
          Dados da Transportadora
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ</label>
            <input
              type="text"
              value={transportadora.cnpj}
              onChange={(e) => setTransportadora((p) => ({ ...p, cnpj: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              placeholder="00.000.000/0000-00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">RNTRC</label>
            <input
              type="text"
              value={transportadora.rntrc}
              onChange={(e) => setTransportadora((p) => ({ ...p, rntrc: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              placeholder="Registro ANTT"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Razao Social</label>
            <input
              type="text"
              value={transportadora.razaoSocial}
              onChange={(e) => setTransportadora((p) => ({ ...p, razaoSocial: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              placeholder="Nome da empresa"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              defaultValue={session?.user?.email ?? ''}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-slate-50"
              readOnly
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={saveTransportadora}
            className="px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>

      {/* Preferencias de Alerta */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-400" />
          Preferencias de Alerta
        </h3>
        <div className="space-y-4">
          {[
            { key: 'cnhVencimento' as const, label: 'Vencimento de CNH', desc: 'Alerta quando CNH estiver proxima do vencimento' },
            { key: 'moppVencimento' as const, label: 'Vencimento de MOPP', desc: 'Alerta quando MOPP estiver proxima do vencimento' },
            { key: 'manutencaoProgramada' as const, label: 'Manutencao Programada', desc: 'Alerta quando quilometragem se aproximar da revisao' },
            { key: 'horasConducao' as const, label: 'Horas de Conducao', desc: 'Alerta quando motorista ultrapassar limite de horas' },
            { key: 'documentosVeiculos' as const, label: 'Documentos de Veiculos', desc: 'Alerta de CRLV, licenciamento e seguros' },
            { key: 'legislacaoNova' as const, label: 'Nova Legislacao', desc: 'Notificacao de mudancas regulatorias relevantes' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
              <div>
                <div className="text-sm font-medium text-slate-700">{item.label}</div>
                <div className="text-xs text-slate-400">{item.desc}</div>
              </div>
              <button
                type="button"
                onClick={() => toggleAlerta(item.key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  alertasConfig[item.key] ? 'bg-sky-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    alertasConfig[item.key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Equipe */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400" />
          Equipe
        </h3>
        <div className="space-y-3">
          {session?.user && (
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-sky-600">
                    {session.user.name?.charAt(0)?.toUpperCase() ?? 'U'}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700">{session.user.name ?? 'Usuario'}</div>
                  <div className="text-xs text-slate-400">{session.user.email}</div>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700">
                Gestor
              </span>
            </div>
          )}
          <p className="text-xs text-slate-400 mt-2">
            Para adicionar novos membros a equipe, entre em contato com o suporte.
          </p>
        </div>
      </div>

      {/* SLAs de Manutencao */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-slate-400" />
          SLAs de Manutencao
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Defina a quilometragem entre revisoes para receber alertas no momento certo.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'revisaoMotor' as const, label: 'Revisao do Motor' },
            { key: 'trocaOleo' as const, label: 'Troca de Oleo' },
            { key: 'trocaPneus' as const, label: 'Troca de Pneus' },
            { key: 'revisaoFreios' as const, label: 'Revisao de Freios' },
          ].map((item) => (
            <div key={item.key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{item.label}</label>
              <div className="relative">
                <input
                  type="number"
                  value={slaConfig[item.key]}
                  onChange={(e) => setSlaConfig((prev) => ({ ...prev, [item.key]: e.target.value }))}
                  className="w-full px-3 py-2 pr-12 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400">km</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={saveSla}
            className="px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition-colors"
          >
            Salvar SLAs
          </button>
        </div>
      </div>

      {toast.Toast}
    </div>
  );
}
