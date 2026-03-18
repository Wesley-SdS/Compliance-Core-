'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Veiculo, ScoreData, Abastecimento, Manutencao, Viagem, Documento, Alerta, TimelineEvent } from '@/lib/types';

export function useVeiculos(params?: { tipo?: string; level?: string; search?: string }) {
  return useQuery({
    queryKey: ['veiculos', params],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (params?.tipo && params.tipo !== 'Todos') sp.set('tipo', params.tipo);
      if (params?.level && params.level !== 'Todos') sp.set('level', params.level);
      if (params?.search) sp.set('search', params.search);
      const qs = sp.toString();
      return apiFetch<Veiculo[]>(`/api/veiculos${qs ? `?${qs}` : ''}`);
    },
  });
}

export function useVeiculo(id: string) {
  return useQuery({
    queryKey: ['veiculo', id],
    queryFn: () => apiFetch<Veiculo>(`/api/veiculos/${id}`),
    enabled: !!id,
  });
}

export function useVeiculoScore(id: string) {
  return useQuery({
    queryKey: ['veiculo', id, 'score'],
    queryFn: () => apiFetch<ScoreData>(`/api/veiculos/${id}/score`),
    enabled: !!id,
  });
}

export function useVeiculoScoreHistory(id: string) {
  return useQuery({
    queryKey: ['veiculo', id, 'score-history'],
    queryFn: () => apiFetch<Array<{ data: string; value: number }>>(`/api/veiculos/${id}/score/history`),
    enabled: !!id,
  });
}

export function useVeiculoAbastecimentos(id: string) {
  return useQuery({
    queryKey: ['veiculo', id, 'abastecimentos'],
    queryFn: () => apiFetch<Abastecimento[]>(`/api/veiculos/${id}/abastecimentos`),
    enabled: !!id,
  });
}

export function useVeiculoConsumo(id: string) {
  return useQuery({
    queryKey: ['veiculo', id, 'consumo'],
    queryFn: () => apiFetch<{ media: number; historico: Array<{ data: string; kmPorLitro: number }> }>(`/api/veiculos/${id}/consumo`),
    enabled: !!id,
  });
}

export function useVeiculoManutencoes(id: string) {
  return useQuery({
    queryKey: ['veiculo', id, 'manutencoes'],
    queryFn: () => apiFetch<Manutencao[]>(`/api/veiculos/${id}/manutencoes`),
    enabled: !!id,
  });
}

export function useVeiculoViagens(id: string) {
  return useQuery({
    queryKey: ['veiculo', id, 'viagens'],
    queryFn: () => apiFetch<Viagem[]>(`/api/veiculos/${id}/viagens`),
    enabled: !!id,
  });
}

export function useVeiculoDocumentos(id: string) {
  return useQuery({
    queryKey: ['veiculo', id, 'documentos'],
    queryFn: () => apiFetch<Documento[]>(`/api/veiculos/${id}/documentos`),
    enabled: !!id,
  });
}

export function useVeiculoAlertas(id: string) {
  return useQuery({
    queryKey: ['veiculo', id, 'alertas'],
    queryFn: () => apiFetch<Alerta[]>(`/api/veiculos/${id}/alertas`),
    enabled: !!id,
  });
}

export function useVeiculoTimeline(id: string) {
  return useQuery({
    queryKey: ['veiculo', id, 'timeline'],
    queryFn: () => apiFetch<TimelineEvent[]>(`/api/veiculos/${id}/timeline`),
    enabled: !!id,
  });
}

export function useVeiculoDossie(id: string) {
  return useQuery({
    queryKey: ['veiculo', id, 'dossie'],
    queryFn: () => apiFetch<Record<string, unknown>>(`/api/veiculos/${id}/dossie`),
    enabled: !!id,
  });
}

export function useCreateVeiculo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Veiculo, 'id' | 'score' | 'level' | 'createdAt'>) =>
      apiFetch<Veiculo>('/api/veiculos', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['veiculos'] }); },
  });
}

export function useUpdateVeiculo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Veiculo> & { id: string }) =>
      apiFetch<Veiculo>(`/api/veiculos/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['veiculos'] });
      qc.invalidateQueries({ queryKey: ['veiculo', vars.id] });
    },
  });
}

export function useCreateAbastecimento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) =>
      apiFetch<Abastecimento>('/api/abastecimentos', {
        method: 'POST',
        body: data,
        headers: {},
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['veiculo'] }); },
  });
}

export function useCreateManutencao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Manutencao, 'id' | 'status'>) =>
      apiFetch<Manutencao>('/api/manutencoes', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['veiculo'] }); },
  });
}
