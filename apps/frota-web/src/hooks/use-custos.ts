'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { CustoDashboard } from '@/lib/types';

export function useCustos(params?: { periodo?: string; veiculoId?: string }) {
  return useQuery({
    queryKey: ['custos', params],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (params?.periodo) sp.set('periodo', params.periodo);
      if (params?.veiculoId) sp.set('veiculoId', params.veiculoId);
      const qs = sp.toString();
      return apiFetch<CustoDashboard>(`/api/custos${qs ? `?${qs}` : ''}`);
    },
  });
}
