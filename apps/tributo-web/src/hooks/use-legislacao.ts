'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { LegislacaoItem } from '@/lib/types';

export function useLegislacao(params?: { impacto?: string }) {
  return useQuery({
    queryKey: ['legislacao', params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.impacto) searchParams.set('impacto', params.impacto);
      const qs = searchParams.toString();
      return apiFetch<LegislacaoItem[]>(`/legislacao${qs ? `?${qs}` : ''}`);
    },
  });
}
