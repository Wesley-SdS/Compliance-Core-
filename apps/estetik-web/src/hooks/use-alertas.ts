import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useAlertas(filters?: { status?: string; type?: string }) {
  return useQuery({
    queryKey: ['alertas', filters],
    queryFn: () => api<any[]>('/alertas?' + new URLSearchParams(filters as any)),
    refetchInterval: 60 * 1000,
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) =>
      api<void>(`/alertas/${alertId}/acknowledge`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
    },
  });
}
