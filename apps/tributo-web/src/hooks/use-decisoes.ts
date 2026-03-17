'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { DecisaoFiscal } from '@/lib/types';

export function useDecisoes(empresaId: string) {
  return useQuery({
    queryKey: ['decisoes', empresaId],
    queryFn: () => apiFetch<DecisaoFiscal[]>(`/empresas/${empresaId}/decisoes`),
    enabled: !!empresaId,
  });
}

export function useCreateDecisao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { empresaId: string; descricao: string; fundamentacaoLegal: string; simulacaoId?: string }) =>
      apiFetch<DecisaoFiscal>(`/empresas/${data.empresaId}/decisoes`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['decisoes', vars.empresaId] });
    },
  });
}
