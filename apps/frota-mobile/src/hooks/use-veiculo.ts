import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
  ano: number;
  km: number;
  status: string;
}

export interface VeiculoScore {
  score: number;
  detalhes: {
    documentacao: number;
    manutencao: number;
    checklist: number;
    conducao: number;
  };
}

export interface Alerta {
  id: string;
  tipo: 'DOCUMENTO' | 'MANUTENCAO' | 'CONDUCAO' | 'CHECKLIST';
  severidade: 'ALTA' | 'MEDIA' | 'BAIXA';
  titulo: string;
  descricao: string;
  dataExpiracao?: string;
  lido: boolean;
  criadoEm: string;
}

export interface Documento {
  id: string;
  tipo: string;
  nome: string;
  status: 'VALIDO' | 'VENCENDO' | 'VENCIDO';
  dataValidade: string;
}

export interface Manutencao {
  id: string;
  tipo: string;
  descricao: string;
  dataAgendada?: string;
  dataRealizada?: string;
  km?: number;
  status: 'PENDENTE' | 'AGENDADA' | 'REALIZADA';
}

export function useVeiculos() {
  return useQuery<Veiculo[]>({
    queryKey: ['veiculos'],
    queryFn: () => api('/api/veiculos'),
  });
}

export function useVeiculoAtivo(id: string | null) {
  return useQuery<Veiculo>({
    queryKey: ['veiculo', id],
    queryFn: () => api(`/api/veiculos/${id}`),
    enabled: !!id,
  });
}

export function useVeiculoScore(id: string | null) {
  return useQuery<VeiculoScore>({
    queryKey: ['veiculo-score', id],
    queryFn: () => api(`/api/veiculos/${id}/score`),
    enabled: !!id,
  });
}

export function useVeiculoAlertas(id: string | null) {
  return useQuery<Alerta[]>({
    queryKey: ['veiculo-alertas', id],
    queryFn: () => api(`/api/veiculos/${id}/alertas`),
    enabled: !!id,
  });
}

export function useDocumentos(veiculoId: string | null) {
  return useQuery<Documento[]>({
    queryKey: ['documentos', veiculoId],
    queryFn: () => api(`/api/veiculos/${veiculoId}/documentos`),
    enabled: !!veiculoId,
  });
}

export function useManutencoes(veiculoId: string | null) {
  return useQuery<Manutencao[]>({
    queryKey: ['manutencoes', veiculoId],
    queryFn: () => api(`/api/veiculos/${veiculoId}/manutencoes`),
    enabled: !!veiculoId,
  });
}
