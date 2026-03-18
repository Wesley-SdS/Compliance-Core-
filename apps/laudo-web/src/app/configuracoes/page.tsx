'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiFetch } from '@/lib/api';

const configSchema = z.object({
  nome: z.string().min(3, 'Nome obrigatorio'),
  cnpj: z.string().min(14, 'CNPJ invalido'),
  crbioResponsavel: z.string().min(3, 'CRBio obrigatorio'),
  slaHoras: z.coerce.number().min(1).max(168),
  alertaAntecedencia: z.coerce.number().min(1).max(90),
});

type ConfigForm = z.infer<typeof configSchema>;

const canaisAlerta = ['push', 'email', 'in_app'];

export default function ConfiguracoesPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [canais, setCanais] = useState<string[]>(['in_app', 'email']);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConfigForm>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      nome: '',
      cnpj: '',
      crbioResponsavel: '',
      slaHoras: 24,
      alertaAntecedencia: 30,
    },
  });

  const onSubmit = async (data: ConfigForm) => {
    setSaving(true);
    try {
      const labId = 'default'; // TODO: use selected lab
      await apiFetch(`/laboratorios/${labId}/configuracoes`, {
        method: 'PUT',
        body: JSON.stringify({ nome: data.nome, cnpj: data.cnpj, crbm: data.crbioResponsavel, slaHoras: data.slaHoras }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // error
    } finally {
      setSaving(false);
    }
  };

  const toggleCanal = (canal: string) => {
    setCanais((prev) =>
      prev.includes(canal) ? prev.filter((c) => c !== canal) : [...prev, canal],
    );
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Configuracoes</h2>
        <p className="text-sm text-slate-500 mt-1">Dados do laboratorio e preferencias</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Dados do lab */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Dados do Laboratorio</h3>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Nome do Laboratorio</label>
            <input
              {...register('nome')}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Lab Analises Clinicas Ltda"
            />
            {errors.nome && <p className="text-xs text-red-500 mt-1">{errors.nome.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">CNPJ</label>
              <input
                {...register('cnpj')}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="00.000.000/0001-00"
              />
              {errors.cnpj && <p className="text-xs text-red-500 mt-1">{errors.cnpj.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">CRBio Responsavel Tecnico</label>
              <input
                {...register('crbioResponsavel')}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="CRBio 12345-01"
              />
              {errors.crbioResponsavel && <p className="text-xs text-red-500 mt-1">{errors.crbioResponsavel.message}</p>}
            </div>
          </div>
        </div>

        {/* SLA e alertas */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">SLA e Alertas</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">SLA de Liberacao (horas)</label>
              <input
                type="number"
                {...register('slaHoras')}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              {errors.slaHoras && <p className="text-xs text-red-500 mt-1">{errors.slaHoras.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Antecedencia de Alerta (dias)</label>
              <input
                type="number"
                {...register('alertaAntecedencia')}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              {errors.alertaAntecedencia && <p className="text-xs text-red-500 mt-1">{errors.alertaAntecedencia.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Canais de Alerta</label>
            <div className="flex gap-3">
              {canaisAlerta.map((canal) => (
                <label key={canal} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canais.includes(canal)}
                    onChange={() => toggleCanal(canal)}
                    className="rounded border-slate-300 text-violet-500 focus:ring-violet-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300 capitalize">{canal.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Equipe */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Equipe</h3>
          <p className="text-sm text-slate-500">Convide bioquimicos e tecnicos para o laboratorio.</p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="email@exemplo.com"
              className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <select className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded-lg">
              <option>Bioquimico</option>
              <option>Tecnico</option>
              <option>Admin</option>
            </select>
            <button
              type="button"
              className="px-4 py-2 bg-violet-500 text-white text-sm font-medium rounded-lg hover:bg-violet-600 transition-colors"
            >
              Convidar
            </button>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-violet-500 text-white text-sm font-medium rounded-lg hover:bg-violet-600 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Salvando...' : 'Salvar Configuracoes'}
          </button>
          {saved && (
            <span className="text-sm text-green-600 font-medium">Configuracoes salvas!</span>
          )}
        </div>
      </form>
    </div>
  );
}
