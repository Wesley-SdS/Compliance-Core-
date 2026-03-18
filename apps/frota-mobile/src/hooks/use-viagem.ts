import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAppStore } from '../stores/app-store';

export interface Viagem {
  id: string;
  veiculoId: string;
  motoristaId: string;
  origem: string;
  destino: string;
  kmInicial: number;
  kmFinal?: number;
  iniciadaEm: string;
  finalizadaEm?: string;
  status: 'EM_ANDAMENTO' | 'FINALIZADA' | 'CANCELADA';
  paradas: Parada[];
}

export interface Parada {
  id: string;
  tipo: 'DESCANSO' | 'REFEICAO' | 'CARGA' | 'DESCARGA';
  iniciadaEm: string;
  finalizadaEm?: string;
  observacao?: string;
}

export interface HorasConducao {
  horasContinuas: number;
  horasTotal24h: number;
  limiteContinuo: number;
  limiteTotal: number;
  alertaContinuo: boolean;
  alertaTotal: boolean;
}

export interface Abastecimento {
  id: string;
  veiculoId: string;
  data: string;
  litros: number;
  valorLitro: number;
  total: number;
  posto: string;
  km: number;
  fotoUri?: string;
  ocrStatus: 'PENDENTE' | 'PROCESSANDO' | 'CONCLUIDO' | 'ERRO';
}

export function useViagemAtiva(veiculoId: string | null) {
  return useQuery<Viagem | null>({
    queryKey: ['viagem-ativa', veiculoId],
    queryFn: () => api(`/api/veiculos/${veiculoId}/viagem-ativa`),
    enabled: !!veiculoId,
    refetchInterval: 30000,
  });
}

export function useHorasConducao(veiculoId: string | null) {
  return useQuery<HorasConducao>({
    queryKey: ['horas-conducao', veiculoId],
    queryFn: () => api(`/api/veiculos/${veiculoId}/horas-conducao`),
    enabled: !!veiculoId,
    refetchInterval: 60000,
  });
}

export function useIniciarViagem() {
  const queryClient = useQueryClient();
  const setViagemAtiva = useAppStore((s) => s.setViagemAtiva);

  return useMutation({
    mutationFn: (data: { veiculoId: string; kmInicial: number; origem: string; destino: string }) =>
      api<Viagem>('/api/viagens', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (viagem) => {
      setViagemAtiva(viagem.id);
      queryClient.invalidateQueries({ queryKey: ['viagem-ativa'] });
    },
  });
}

export function useFinalizarViagem() {
  const queryClient = useQueryClient();
  const setViagemAtiva = useAppStore((s) => s.setViagemAtiva);

  return useMutation({
    mutationFn: (data: { viagemId: string; kmFinal: number }) =>
      api<Viagem>(`/api/viagens/${data.viagemId}/finalizar`, {
        method: 'POST',
        body: JSON.stringify({ kmFinal: data.kmFinal }),
      }),
    onSuccess: () => {
      setViagemAtiva(null);
      queryClient.invalidateQueries({ queryKey: ['viagem-ativa'] });
      queryClient.invalidateQueries({ queryKey: ['viagens'] });
    },
  });
}

export function useRegistrarParada() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { viagemId: string; tipo: string; observacao?: string }) =>
      api(`/api/viagens/${data.viagemId}/paradas`, {
        method: 'POST',
        body: JSON.stringify({ tipo: data.tipo, observacao: data.observacao }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['viagem-ativa'] });
    },
  });
}

export function useAbastecimentos(veiculoId: string | null) {
  return useQuery<Abastecimento[]>({
    queryKey: ['abastecimentos', veiculoId],
    queryFn: () => api(`/api/veiculos/${veiculoId}/abastecimentos`),
    enabled: !!veiculoId,
  });
}

export function useRegistrarAbastecimento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      veiculoId: string;
      litros: number;
      valorLitro: number;
      total: number;
      posto: string;
      km: number;
      fotoUri?: string;
    }) =>
      api('/api/abastecimentos', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abastecimentos'] });
    },
  });
}
