'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Checklist } from '@compliancecore/shared';

export function useChecklist(empresaId: string) {
  return useQuery({
    queryKey: ['empresa', empresaId, 'checklist'],
    queryFn: () => apiFetch<Checklist[]>(`/empresas/${empresaId}/checklist`),
    enabled: !!empresaId,
  });
}
