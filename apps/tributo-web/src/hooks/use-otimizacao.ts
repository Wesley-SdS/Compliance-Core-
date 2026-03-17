'use client';

import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { OtimizacaoResult } from '@/lib/types';

export function useOtimizarMix() {
  return useMutation({
    mutationFn: (empresaId: string) =>
      apiFetch<OtimizacaoResult>(`/empresas/${empresaId}/otimizar`, {
        method: 'POST',
      }),
  });
}
