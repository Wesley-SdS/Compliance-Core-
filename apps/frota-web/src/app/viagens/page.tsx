'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Truck, Plus, X, MapPin, Clock } from 'lucide-react';
import { useViagens, useCreateViagem } from '@/hooks/use-viagens';
import { useMotoristas } from '@/hooks/use-motoristas';
import { useVeiculos } from '@/hooks/use-veiculos';
import type { StatusViagem } from '@/lib/types';

const viagemSchema = z.object({
  motoristaId: z.string().min(1, 'Motorista obrigatorio'),
  veiculoId: z.string().min(1, 'Veiculo obrigatorio'),
  origem: z.string().min(2, 'Origem obrigatoria'),
  destino: z.string().min(2, 'Destino obrigatorio'),
  kmInicio: z.coerce.number().min(0, 'KM inicio deve ser positivo'),
});

type ViagemForm = z.infer<typeof viagemSchema>;

function StatusBadge({ status }: { status: StatusViagem }) {
  const styles: Record<StatusViagem, string> = {
    EM_ROTA: 'bg-sky-100 text-sky-700',
    FINALIZADA: 'bg-green-100 text-green-700',
    AGENDADA: 'bg-blue-100 text-blue-700',
    CANCELADA: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export default function ViagensPage() {
  const { data: viagens, isLoading } = useViagens();
  const createViagem = useCreateViagem();
  const { data: motoristas } = useMotoristas();
  const { data: veiculosList } = useVeiculos();
  const [modalOpen, setModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ViagemForm>({
    resolver: zodResolver(viagemSchema),
  });

  function onSubmit(data: ViagemForm) {
    createViagem.mutate(data, {
      onSuccess: () => {
        setModalOpen(false);
        reset();
      },
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="rounded-xl bg-slate-200 h-24" />)}
        </div>
        <div className="rounded-xl bg-slate-200 h-96" />
      </div>
    );
  }

  const lista = viagens ?? [];
  const emRota = lista.filter((v) => v.status === 'EM_ROTA').length;
  const finalizadas = lista.filter((v) => v.status === 'FINALIZADA').length;
  const agendadas = lista.filter((v) => v.status === 'AGENDADA').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Truck className="w-5 h-5 text-sky-500" />
            Viagens
          </h2>
          <p className="text-sm text-slate-500 mt-1">{lista.length} viagens registradas</p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition-colors inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Viagem
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-sky-50 border border-sky-200 p-4 text-center">
          <div className="text-2xl font-bold text-sky-700">{emRota}</div>
          <div className="text-xs text-sky-600 font-medium">Em Rota</div>
        </div>
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{finalizadas}</div>
          <div className="text-xs text-green-600 font-medium">Finalizadas</div>
        </div>
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">{agendadas}</div>
          <div className="text-xs text-blue-600 font-medium">Agendadas</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Motorista</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Veiculo</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Rota</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Data</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">KM</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Horas</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">CIOT</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lista.length > 0 ? (
              lista.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">
                    <Link href={`/viagens/${v.id}`} className="hover:text-sky-600">
                      {v.motorista}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-mono">{v.veiculo}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {v.origem} &rarr; {v.destino}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(v.dataInicio).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                    {v.kmInicio.toLocaleString('pt-BR')}
                    {v.kmFim ? ` - ${v.kmFim.toLocaleString('pt-BR')}` : ''}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {v.horasConducao}h
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-mono">{v.ciot ?? '-'}</td>
                  <td className="px-6 py-4"><StatusBadge status={v.status} /></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-sm text-slate-500">
                  Nenhuma viagem encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Nova Viagem */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg p-6 mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Truck className="w-5 h-5 text-sky-500" />
                Nova Viagem
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Motorista</label>
                <select
                  {...register('motoristaId')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-white"
                >
                  <option value="">Selecione um motorista</option>
                  {motoristas?.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome} ({m.cpf})
                    </option>
                  ))}
                </select>
                {errors.motoristaId && <p className="text-xs text-red-500 mt-1">{errors.motoristaId.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Veiculo</label>
                <select
                  {...register('veiculoId')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-white"
                >
                  <option value="">Selecione um veiculo</option>
                  {veiculosList?.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.placa} - {v.marca} {v.modelo}
                    </option>
                  ))}
                </select>
                {errors.veiculoId && <p className="text-xs text-red-500 mt-1">{errors.veiculoId.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Origem</label>
                  <input
                    {...register('origem')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                    placeholder="Cidade de origem"
                  />
                  {errors.origem && <p className="text-xs text-red-500 mt-1">{errors.origem.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Destino</label>
                  <input
                    {...register('destino')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                    placeholder="Cidade de destino"
                  />
                  {errors.destino && <p className="text-xs text-red-500 mt-1">{errors.destino.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">KM Inicio</label>
                <input
                  {...register('kmInicio')}
                  type="number"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                  placeholder="Quilometragem inicial"
                />
                {errors.kmInicio && <p className="text-xs text-red-500 mt-1">{errors.kmInicio.message}</p>}
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
                  disabled={createViagem.isPending}
                  className="px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50"
                >
                  {createViagem.isPending ? 'Criando...' : 'Criar Viagem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
