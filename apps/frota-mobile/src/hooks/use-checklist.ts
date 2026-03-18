import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../lib/api';
import { useCallback } from 'react';

export interface ChecklistItem {
  id: string;
  categoria: string;
  label: string;
  conforme: boolean | null;
  observacao: string;
}

export interface ChecklistDraft {
  veiculoId: string;
  items: ChecklistItem[];
  updatedAt: string;
}

export interface ChecklistResult {
  id: string;
  veiculoId: string;
  status: 'APROVADO' | 'REPROVADO' | 'PARCIAL';
  score: number;
  total: number;
  items: ChecklistItem[];
  criadoEm: string;
}

const DEFAULT_ITEMS: ChecklistItem[] = [
  { id: '1', categoria: 'Pneus', label: 'Pneus em bom estado (calibragem e desgaste)', conforme: null, observacao: '' },
  { id: '2', categoria: 'Pneus', label: 'Estepe em condições de uso', conforme: null, observacao: '' },
  { id: '3', categoria: 'Freios', label: 'Freio de serviço funcionando', conforme: null, observacao: '' },
  { id: '4', categoria: 'Freios', label: 'Freio de estacionamento funcionando', conforme: null, observacao: '' },
  { id: '5', categoria: 'Luzes', label: 'Faróis dianteiros funcionando', conforme: null, observacao: '' },
  { id: '6', categoria: 'Luzes', label: 'Lanternas traseiras funcionando', conforme: null, observacao: '' },
  { id: '7', categoria: 'Luzes', label: 'Luzes de seta funcionando', conforme: null, observacao: '' },
  { id: '8', categoria: 'Espelhos', label: 'Retrovisores em bom estado', conforme: null, observacao: '' },
  { id: '9', categoria: 'Espelhos', label: 'Espelhos laterais ajustados', conforme: null, observacao: '' },
  { id: '10', categoria: 'Extintor', label: 'Extintor dentro da validade', conforme: null, observacao: '' },
  { id: '11', categoria: 'Extintor', label: 'Extintor acessível e fixado', conforme: null, observacao: '' },
  { id: '12', categoria: 'Triangulo', label: 'Triângulo de sinalização presente', conforme: null, observacao: '' },
  { id: '13', categoria: 'Macaco', label: 'Macaco e chave de roda presentes', conforme: null, observacao: '' },
  { id: '14', categoria: 'Documentacao', label: 'CRLV em dia', conforme: null, observacao: '' },
  { id: '15', categoria: 'Documentacao', label: 'CNH válida e compatível', conforme: null, observacao: '' },
  { id: '16', categoria: 'Documentacao', label: 'Seguro obrigatório (DPVAT)', conforme: null, observacao: '' },
];

export function useChecklistItems(veiculoId: string | null) {
  return useQuery<ChecklistItem[]>({
    queryKey: ['checklist-items', veiculoId],
    queryFn: async () => {
      if (!veiculoId) return DEFAULT_ITEMS;
      const draftKey = `@frota:checklist-draft:${veiculoId}`;
      const raw = await AsyncStorage.getItem(draftKey);
      if (raw) {
        const draft: ChecklistDraft = JSON.parse(raw);
        return draft.items;
      }
      return DEFAULT_ITEMS.map((item) => ({ ...item }));
    },
    enabled: true,
  });
}

export function useSaveDraft(veiculoId: string | null) {
  const queryClient = useQueryClient();

  return useCallback(
    async (items: ChecklistItem[]) => {
      if (!veiculoId) return;
      const draft: ChecklistDraft = {
        veiculoId,
        items,
        updatedAt: new Date().toISOString(),
      };
      const draftKey = `@frota:checklist-draft:${veiculoId}`;
      await AsyncStorage.setItem(draftKey, JSON.stringify(draft));
      queryClient.setQueryData(['checklist-items', veiculoId], items);
    },
    [veiculoId, queryClient],
  );
}

export function useSubmitChecklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { veiculoId: string; items: ChecklistItem[] }) => {
      const result = await api<ChecklistResult>('/api/checklists', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      const draftKey = `@frota:checklist-draft:${data.veiculoId}`;
      await AsyncStorage.removeItem(draftKey);
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items', variables.veiculoId] });
      queryClient.invalidateQueries({ queryKey: ['veiculo-score'] });
    },
  });
}
