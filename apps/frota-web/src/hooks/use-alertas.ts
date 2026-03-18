'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Alerta, Documento } from '@/lib/types';

export function useDocumentosVencimentos() {
  return useQuery({
    queryKey: ['documentos', 'vencimentos'],
    queryFn: () => apiFetch<Documento[]>('/api/documentos/vencimentos'),
  });
}

export function useManutencoesAlertas() {
  return useQuery({
    queryKey: ['manutencoes', 'alertas'],
    queryFn: () => apiFetch<Array<{ id: string; veiculoId: string; placa: string; tipo: string; kmPrevisto: number; kmAtual: number }>>('/api/manutencoes/alertas'),
  });
}

export function useAcknowledgeAlerta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/api/alertas/${id}/acknowledge`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alertas'] });
      qc.invalidateQueries({ queryKey: ['veiculo'] });
    },
  });
}
