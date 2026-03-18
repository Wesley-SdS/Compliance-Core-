'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Motorista, HorasConducao, Documento, Alerta, Viagem } from '@/lib/types';

export function useMotoristas() {
  return useQuery({
    queryKey: ['motoristas'],
    queryFn: () => apiFetch<Motorista[]>('/api/motoristas'),
  });
}

export function useMotorista(id: string) {
  return useQuery({
    queryKey: ['motorista', id],
    queryFn: () => apiFetch<Motorista>(`/api/motoristas/${id}`),
    enabled: !!id,
  });
}

export function useMotoristaHoras(id: string) {
  return useQuery({
    queryKey: ['motorista', id, 'horas'],
    queryFn: () => apiFetch<HorasConducao[]>(`/api/motoristas/${id}/horas`),
    enabled: !!id,
  });
}

export function useMotoristaViagens(id: string) {
  return useQuery({
    queryKey: ['motorista', id, 'viagens'],
    queryFn: () => apiFetch<Viagem[]>(`/api/motoristas/${id}/viagens`),
    enabled: !!id,
  });
}

export function useMotoristaDocumentos(id: string) {
  return useQuery({
    queryKey: ['motorista', id, 'documentos'],
    queryFn: () => apiFetch<Documento[]>(`/api/motoristas/${id}/documentos`),
    enabled: !!id,
  });
}

export function useMotoristaAlertas(id: string) {
  return useQuery({
    queryKey: ['motorista', id, 'alertas'],
    queryFn: () => apiFetch<Alerta[]>(`/api/motoristas/${id}/alertas`),
    enabled: !!id,
  });
}

export function useCreateMotorista() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Motorista, 'id' | 'score' | 'level' | 'statusCnh' | 'statusMopp' | 'createdAt'>) =>
      apiFetch<Motorista>('/api/motoristas', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['motoristas'] }); },
  });
}

export function useUpdateMotorista() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Motorista> & { id: string }) =>
      apiFetch<Motorista>(`/api/motoristas/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['motoristas'] });
      qc.invalidateQueries({ queryKey: ['motorista', vars.id] });
    },
  });
}
