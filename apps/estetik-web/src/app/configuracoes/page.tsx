'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface NotificationPrefs {
  email: boolean;
  push: boolean;
  inApp: boolean;
  alertaDocumento: boolean;
  alertaLicenca: boolean;
  alertaVistoria: boolean;
  alertaPrazo: boolean;
}

interface Perfil {
  nome: string;
  email: string;
  cargo: string;
}

export default function ConfiguracoesPage() {
  const [perfil, setPerfil] = useState<Perfil>({
    nome: '',
    email: '',
    cargo: '',
  });
  const [notificacoes, setNotificacoes] = useState<NotificationPrefs>({
    email: true,
    push: true,
    inApp: true,
    alertaDocumento: true,
    alertaLicenca: true,
    alertaVistoria: true,
    alertaPrazo: true,
  });
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch(`${API_URL}/configuracoes`);
        if (res.ok) {
          const data = await res.json();
          if (data.perfil) setPerfil(data.perfil);
          if (data.notificacoes) setNotificacoes(data.notificacoes);
        }
      } catch {
        // Use defaults
      }
    }
    fetchConfig();
  }, []);

  async function handleSave() {
    setSalvando(true);
    setSalvo(false);
    try {
      await fetch(`${API_URL}/configuracoes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perfil, notificacoes }),
      });
      setSalvo(true);
      setTimeout(() => setSalvo(false), 3000);
    } catch {
      // API unavailable
    } finally {
      setSalvando(false);
    }
  }

  function Toggle({
    checked,
    onChange,
    label,
  }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
  }) {
    return (
      <label className="flex items-center justify-between py-3">
        <span className="text-sm text-gray-700">{label}</span>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
            checked ? 'bg-indigo-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
              checked ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </label>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuracoes</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gerencie seu perfil, notificacoes e preferencias do sistema.
        </p>
      </div>

      {salvo && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">
            Configuracoes salvas com sucesso.
          </p>
        </div>
      )}

      {/* Perfil */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Perfil</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="nome"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nome
            </label>
            <input
              id="nome"
              type="text"
              value={perfil.nome}
              onChange={(e) =>
                setPerfil((p) => ({ ...p, nome: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Seu nome"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={perfil.email}
              onChange={(e) =>
                setPerfil((p) => ({ ...p, email: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label
              htmlFor="cargo"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Cargo
            </label>
            <input
              id="cargo"
              type="text"
              value={perfil.cargo}
              onChange={(e) =>
                setPerfil((p) => ({ ...p, cargo: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ex: Gerente de Compliance"
            />
          </div>
        </div>
      </div>

      {/* Notificacoes */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          Notificacoes
        </h3>
        <div className="divide-y divide-gray-100">
          <div className="pb-4">
            <p className="text-sm font-medium text-gray-800 mb-2">
              Canais de Notificacao
            </p>
            <Toggle
              checked={notificacoes.email}
              onChange={(v) =>
                setNotificacoes((n) => ({ ...n, email: v }))
              }
              label="Notificacoes por Email"
            />
            <Toggle
              checked={notificacoes.push}
              onChange={(v) =>
                setNotificacoes((n) => ({ ...n, push: v }))
              }
              label="Notificacoes Push"
            />
            <Toggle
              checked={notificacoes.inApp}
              onChange={(v) =>
                setNotificacoes((n) => ({ ...n, inApp: v }))
              }
              label="Notificacoes In-App"
            />
          </div>
          <div className="pt-4">
            <p className="text-sm font-medium text-gray-800 mb-2">
              Tipos de Alerta
            </p>
            <Toggle
              checked={notificacoes.alertaDocumento}
              onChange={(v) =>
                setNotificacoes((n) => ({ ...n, alertaDocumento: v }))
              }
              label="Alertas de Documento (vencimento, pendencias)"
            />
            <Toggle
              checked={notificacoes.alertaLicenca}
              onChange={(v) =>
                setNotificacoes((n) => ({ ...n, alertaLicenca: v }))
              }
              label="Alertas de Licenca (ANVISA, Vigilancia)"
            />
            <Toggle
              checked={notificacoes.alertaVistoria}
              onChange={(v) =>
                setNotificacoes((n) => ({ ...n, alertaVistoria: v }))
              }
              label="Alertas de Vistoria"
            />
            <Toggle
              checked={notificacoes.alertaPrazo}
              onChange={(v) =>
                setNotificacoes((n) => ({ ...n, alertaPrazo: v }))
              }
              label="Alertas de Prazo"
            />
          </div>
        </div>
      </div>

      {/* Categorias de Documento */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          Categorias de Documento
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            'Alvara',
            'Licenca Sanitaria',
            'Certificado ANVISA',
            'POP',
            'Laudo Tecnico',
            'Contrato',
            'Seguro',
            'Outro',
          ].map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
            >
              {cat}
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Categorias sao gerenciadas pelo administrador do sistema.
        </p>
      </div>

      {/* Tipos de Alerta */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          Tipos de Alerta
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            'Documento Vencendo',
            'Documento Vencido',
            'Licenca Pendente',
            'Vistoria Agendada',
            'Prazo ANVISA',
            'Score Baixo',
            'Auditoria',
          ].map((tipo) => (
            <span
              key={tipo}
              className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200"
            >
              {tipo}
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Tipos de alerta sao configurados globalmente pela plataforma.
        </p>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={salvando}
          className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {salvando ? 'Salvando...' : 'Salvar Configuracoes'}
        </button>
      </div>
    </div>
  );
}
