'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Simulacao, SimulacaoInput } from '@/lib/types';

export function useSimulacoes(empresaId: string) {
  return useQuery({
    queryKey: ['simulacoes', empresaId],
    queryFn: () => apiFetch<Simulacao[]>(`/calculos/historico/${empresaId}`),
    enabled: !!empresaId,
  });
}

export function useSimulacao(id: string) {
  return useQuery({
    queryKey: ['simulacao', id],
    queryFn: () => apiFetch<Simulacao>(`/calculos/${id}`),
    enabled: !!id,
  });
}

export function useSimular() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SimulacaoInput) =>
      apiFetch<Simulacao>('/calculos/simular', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['simulacoes', vars.empresaId] });
    },
  });
}
