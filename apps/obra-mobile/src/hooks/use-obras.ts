import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, uploadFile } from '@/src/lib/api';

export function useObras() {
  return useQuery({
    queryKey: ['obras'],
    queryFn: () => api<any>('/obras'),
  });
}

export function useObraScore(obraId: string | null) {
  return useQuery({
    queryKey: ['obra', obraId, 'score'],
    queryFn: () => api<any>(`/obras/${obraId}/score`),
    enabled: !!obraId,
    refetchInterval: 5 * 60 * 1000,
    placeholderData: { overall: 0, level: 'CRITICO', trend: 'ESTAVEL', breakdown: [] },
  });
}

export function useObraEtapas(obraId: string | null) {
  return useQuery({
    queryKey: ['obra', obraId, 'etapas'],
    queryFn: () => api<any[]>(`/etapas/obra/${obraId}`),
    enabled: !!obraId,
  });
}

export function useObraAlerts(obraId: string | null) {
  return useQuery({
    queryKey: ['obra', obraId, 'alerts'],
    queryFn: () => api<any[]>(`/obras/${obraId}/alerts`),
    enabled: !!obraId,
    refetchInterval: 60 * 1000,
  });
}

export function useUploadNota(obraId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fileUri: string) => uploadFile(`/materiais/${obraId}/ocr`, fileUri),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obra', obraId] });
    },
  });
}

export function useUploadFoto(obraId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { fileUri: string; etapaId: string; descricao?: string; latitude?: number; longitude?: number }) =>
      uploadFile(`/obras/${obraId}/fotos`, data.fileUri, {
        etapaId: data.etapaId,
        descricao: data.descricao || '',
        latitude: String(data.latitude || 0),
        longitude: String(data.longitude || 0),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obra', obraId, 'fotos'] });
    },
  });
}

export function useSubmitChecklist(obraId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { etapaId: string; responses: any[] }) =>
      api<any>(`/obras/${obraId}/etapas/${data.etapaId}/checklist`, {
        method: 'POST',
        body: JSON.stringify({ responses: data.responses }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obra', obraId, 'etapas'] });
      queryClient.invalidateQueries({ queryKey: ['obra', obraId, 'score'] });
    },
  });
}

export function useAcknowledgeAlert(obraId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) =>
      api<void>(`/alertas/${alertId}/acknowledge`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obra', obraId, 'alerts'] });
      queryClient.invalidateQueries({ queryKey: ['obra', obraId, 'score'] });
    },
  });
}
