'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLoteamentos, useCreateLoteamento } from '@/hooks/use-api';
import { ComplianceBadge } from '@compliancecore/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const createSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  endereco: z.string().min(1, 'Endereço obrigatório'),
  cidade: z.string().min(1, 'Cidade obrigatória'),
  estado: z.string().length(2, 'UF com 2 letras'),
  areaTotal: z.number().min(1),
  totalLotes: z.number().min(1),
  responsavel: z.string().min(1, 'Responsável obrigatório'),
  cnpjLoteador: z.string().min(14, 'CNPJ obrigatório'),
});

type CreateForm = z.infer<typeof createSchema>;

export default function LoteamentosPage() {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const { data, isLoading } = useLoteamentos(page, 20);
  const createMutation = useCreateLoteamento();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
  });

  const loteamentos = data?.data ?? [];
  const filtered = search
    ? loteamentos.filter((l: any) => l.nome?.toLowerCase().includes(search.toLowerCase()) || l.cidade?.toLowerCase().includes(search.toLowerCase()))
    : loteamentos;

  function onSubmit(formData: CreateForm) {
    createMutation.mutate(formData, {
      onSuccess: () => { setShowForm(false); reset(); },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Loteamentos</h2>
          <p className="text-sm text-slate-500 mt-1">{data?.total ?? 0} loteamentos cadastrados</p>
        </div>
        <button type="button" onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-rose-500 text-white text-sm font-medium rounded-lg hover:bg-rose-600 transition-colors">
          {showForm ? 'Cancelar' : 'Novo Loteamento'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800">Cadastrar Novo Loteamento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nome</label>
              <input {...register('nome')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
              {errors.nome && <p className="text-xs text-red-500 mt-1">{errors.nome.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Endereço</label>
              <input {...register('endereco')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Cidade</label>
              <input {...register('cidade')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">UF</label>
              <input {...register('estado')} maxLength={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Área Total (m²)</label>
              <input type="number" {...register('areaTotal', { valueAsNumber: true })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Total de Lotes</label>
              <input type="number" {...register('totalLotes', { valueAsNumber: true })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Responsável</label>
              <input {...register('responsavel')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">CNPJ Loteador</label>
              <input {...register('cnpjLoteador')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
            </div>
          </div>
          <button type="submit" disabled={createMutation.isPending}
            className="px-6 py-2 bg-rose-500 text-white text-sm font-medium rounded-lg hover:bg-rose-600 disabled:opacity-50">
            {createMutation.isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      )}

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Buscar por nome ou cidade..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Loteamento</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Cidade/UF</th>
              <th className="text-center text-xs font-medium text-slate-500 uppercase px-4 py-3">Lotes</th>
              <th className="text-center text-xs font-medium text-slate-500 uppercase px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-4"><div className="h-4 w-32 bg-slate-100 animate-pulse rounded" /></td>
                  <td className="px-4 py-4"><div className="h-4 w-24 bg-slate-100 animate-pulse rounded" /></td>
                  <td className="px-4 py-4"><div className="h-4 w-12 bg-slate-100 animate-pulse rounded mx-auto" /></td>
                  <td className="px-4 py-4"><div className="h-4 w-20 bg-slate-100 animate-pulse rounded mx-auto" /></td>
                </tr>
              ))
            ) : filtered.length > 0 ? (
              filtered.map((lot: any) => (
                <tr key={lot.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4">
                    <Link href={`/loteamentos/${lot.id}`} className="text-sm font-medium text-slate-800 hover:text-rose-600">
                      {lot.nome}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">{lot.cidade}, {lot.estado}</td>
                  <td className="px-4 py-4 text-sm text-slate-600 text-center">{lot.total_lotes}</td>
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      {lot.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                  Nenhum loteamento encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.total > 20 && (
        <div className="flex items-center justify-between">
          <button type="button" disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-50">
            Anterior
          </button>
          <span className="text-sm text-slate-500">Página {page}</span>
          <button type="button" disabled={!data.hasMore} onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-50">
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
