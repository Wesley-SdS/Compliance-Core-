'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { ScoreData, FrotaStats, LegislacaoItem, ChecklistPreViagem } from '@/lib/types';

export function useFrotaScore() {
  return useQuery({
    queryKey: ['frota', 'score'],
    queryFn: () => apiFetch<ScoreData>('/api/frota/score'),
  });
}

export function useFrotaStats() {
  return useQuery({
    queryKey: ['frota', 'stats'],
    queryFn: () => apiFetch<FrotaStats>('/api/frota/stats'),
  });
}

export function useFrotaScoreHistory() {
  return useQuery({
    queryKey: ['frota', 'score-history'],
    queryFn: () => apiFetch<Array<{ data: string; value: number }>>('/api/frota/score/history'),
  });
}

export function useFrotaTimeline() {
  return useQuery({
    queryKey: ['frota', 'timeline'],
    queryFn: () => apiFetch<Array<{ id: string; title: string; description: string; timestamp: string }>>('/api/frota/timeline'),
  });
}

export function useLegislacao() {
  return useQuery({
    queryKey: ['legislacao'],
    queryFn: () => apiFetch<LegislacaoItem[]>('/api/legislacao'),
  });
}

export function useSubmitChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ChecklistPreViagem, 'id' | 'score' | 'status'>) =>
      apiFetch<ChecklistPreViagem>('/api/checklists', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['veiculo'] });
    },
  });
}

export function useUploadDocumento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ veiculoId, formData }: { veiculoId: string; formData: FormData }) =>
      apiFetch<void>(`/api/veiculos/${veiculoId}/documentos`, {
        method: 'POST',
        body: formData,
        headers: {},
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['veiculo'] });
      qc.invalidateQueries({ queryKey: ['documentos'] });
    },
  });
}
