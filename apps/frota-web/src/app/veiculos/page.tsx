'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, X, Truck, AlertTriangle } from 'lucide-react';

import { useVeiculos, useCreateVeiculo } from '@/hooks/use-veiculos';
import { useFrotaStore } from '@/lib/store';
import type { ComplianceLevel, TipoVeiculo } from '@/lib/types';

/* ── helpers ─────────────────────────────────────────────────────── */

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

function MiniScore({ value, level }: { value: number; level: string }) {
  const color = level === 'EXCELENTE' ? 'text-green-600' : level === 'BOM' ? 'text-blue-600' : level === 'ATENCAO' ? 'text-amber-600' : 'text-red-600';
  return <span className={`text-sm font-bold ${color}`}>{value}</span>;
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
}

/* ── schema ──────────────────────────────────────────────────────── */

const veiculoSchema = z.object({
  placa: z.string().regex(/^[A-Z]{3}-\d[A-Z0-9]\d{2}$/, 'Formato: AAA-0A00'),
  tipo: z.enum(['CAMINHAO', 'CARRETA', 'VAN', 'UTILITARIO'] as const),
  marca: z.string().min(1, 'Obrigatorio'),
  modelo: z.string().min(1, 'Obrigatorio'),
  ano: z.coerce.number().min(1990).max(new Date().getFullYear() + 1),
  km: z.coerce.number().min(0),
});

type VeiculoForm = z.infer<typeof veiculoSchema>;

const tiposVeiculo: TipoVeiculo[] = ['CAMINHAO', 'CARRETA', 'VAN', 'UTILITARIO'];
const complianceLevels: ComplianceLevel[] = ['EXCELENTE', 'BOM', 'ATENCAO', 'CRITICO'];

/* ── Modal ───────────────────────────────────────────────────────── */

function AddVeiculoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createVeiculo = useCreateVeiculo();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<VeiculoForm>({
    resolver: zodResolver(veiculoSchema),
    defaultValues: { placa: '', tipo: 'CAMINHAO', marca: '', modelo: '', ano: new Date().getFullYear(), km: 0 },
  });

  const onSubmit = (data: VeiculoForm) => {
    createVeiculo.mutate(data, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-800">Adicionar Veiculo</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Placa</label>
              <input {...register('placa')} placeholder="ABC-1D23"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent uppercase" />
              {errors.placa && <p className="text-xs text-red-500 mt-1">{errors.placa.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
              <select {...register('tipo')}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white">
                {tiposVeiculo.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.tipo && <p className="text-xs text-red-500 mt-1">{errors.tipo.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
              <input {...register('marca')} placeholder="Volvo"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent" />
              {errors.marca && <p className="text-xs text-red-500 mt-1">{errors.marca.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
              <input {...register('modelo')} placeholder="FH 540"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent" />
              {errors.modelo && <p className="text-xs text-red-500 mt-1">{errors.modelo.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ano</label>
              <input type="number" {...register('ano')} placeholder="2024"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent" />
              {errors.ano && <p className="text-xs text-red-500 mt-1">{errors.ano.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">KM Atual</label>
              <input type="number" {...register('km')} placeholder="0"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent" />
              {errors.km && <p className="text-xs text-red-500 mt-1">{errors.km.message}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={createVeiculo.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-sky-500 rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50">
              {createVeiculo.isPending ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>

          {createVeiculo.isError && (
            <p className="text-xs text-red-500 text-center">Erro ao criar veiculo. Tente novamente.</p>
          )}
        </form>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────── */

export default function VeiculosPage() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  const {
    filtroTipoVeiculo, setFiltroTipoVeiculo,
    filtroComplianceLevel, setFiltroComplianceLevel,
    buscaPlaca, setBuscaPlaca,
  } = useFrotaStore();

  const { data: veiculos, isLoading } = useVeiculos({
    tipo: filtroTipoVeiculo,
    level: filtroComplianceLevel,
    search: buscaPlaca,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Veiculos</h2>
          <p className="text-sm text-slate-500 mt-1">
            {isLoading ? 'Carregando...' : `${veiculos?.length ?? 0} veiculos cadastrados`}
          </p>
        </div>
        <button type="button" onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition-colors">
          <Plus className="w-4 h-4" />
          Adicionar Veiculo
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Buscar por placa..."
            value={buscaPlaca} onChange={(e) => setBuscaPlaca(e.target.value)}
            className="pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent w-56" />
        </div>
        <select value={filtroTipoVeiculo} onChange={(e) => setFiltroTipoVeiculo(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white">
          <option value="Todos">Todos os tipos</option>
          {tiposVeiculo.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filtroComplianceLevel} onChange={(e) => setFiltroComplianceLevel(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white">
          <option value="Todos">Todos os niveis</option>
          {complianceLevels.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Placa</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Tipo</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Marca / Modelo</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">KM</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Score</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Proximo Alerta</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-10" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-28" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                </tr>
              ))
            ) : veiculos && veiculos.length > 0 ? (
              veiculos.map((v) => (
                <tr key={v.id} onClick={() => router.push(`/veiculos/${v.id}`)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer">
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-800 font-mono">{v.placa}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{v.tipo}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-700">{v.marca} {v.modelo}</span>
                    <div className="text-xs text-slate-400">{v.ano}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-mono">{v.km.toLocaleString('pt-BR')}</td>
                  <td className="px-6 py-4"><MiniScore value={v.score} level={v.level} /></td>
                  <td className="px-6 py-4">
                    {v.proximoAlerta ? (
                      <div className="flex items-center gap-1.5 text-xs text-amber-600">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {v.proximoAlerta}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4"><ComplianceBadge level={v.level} /></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <Truck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Nenhum veiculo encontrado.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <AddVeiculoModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
