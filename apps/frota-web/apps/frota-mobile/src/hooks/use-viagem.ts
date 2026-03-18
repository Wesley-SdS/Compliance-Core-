import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Viagem {
  id: string; motoristaId: string; motorista: string; veiculoId: string; veiculo: string;
  origem: string; destino: string; kmInicio: number; kmFim?: number;
  dataInicio: string; dataFim?: string; status: string; horasConducao: number;
  custoEstimado?: number; paradas: Parada[];
}
interface Parada { id: string; tipo: string; timestamp: string; duracao?: number; }
interface HorasConducao {
  data: string; horasDirigidas: number; horasDescanso: number;
  horasContinuas: number; conforme: boolean; alertas: string[];
}

export function useViagemAtiva(id: string | null) {
  return useQuery({
    queryKey: ['viagem', id],
    queryFn: () => api<Viagem>(`/api/viagens/${id}`),
    enabled: !!id,
    refetchInterval: 1000 * 30,
  });
}

export function useViagens(veiculoId: string | null) {
  return useQuery({
    queryKey: ['viagens', veiculoId],
    queryFn: () => api<Viagem[]>(`/api/veiculos/${veiculoId}/viagens`),
    enabled: !!veiculoId,
  });
}

export function useHorasConducao(motoristaId: string | null) {
  return useQuery({
    queryKey: ['horas', motoristaId],
    queryFn: () => api<HorasConducao[]>(`/api/motoristas/${motoristaId}/horas`),
    enabled: !!motoristaId,
  });
}

export function useIniciarViagem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { motoristaId: string; veiculoId: string; origem: string; destino: string; kmInicio: number }) =>
      api<Viagem>('/api/viagens', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['viagens'] }); },
  });
}

export function useFinalizarViagem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, kmFim }: { id: string; kmFim: number }) =>
      api<Viagem>(`/api/viagens/${id}/finalizar`, { method: 'PATCH', body: JSON.stringify({ kmFim }) }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['viagens'] });
      qc.invalidateQueries({ queryKey: ['viagem', vars.id] });
    },
  });
}

export function useRegistrarParada() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, tipo }: { id: string; tipo: string }) =>
      api<void>(`/api/viagens/${id}/parada`, { method: 'POST', body: JSON.stringify({ tipo }) }),
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ['viagem'
