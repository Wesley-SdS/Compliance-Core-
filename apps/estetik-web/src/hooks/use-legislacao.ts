import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useLegislacao() {
  return useQuery({
    queryKey: ['legislacao'],
    queryFn: () => api<any[]>('/legislacao'),
    refetchInterval: 10 * 60 * 1000,
  });
}

export function useLegislacaoImpact(legislacaoId: string, clinicaId: string) {
  return useQuery({
    queryKey: ['legislacao', legislacaoId, 'impact', clinicaId],
    queryFn: () => api<any>(`/legislacao/${legislacaoId}/impact/${clinicaId}`),
    enabled: !!legislacaoId && !!clinicaId,
  });
}

export function useAcknowledgeLegislacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<void>(`/legislacao/${id}/acknowledge`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legislacao'] });
    },
  });
}
