'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Equipamento, Calibracao } from '@/lib/types';

export function useEquipamentos(laboratorioId: string) {
  return useQuery({
    queryKey: ['equipamentos', laboratorioId],
    queryFn: () => apiFetch<Equipamento[]>(`/equipamentos/laboratorio/${laboratorioId}`),
    enabled: !!laboratorioId,
  });
}

export function useEquipamento(id: string) {
  return useQuery({
    queryKey: ['equipamento', id],
    queryFn: () => apiFetch<Equipamento>(`/equipamentos/${id}`),
    enabled: !!id,
  });
}

export function useEquipamentosVencidos(laboratorioId: string) {
  return useQuery({
    queryKey: ['equipamentos', laboratorioId, 'vencidos'],
    queryFn: () => apiFetch<Equipamento[]>(`/equipamentos/laboratorio/${laboratorioId}/vencidos`),
    enabled: !!laboratorioId,
  });
}

export function useCalibracoes(equipamentoId: string) {
  return useQuery({
    queryKey: ['equipamento', equipamentoId, 'calibracoes'],
    queryFn: () => apiFetch<Calibracao[]>(`/equipamentos/${equipamentoId}/calibracoes`),
    enabled: !!equipamentoId,
  });
}

export function useCreateEquipamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      laboratorioId: string;
      nome: string;
      fabricante: string;
      modelo: string;
      numeroSerie: string;
      dataAquisicao: string;
      proximaCalibracao: string;
    }) =>
      apiFetch<Equipamento>('/equipamentos', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['equipamentos'] });
    },
  });
}

export function useRegistrarCalibracao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      equipamentoId,
      ...data
    }: {
      equipamentoId: string;
      dataCalibracao: string;
      proximaCalibracao: string;
      laboratorioCalibradon: string;
      certificadoNumero: string;
      resultado: string;
      observacoes?: string;
    }) =>
      apiFetch<Calibracao>(`/equipamentos/${equipamentoId}/calibracao`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['equipamento', vars.equipamentoId] });
      qc.invalidateQueries({ queryKey: ['equipamentos'] });
    },
  });
}
