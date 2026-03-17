'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { DueAlert } from '@compliancecore/shared';

export function useAlerts(empresaId: string) {
  return useQuery({
    queryKey: ['empresa', empresaId, 'alerts'],
    queryFn: () => apiFetch<DueAlert[]>(`/empresas/${empresaId}/alerts`),
    enabled: !!empresaId,
  });
}
