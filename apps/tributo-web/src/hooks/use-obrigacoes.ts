'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Obrigacao } from '@/lib/types';

export function useObrigacoes(params?: { empresaId?: string; status?: string }) {
  return useQuery({
    queryKey: ['obrigacoes', params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.empresaId) searchParams.set('empresaId', params.empresaId);
      if (params?.status) searchParams.set('status', params.status);
      const qs = searchParams.toString();
      return apiFetch<Obrigacao[]>(`/obrigacoes${qs ? `?${qs}` : ''}`);
    },
  });
}
