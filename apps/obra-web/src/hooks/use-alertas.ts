import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export function useAlertas(filters?: { status?: string; type?: string }) {
  const qs = filters ? '?' + new URLSearchParams(filters as any).toString() : '';
  return useQuery({
    queryKey: ['alertas', filters],
    queryFn: () => apiFetch<any[]>(`/alertas${qs}`),
    refetchInterval: 60 * 1000,
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) =>
      apiFetch<void>(`/alertas/${alertId}/acknowledge`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
    },
  });
}
