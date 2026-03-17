import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useDocumentos(filters?: { category?: string; status?: string }) {
  return useQuery({
    queryKey: ['documentos', filters],
    queryFn: () => api<any[]>('/documentos?' + new URLSearchParams(filters as any)),
  });
}
