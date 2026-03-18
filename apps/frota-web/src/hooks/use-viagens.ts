'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Viagem } from '@/lib/types';

export function useViagens(params?: { status?: string }) {
  return useQuery({
    queryKey: ['viagens', params],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (params?.status) sp.set('status', params.status);
      const qs = sp.toString();
      return apiFetch<Viagem[]>(`/api/viagens${qs ? `?${qs}` : ''}`);
    },
  });
}

export function useViagem(id: string) {
  return useQuery({
    queryKey: ['viagem', id],
    queryFn: () => apiFetch<Viagem>(`/api/viagens/${id}`),
    enabled: !!id,
  });
}

export function useCreateViagem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { motoristaId: string; veiculoId: string; origem: string; destino: string; kmInicio: number }) =>
      apiFetch<Viagem>('/api/viagens', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['viagens'] }); },
  });
}

export function useFinalizarViagem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, kmFim }: { id: string; kmFim: number }) =>
      apiFetch<Viagem>(`/api/viagens/${id}/finalizar`, { method: 'PATCH', body: JSON.stringify({ kmFim }) }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['viagens'] });
      qc.invalidateQueries({ queryKey: ['viagem', vars.id] });
    },
  });
}

export function useRegistrarParada() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, tipo }: { id: string; tipo: string }) =>
      apiFetch<void>(`/api/viagens/${id}/parada`, { method: 'POST', body: JSON.stringify({ tipo }) }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['viagem', vars.id] });
    },
  });
}
