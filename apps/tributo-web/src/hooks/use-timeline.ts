'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { TimelineEvent } from '@/lib/types';

export function useTimeline(empresaId: string) {
  return useQuery({
    queryKey: ['timeline', empresaId],
    queryFn: () => apiFetch<TimelineEvent[]>(`/empresas/${empresaId}/timeline`),
    enabled: !!empresaId,
  });
}
