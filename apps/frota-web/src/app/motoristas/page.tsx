'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, Plus, X, ShieldCheck } from 'lucide-react';
import { useMotoristas, useCreateMotorista } from '@/hooks/use-motoristas';
import type { ComplianceLevel } from '@/lib/types';

const motoristaSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 digitos'),
  cnh: z.string().min(1, 'CNH obrigatoria'),
  cnhCategoria: z.enum(['A', 'B', 'C', 'D', 'E'], { required_error: 'Selecione a categoria' }),
  cnhValidade: z.string().min(1, 'Data de validade obrigatoria'),
  moppValidade: z.string().optional(),
});

type MotoristaForm = z.infer<typeof motoristaSchema>;

function ComplianceBadge({ level }: { level: ComplianceLevel }) {
  const styles: Record<ComplianceLevel, string> = {
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    VALIDO: 'bg-green-100 text-green-700',
    VENCENDO: 'bg-amber-100 text-amber-700',
    VENCIDO: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}

export default function MotoristasPage() {
  const { data: motoristas, isLoading } = useMotoristas();
  const createMotorista = useCreateMotorista();
  const [modalOpen, setModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MotoristaForm>({
    resolver: zodResolver(motoristaSchema),
  });

  function onSubmit(data: MotoristaForm) {
    createMotorista.mutate(
      {
        nome: data.nome,
        cpf: data.cpf,
        cnh: data.cnh,
        cnhCategoria: data.cnhCategoria,
        cnhValidade: data.cnhValidade,
        moppValidade: data.moppValidade || undefined,
      },
      {
        onSuccess: () => {
          setModalOpen(false);
          reset();
        },
      },
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded w-64" />
        <div className="rounded-xl bg-slate-200 h-96" />
      </div>
    );
  }

  const lista = motoristas ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-500" />
            Motoristas
          </h2>
          <p className="text-sm text-slate-500 mt-1">{lista.length} motoristas cadastrados</p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition-colors inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Motorista
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Motorista</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">CNH</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">MOPP</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Compliance</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Veiculos</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lista.length > 0 ? (
              lista.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                  <td className="px-6 py-4">
                    <Link href={`/motoristas/${m.id}`} className="block">
                      <div className="text-sm font-medium text-slate-800 hover:text-sky-600">{m.nome}</div>
                      <div className="text-xs text-slate-400">{m.cpf}</div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-600">{m.cnh}</div>
                    <div className="text-xs text-slate-400">
                      Cat. {m.cnhCategoria} | Val. {new Date(m.cnhValidade).toLocaleDateString('pt-BR')}
                    </div>
                    <StatusBadge status={m.statusCnh} />
                  </td>
                  <td className="px-6 py-4">
                    {m.moppValidade ? (
                      <div>
                        <div className="text-xs text-slate-500">
                          Val. {new Date(m.moppValidade).toLocaleDateString('pt-BR')}
                        </div>
                        {m.statusMopp && <StatusBadge status={m.statusMopp} />}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <ComplianceBadge level={m.level} />
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {m.veiculosVinculados?.length ?? 0}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-700">{m.score}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                  Nenhum motorista encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Novo Motorista */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg p-6 mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-sky-500" />
                Novo Motorista
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                <input
                  {...register('nome')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                  placeholder="Nome completo"
                />
                {errors.nome && <p className="text-xs text-red-500 mt-1">{errors.nome.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
                <input
                  {...register('cpf')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                  placeholder="00000000000"
                  maxLength={11}
                />
                {errors.cpf && <p className="text-xs text-red-500 mt-1">{errors.cpf.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">CNH</label>
                  <input
                    {...register('cnh')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                    placeholder="Numero CNH"
                  />
                  {errors.cnh && <p className="text-xs text-red-500 mt-1">{errors.cnh.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                  <select
                    {...register('cnhCategoria')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                  >
                    <option value="">Selecione</option>
                    {['A', 'B', 'C', 'D', 'E'].map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {errors.cnhCategoria && <p className="text-xs text-red-500 mt-1">{errors.cnhCategoria.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Validade CNH</label>
                  <input
                    {...register('cnhValidade')}
                    type="date"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                  />
                  {errors.cnhValidade && <p className="text-xs text-red-500 mt-1">{errors.cnhValidade.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Validade MOPP <span className="text-slate-400">(opcional)</span></label>
                  <input
                    {...register('moppValidade')}
                    type="date"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setModalOpen(false); reset(); }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMotorista.isPending}
                  className="px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50"
                >
                  {createMotorista.isPending ? 'Salvando...' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
