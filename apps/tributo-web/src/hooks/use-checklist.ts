'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Checklist, ChecklistResponse, ChecklistResult } from '@compliancecore/shared';

export function useChecklist(empresaId: string) {
  return useQuery({
    queryKey: ['empresa', empresaId, 'checklist'],
    queryFn: () => apiFetch<Checklist[]>(`/empresas/${empresaId}/checklist`),
    enabled: !!empresaId,
  });
}

export function useUpdateChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { empresaId: string; checklistId: string; responses: ChecklistResponse[] }) =>
      apiFetch<ChecklistResult>(`/empresas/${data.empresaId}/checklist`, {
        method: 'PUT',
        body: JSON.stringify({ checklistId: data.checklistId, responses: data.responses }),
      }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['empresa', vars.empresaId, 'checklist'] });
    },
  });
}
