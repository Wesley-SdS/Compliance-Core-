'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Laudo, RevisaoIA, PaginatedResult } from '@/lib/types';

interface LaudoFilters {
  laboratorioId?: string;
  status?: string;
  tipoExame?: string;
  bioquimico?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useLaudos(filters?: LaudoFilters) {
  return useQuery({
    queryKey: ['laudos', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.laboratorioId) params.set('laboratorioId', filters.laboratorioId);
      if (filters?.status && filters.status !== 'Todos') params.set('status', filters.status);
      if (filters?.tipoExame) params.set('tipoExame', filters.tipoExame);
      if (filters?.bioquimico) params.set('bioquimico', filters.bioquimico);
      if (filters?.search) params.set('search', filters.search);
      if (filters?.page) params.set('page', String(filters.page));
      if (filters?.limit) params.set('limit', String(filters.limit));
      const qs = params.toString();

      if (filters?.laboratorioId) {
        return apiFetch<PaginatedResult<Laudo>>(`/laudos/laboratorio/${filters.laboratorioId}${qs ? `?${qs}` : ''}`);
      }
      const res = await apiFetch<PaginatedResult<Laudo> | Laudo[]>(`/laudos${qs ? `?${qs}` : ''}`);
      return Array.isArray(res) ? { data: res, total: res.length, page: 1, limit: 20, hasMore: false } : res;
    },
  });
}

export function useLaudo(id: string) {
  return useQuery({
    queryKey: ['laudo', id],
    queryFn: () => apiFetch<Laudo>(`/laudos/${id}`),
    enabled: !!id,
  });
}

export function useCreateLaudo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      laboratorioId: string;
      tipoExame: string;
      materialBiologico: string;
      metodologia: string;
      pacienteId?: string;
      templateId?: string;
    }) =>
      apiFetch<Laudo>('/laudos', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['laudos'] });
    },
  });
}

export function useUpdateLaudo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      apiFetch<Laudo>(`/laudos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['laudos'] });
      qc.invalidateQueries({ queryKey: ['laudo', vars.id] });
    },
  });
}

export function useRevisaoIA() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (laudoId: string) =>
      apiFetch<RevisaoIA>(`/laudos/${laudoId}/ai-review`, { method: 'POST' }),
    onSuccess: (_, laudoId) => {
      qc.invalidateQueries({ queryKey: ['laudo', laudoId] });
    },
  });
}

export function useLiberarLaudo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (laudoId: string) =>
      apiFetch<Laudo>(`/laudos/${laudoId}/liberar`, { method: 'POST' }),
    onSuccess: (_, laudoId) => {
      qc.invalidateQueries({ queryKey: ['laudos'] });
      qc.invalidateQueries({ queryKey: ['laudo', laudoId] });
    },
  });
}

export function useAlertaIAAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ laudoId, alertaId, acao, analito }: { laudoId: string; alertaId: string; acao: string; analito?: string }) =>
      apiFetch<{ success: boolean }>(`/laudos/${laudoId}/ai-review/action`, {
        method: 'POST',
        body: JSON.stringify({ alertaId, acao, analito }),
      }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['laudo', vars.laudoId, 'historico'] });
    },
  });
}

export function useLaudoHistorico(laudoId: string) {
  return useQuery({
    queryKey: ['laudo', laudoId, 'historico'],
    queryFn: () => apiFetch<Array<{ id: string; type: string; title: string; description: string; timestamp: string; actor: string }>>(`/laudos/${laudoId}/historico`),
    enabled: !!laudoId,
  });
}
