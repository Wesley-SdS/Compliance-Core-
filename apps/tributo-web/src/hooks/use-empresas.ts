'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Empresa, ScoreData, PaginatedResult } from '@/lib/types';

export function useEmpresas(params?: { regime?: string; search?: string }) {
  return useQuery({
    queryKey: ['empresas', params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.regime && params.regime !== 'Todos') searchParams.set('regime', params.regime);
      if (params?.search) searchParams.set('search', params.search);
      const qs = searchParams.toString();
      return apiFetch<Empresa[]>(`/empresas${qs ? `?${qs}` : ''}`);
    },
  });
}

export function useEmpresa(id: string) {
  return useQuery({
    queryKey: ['empresa', id],
    queryFn: () => apiFetch<Empresa>(`/empresas/${id}`),
    enabled: !!id,
  });
}

export function useEmpresaScore(id: string) {
  return useQuery({
    queryKey: ['empresa', id, 'score'],
    queryFn: () => apiFetch<ScoreData>(`/empresas/${id}/score`),
    enabled: !!id,
  });
}

export function useGlobalScore() {
  return useQuery({
    queryKey: ['score-global'],
    queryFn: () => apiFetch<ScoreData>('/empresas/score'),
  });
}

export function useCreateEmpresa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Empresa, 'id' | 'score' | 'level' | 'createdAt'>) =>
      apiFetch<Empresa>('/empresas', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['empresas'] });
    },
  });
}

export function useUpdateEmpresa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Empresa> & { id: string }) =>
      apiFetch<Empresa>(`/empresas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['empresas'] });
      qc.invalidateQueries({ queryKey: ['empresa', vars.id] });
    },
  });
}

export function useDeleteEmpresa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/empresas/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['empresas'] });
    },
  });
}
