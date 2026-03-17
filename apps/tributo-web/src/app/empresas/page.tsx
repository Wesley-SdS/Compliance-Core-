'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEmpresas, useCreateEmpresa } from '@/hooks';
import { formatCNPJ, scoreLevelColor } from '@/lib/utils';
import type { RegimeTributario } from '@/lib/types';

const regimes: Array<{ value: string; label: string }> = [
  { value: 'Todos', label: 'Todos' },
  { value: 'SIMPLES_NACIONAL', label: 'Simples Nacional' },
  { value: 'LUCRO_PRESUMIDO', label: 'Lucro Presumido' },
  { value: 'LUCRO_REAL', label: 'Lucro Real' },
  { value: 'MEI', label: 'MEI' },
];

const empresaSchema = z.object({
  razaoSocial: z.string().min(3, 'Minimo 3 caracteres'),
  nomeFantasia: z.string().min(2, 'Minimo 2 caracteres'),
  cnpj: z.string().min(14, 'CNPJ invalido').max(18),
  regimeTributario: z.enum(['SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL', 'MEI']),
  cnaePrincipal: z.string().optional(),
  email: z.string().email('Email invalido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  inscricaoEstadual: z.string().optional(),
  inscricaoMunicipal: z.string().optional(),
});

type EmpresaForm = z.infer<typeof empresaSchema>;

function ComplianceBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    EXCELENTE: 'bg-green-100 text-green-700',
    BOM: 'bg-blue-100 text-blue-700',
    ATENCAO: 'bg-amber-100 text-amber-700',
    CRITICO: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[level] ?? 'bg-slate-100 text-slate-700'}`}>
      {level}
    </span>
  );
}

export default function EmpresasPage() {
  const [search, setSearch] = useState('');
  const [regimeFilter, setRegimeFilter] = useState('Todos');
  const [showModal, setShowModal] = useState(false);

  const { data: empresas, isLoading } = useEmpresas({
    regime: regimeFilter !== 'Todos' ? regimeFilter : undefined,
    search: search || undefined,
  });

  const createEmpresa = useCreateEmpresa();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmpresaForm>({
    resolver: zodResolver(empresaSchema),
    defaultValues: { regimeTributario: 'SIMPLES_NACIONAL' },
  });

  function onSubmit(data: EmpresaForm) {
    createEmpresa.mutate(data as any, {
      onSuccess: () => {
        setShowModal(false);
        reset();
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Empresas</h2>
          <p className="text-sm text-slate-500 mt-1">{empresas?.length ?? 0} empresas cadastradas</p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors"
        >
          Nova Empresa
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por nome ou CNPJ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
        <div className="flex gap-2">
          {regimes.map((regime) => (
            <button
              key={regime.value}
              type="button"
              onClick={() => setRegimeFilter(regime.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                regimeFilter === regime.value
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {regime.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Empresa</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">CNPJ</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Regime</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Score</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">Carregando...</td>
              </tr>
            ) : empresas && empresas.length > 0 ? (
              empresas.map((empresa) => (
                <tr key={empresa.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/empresas/${empresa.id}`} className="text-sm font-medium text-slate-800 hover:text-emerald-600">
                      {empresa.razaoSocial}
                    </Link>
                    {empresa.nomeFantasia && (
                      <div className="text-xs text-slate-400">{empresa.nomeFantasia}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-mono">{formatCNPJ(empresa.cnpj)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{empresa.regimeTributario.replace(/_/g, ' ')}</td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-semibold ${empresa.score != null ? scoreLevelColor(empresa.level ?? 'BOM') : 'text-slate-400'}`}>
                      {empresa.score ?? '--'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {empresa.level && <ComplianceBadge level={empresa.level} />}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                  Nenhuma empresa encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Nova Empresa */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Nova Empresa</h3>
              <button type="button" onClick={() => { setShowModal(false); reset(); }} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Razao Social *</label>
                <input {...register('razaoSocial')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                {errors.razaoSocial && <p className="text-xs text-red-500 mt-1">{errors.razaoSocial.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Fantasia *</label>
                <input {...register('nomeFantasia')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                {errors.nomeFantasia && <p className="text-xs text-red-500 mt-1">{errors.nomeFantasia.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ *</label>
                  <input {...register('cnpj')} placeholder="00.000.000/0000-00" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  {errors.cnpj && <p className="text-xs text-red-500 mt-1">{errors.cnpj.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Regime Tributario *</label>
                  <select {...register('regimeTributario')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="SIMPLES_NACIONAL">Simples Nacional</option>
                    <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
                    <option value="LUCRO_REAL">Lucro Real</option>
                    <option value="MEI">MEI</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">CNAE Principal</label>
                  <input {...register('cnaePrincipal')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" {...register('email')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Inscricao Estadual</label>
                  <input {...register('inscricaoEstadual')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Inscricao Municipal</label>
                  <input {...register('inscricaoMunicipal')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); reset(); }} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">
                  Cancelar
                </button>
                <button type="submit" disabled={createEmpresa.isPending} className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 disabled:opacity-50">
                  {createEmpresa.isPending ? 'Salvando...' : 'Criar Empresa'}
                </button>
              </div>
              {createEmpresa.isError && (
                <p className="text-xs text-red-500">Erro ao criar empresa. Tente novamente.</p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
