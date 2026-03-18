import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, uploadFile } from '../lib/api';

interface Veiculo {
  id: string; placa: string; tipo: string; marca: string; modelo: string;
  ano: number; km: number; score: number; level: string;
}
interface ScoreData {
  value: number; level: string; trend: string;
  criteria?: Array<{ criterionId: string; name: string; weight: number; score: number; status: string }>;
}
interface Alerta { id: string; tipo: string; mensagem: string; severity: string; acknowledged: boolean; createdAt: string; }
interface Abastecimento { id: string; data: string; litros: number; valorLitro: number; total: number; posto: string; km: number; statusOcr: string; }
interface Manutencao { id: string; tipo: string; data: string; km: number; custo: number; fornecedor: string; status: string; }
interface Documento { id: string; categoria: string; nome: string; status: string; vencimento: string; }

export function useVeiculos() {
  return useQuery({ queryKey: ['veiculos'], queryFn: () => api<Veiculo[]>('/api/veiculos') });
}

export function useVeiculoAtivo(id: string | null) {
  return useQuery({
    queryKey: ['veiculo', id],
    queryFn: () => api<Veiculo>(`/api/veiculos/${id}`),
    enabled: !!id,
  });
}

export function useVeiculoScore(id: string | null) {
  return useQuery({
    queryKey: ['veiculo', id, 'score'],
    queryFn: () => api<ScoreData>(`/api/veiculos/${id}/score`),
    enabled: !!id,
    refetchInterval: 1000 * 60 * 5,
  });
}

export function useVeiculoAlertas(id: string | null) {
  return useQuery({
    queryKey: ['veiculo', id, 'alertas'],
    queryFn: () => api<Alerta[]>(`/api/veiculos/${id}/alertas`),
    enabled: !!id,
  });
}

export function useAbastecimentos(veiculoId: string | null) {
  return useQuery({
    queryKey: ['veiculo', veiculoId, 'abastecimentos'],
    queryFn: () => api<Abastecimento[]>(`/api/veiculos/${veiculoId}/abastecimentos`),
    enabled: !!veiculoId,
  });
}

export function useRegistrarAbastecimento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { veiculoId: string; fileUri?: string; litros: number; valorLitro: number; total: number; posto: string; km: number }) => {
      if (data.fileUri) {
        await uploadFile('/api/abastecimentos', data.fileUri, {
          veiculoId: data.veiculoId,
          litros: String(data.litros),
          valorLitro: String(data.valorLitro),
          total: String(data.total),
          posto: data.posto,
          km: String(data.km),
        });
      } else {
        await api('/api/abastecimentos', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['veiculo'] }); },
  });
}

export function useManutencoes(veiculoId: string | null) {
  return useQuery({
    queryKey: ['veiculo', veiculoId, 'manutencoes'],
    queryFn: () => api<Manutencao[]>(`/api/veiculos/${veiculoId}/manutencoes`),
    enabled: !!veiculoId,
  });
}

export function useRegistrarManutencao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { veiculoId: string; tipo: string; data: string; km: number; custo: number; fornecedor?: string; descricao?: string }) =>
      api('/api/manutencoes', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['veiculo'] }); },
  });
}

export function useDocumentos(veiculoId: string | null) {
  return useQuery({
    queryKey: ['veiculo', veiculoId, 'documentos'],
    queryFn: () => api<Documento[]>(`/api/veiculos/${veiculoId}/documentos`),
    enabled: !!veiculoId,
  });
}

export function useUploadDocumento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ veiculoId, fileUri, categoria }: { veiculoId: string; fileUri: string; categoria: string }) =>
      uploadFile(`/api/veiculos/${veiculoId}/documentos`, fileUri, { categoria }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['veiculo'] }); },
  });
}
