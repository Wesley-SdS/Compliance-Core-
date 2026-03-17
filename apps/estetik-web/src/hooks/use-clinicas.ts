import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useClinicas(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ['clinicas', params],
    queryFn: () => api<any>(`/clinicas?${new URLSearchParams(params as any)}`),
  });
}

export function useClinica(id: string) {
  return useQuery({
    queryKey: ['clinica', id],
    queryFn: () => api<any>(`/clinicas/${id}`),
    enabled: !!id,
  });
}

export function useClinicaScore(id: string) {
  return useQuery({
    queryKey: ['clinica', id, 'score'],
    queryFn: () => api<any>(`/clinicas/${id}/score`),
    enabled: !!id,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useClinicaDocuments(id: string) {
  return useQuery({
    queryKey: ['clinica', id, 'documents'],
    queryFn: () => api<any>(`/clinicas/${id}/documents`),
    enabled: !!id,
  });
}

export function useClinicaTimeline(id: string) {
  return useQuery({
    queryKey: ['clinica', id, 'timeline'],
    queryFn: () => api<any>(`/clinicas/${id}/timeline`),
    enabled: !!id,
  });
}

export function useClinicaAlerts(id: string) {
  return useQuery({
    queryKey: ['clinica', id, 'alerts'],
    queryFn: () => api<any>(`/clinicas/${id}/alerts`),
    enabled: !!id,
  });
}

export function useClinicaChecklist(id: string) {
  return useQuery({
    queryKey: ['clinica', id, 'checklist'],
    queryFn: () => api<any>(`/clinicas/${id}/checklist`),
    enabled: !!id,
  });
}

export function useCalculateScore(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api<any>(`/clinicas/${id}/score/calculate`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinica', id, 'score'] });
    },
  });
}

export function useUploadDocument(clinicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { file: File; category: string; expiresAt?: string }) => {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('category', data.category);
      if (data.expiresAt) formData.append('expiresAt', data.expiresAt);
      return api<any>(`/clinicas/${clinicId}/documents`, {
        method: 'POST',
        body: formData,
        headers: {},
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinica', clinicId, 'documents'] });
      queryClient.invalidateQueries({ queryKey: ['clinica', clinicId, 'score'] });
    },
  });
}

export function useGenerateDossier(clinicId: string) {
  return useMutation({
    mutationFn: (data: { startDate: string; endDate: string }) =>
      api<any>(`/clinicas/${clinicId}/dossier`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });
}

export function useClinicaScoreHistory(id: string, months: number = 6) {
  return useQuery({
    queryKey: ['score-history', id, months],
    queryFn: () => api(`/clinicas/${id}/score/history?months=${months}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}
