import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function usePops() {
  return useQuery({
    queryKey: ['pops'],
    queryFn: () => api<any[]>('/pops'),
  });
}

export function usePop(id: string) {
  return useQuery({
    queryKey: ['pop', id],
    queryFn: () => api<any>(`/pops/${id}`),
    enabled: !!id,
  });
}

export function useGeneratePop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { procedimentoTipo: string; clinicaId: string }) =>
      api<any>('/pops/generate', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pops'] });
    },
  });
}

export function useApprovePop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (popId: string) =>
      api<any>(`/pops/${popId}/approve`, { method: 'PUT' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pops'] });
    },
  });
}
