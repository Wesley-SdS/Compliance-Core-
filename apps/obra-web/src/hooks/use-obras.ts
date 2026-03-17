import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export function useObras(params?: { page?: number; limit?: number; search?: string }) {
  const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
  return useQuery({
    queryKey: ['obras', params],
    queryFn: () => apiFetch<any>(qs ? `/obras${qs}` : '/obras'),
  });
}

export function useObra(id: string) {
  return useQuery({
    queryKey: ['obra', id],
    queryFn: () => apiFetch<any>(`/obras/${id}`),
    enabled: !!id,
  });
}

export function useObraScore(id: string) {
  return useQuery({
    queryKey: ['obra', id, 'score'],
    queryFn: () => apiFetch<any>(`/obras/${id}/score`),
    enabled: !!id,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useObraScoreHistory(id: string, months: number = 6) {
  return useQuery({
    queryKey: ['obra', id, 'score-history', months],
    queryFn: () => apiFetch<any>(`/obras/${id}/score/history?months=${months}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useObraEtapas(id: string) {
  return useQuery({
    queryKey: ['obra', id, 'etapas'],
    queryFn: () => apiFetch<any[]>(`/etapas/obra/${id}`),
    enabled: !!id,
  });
}

export function useObraDocuments(id: string) {
  return useQuery({
    queryKey: ['obra', id, 'documents'],
    queryFn: () => apiFetch<any[]>(`/obras/${id}/documents`),
    enabled: !!id,
  });
}

export function useObraTimeline(id: string) {
  return useQuery({
    queryKey: ['obra', id, 'timeline'],
    queryFn: () => apiFetch<any[]>(`/obras/${id}/timeline`),
    enabled: !!id,
  });
}

export function useObraAlerts(id: string) {
  return useQuery({
    queryKey: ['obra', id, 'alerts'],
    queryFn: () => apiFetch<any[]>(`/obras/${id}/alerts`),
    enabled: !!id,
  });
}

export function useObraNotas(id: string) {
  return useQuery({
    queryKey: ['obra', id, 'notas'],
    queryFn: () => apiFetch<any[]>(`/obras/${id}/notas`),
    enabled: !!id,
  });
}

export function useObraMateriais(id: string) {
  return useQuery({
    queryKey: ['obra', id, 'materiais'],
    queryFn: () => apiFetch<any[]>(`/obras/${id}/materiais`),
    enabled: !!id,
  });
}

export function useObraFotos(id: string) {
  return useQuery({
    queryKey: ['obra', id, 'fotos'],
    queryFn: () => apiFetch<any[]>(`/obras/${id}/fotos`),
    enabled: !!id,
  });
}

export function useObraRelatorio(id: string) {
  return useQuery({
    queryKey: ['obra', id, 'relatorio'],
    queryFn: () => apiFetch<any>(`/obras/${id}/relatorio`),
    enabled: !!id,
  });
}

export function useObraDossier(id: string) {
  return useQuery({
    queryKey: ['obra', id, 'dossier'],
    queryFn: () => apiFetch<any>(`/obras/${id}/dossier`),
    enabled: !!id,
  });
}

export function useObraChecklist(id: string) {
  return useQuery({
    queryKey: ['obra', id, 'checklist'],
    queryFn: () => apiFetch<any>(`/obras/${id}/checklist`),
    enabled: !!id,
  });
}

export function useCreateObra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiFetch<any>('/obras', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obras'] });
    },
  });
}

export function useUpdateObra(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiFetch<any>(`/obras/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obra', id] });
      queryClient.invalidateQueries({ queryKey: ['obras'] });
    },
  });
}

export function useUploadDocument(obraId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiFetch<any>(`/obras/${obraId}/documents`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obra', obraId, 'documents'] });
      queryClient.invalidateQueries({ queryKey: ['obra', obraId, 'score'] });
    },
  });
}

export function useUploadNota(obraId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { imagemUrl: string }) =>
      apiFetch<any>(`/obras/${obraId}/notas`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obra', obraId, 'notas'] });
      queryClient.invalidateQueries({ queryKey: ['obra', obraId, 'materiais'] });
    },
  });
}

export function useOcrNota(materialId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiFetch<any>(`/materiais/${materialId}/ocr`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obras'] });
    },
  });
}

export function useUploadFoto(obraId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiFetch<any>(`/obras/${obraId}/fotos`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obra', obraId, 'fotos'] });
    },
  });
}

export function useSubmitEtapaChecklist(obraId: string, etapaId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiFetch<any>(`/obras/${obraId}/etapas/${etapaId}/checklist`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obra', obraId, 'etapas'] });
      queryClient.invalidateQueries({ queryKey: ['obra', obraId, 'score'] });
    },
  });
}

export function useGenerateDossier(obraId: string) {
  return useMutation({
    mutationFn: () => apiFetch<any>(`/obras/${obraId}/dossier`, { method: 'POST' }),
  });
}

export function useTransferMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { materialId: string; fromObraId: string; toObraId: string; quantidade: number }) =>
      apiFetch<any>('/materiais/transferir', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obras'] });
    },
  });
}
