'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Laboratorio, ScoreData, DashboardStats, PaginatedResult, TimelineEvent } from '@/lib/types';
import type { DueAlert } from '@compliancecore/shared';

export function useLaboratorios() {
  return useQuery({
    queryKey: ['laboratorios'],
    queryFn: async () => {
      const res = await apiFetch<PaginatedResult<Laboratorio> | Laboratorio[]>('/laboratorios');
      return Array.isArray(res) ? res : res.data;
    },
  });
}

export function useLaboratorio(id: string) {
  return useQuery({
    queryKey: ['laboratorio', id],
    queryFn: () => apiFetch<Laboratorio>(`/laboratorios/${id}`),
    enabled: !!id,
  });
}

export function useLabScore(id: string) {
  return useQuery({
    queryKey: ['laboratorio', id, 'score'],
    queryFn: () => apiFetch<ScoreData>(`/laboratorios/${id}/score`),
    enabled: !!id,
  });
}

export function useLabStats(id: string) {
  return useQuery({
    queryKey: ['laboratorio', id, 'stats'],
    queryFn: () => apiFetch<DashboardStats>(`/laboratorios/${id}/stats`),
    enabled: !!id,
  });
}

export function useLabAlerts(id: string) {
  return useQuery({
    queryKey: ['laboratorio', id, 'alerts'],
    queryFn: () => apiFetch<DueAlert[]>(`/laboratorios/${id}/alerts`),
    enabled: !!id,
  });
}

export function useLabTimeline(id: string, page = 1) {
  return useQuery({
    queryKey: ['laboratorio', id, 'timeline', page],
    queryFn: () => apiFetch<TimelineEvent[]>(`/laboratorios/${id}/timeline?page=${page}&limit=50`),
    enabled: !!id,
  });
}

export function useLabDossier(id: string) {
  return useQuery({
    queryKey: ['laboratorio', id, 'dossier'],
    queryFn: async () => {
      const dossier = await apiFetch<any>(`/laboratorios/${id}/dossier`);
      return {
        score: dossier.score?.value ?? 0,
        level: dossier.score?.level ?? 'CRITICO',
        documentCount: Array.isArray(dossier.documents) ? dossier.documents.length : 0,
        eventCount: Array.isArray(dossier.laudos) ? dossier.laudos.length : 0,
        checklistCount: 0,
      };
    },
    enabled: !!id,
  });
}

export function useAcknowledgeAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) =>
      apiFetch(`/laboratorios/alertas/${alertId}/acknowledge`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['laboratorio'] });
    },
  });
}
