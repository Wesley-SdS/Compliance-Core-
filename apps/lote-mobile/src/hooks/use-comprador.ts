import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useMeuLote() {
  return useQuery({
    queryKey: ['meu-lote'],
    queryFn: () => api<any>('/comprador/meu-lote'),
  });
}

export function useMinhasParcelas() {
  return useQuery({
    queryKey: ['minhas-parcelas'],
    queryFn: () => api<any[]>('/comprador/parcelas'),
  });
}

export function useInfraestruturaLoteamento(loteamentoId: string) {
  return useQuery({
    queryKey: ['infraestrutura', loteamentoId],
    queryFn: () => api<any[]>(`/loteamentos/${loteamentoId}/infraestrutura`),
    enabled: !!loteamentoId,
  });
}

export function useMeusDocumentos() {
  return useQuery({
    queryKey: ['meus-documentos'],
    queryFn: () => api<any[]>('/comprador/documentos'),
  });
}
