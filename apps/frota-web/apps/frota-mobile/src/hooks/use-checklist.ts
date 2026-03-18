import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../lib/api';

const DRAFT_KEY = 'checklist_draft';

export interface ChecklistItem {
  id: string;
  item: string;
  categoria: string;
  obrigatorio: boolean;
  conforme?: boolean;
  observacao?: string;
}

const DEFAULT_ITEMS: ChecklistItem[] = [
  { id: '1', item: 'Pneus em bom estado', categoria: 'Pneus', obrigatorio: true },
  { id: '2', item: 'Calibragem dos pneus', categoria: 'Pneus', obrigatorio: true },
  { id: '3', item: 'Freio de servico funcional', categoria: 'Freios', obrigatorio: true },
  { id: '4', item: 'Freio de estacionamento funcional', categoria: 'Freios', obrigatorio: true },
  { id: '5', item: 'Farois dianteiros', categoria: 'Luzes', obrigatorio: true },
  { id: '6', item: 'Lanternas traseiras e setas', categoria: 'Luzes', obrigatorio: true },
  { id: '7', item: 'Luz de freio funcional', categoria: 'Luzes', obrigatorio: true },
  { id: '8', item: 'Espelhos retrovisores', categoria: 'Espelhos', obrigatorio: true },
  { id: '9', item: 'Extintor de incendio (validade)', categoria: 'Seguranca', obrigatorio: true },
  { id: '10', item: 'Triangulo de sinalizacao', categoria: 'Seguranca', obrigatorio: true },
  { id: '11', item: 'Macaco e chave de rodas', categoria: 'Seguranca', obrigatorio: false },
  { id: '12', item: 'CNH do motorista', categoria: 'Documentacao', obrigatorio: true },
  { id: '13', item: 'CRLV do veiculo', categoria: 'Documentacao', obrigatorio: true },
  { id: '14', item: 'Seguro RCTR-C', categoria: 'Documentacao', obrigatorio: true },
  { id: '15', item: 'Nivel de oleo do motor', categoria: 'Fluidos', obrigatorio: false },
  { id: '16', item: 'Nivel de agua do radiador', categoria: 'Fluidos', obrigatorio: false },
];

export function useChecklistItems() {
  return useQuery({
    queryKey: ['checklist-items'],
    queryFn: async () => {
      try {
        const items = await api<ChecklistItem[]>('/api/checklists/items');
        return items.length > 0 ? items : DEFAULT_ITEMS;
      } catch {
        return DEFAULT_ITEMS;
      }
    },
    placeholderData: DEFAULT_ITEMS,
  });
}

export function useSaveDraft() {
  return useMutation({
    mutationFn: async (items: ChecklistItem[]) => {
      await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(items));
    },
  });
}

export async function loadDraft(): Promise<ChecklistItem[] | null> {
  try {
    const stored = await AsyncStorage.getItem(DRAFT_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export async function clearDraft(): Promise<void> {
  await AsyncStorage.removeItem(DRAFT_KEY);
}

export function useSubmitChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { veiculoId: string; motoristaId: string; items: ChecklistItem[] }) => {
      const result = await api<{ id: string; score: number; status: string }>('/api/checklists', {
        method: 'POST',
        body: JSON.stringify({
          veiculoId: data.veiculoId,
          motoristaId: data.motoristaId,
          data: new Date().toISOString(),
          items: data.items,
        }),
      });
      await clearDraft();
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['veiculo'] });
    },
  });
}

export function calculateProgress(items: ChecklistItem[]): { total: number; conformes: number; percent: number } {
  const total = items.length;
  const conformes = items.filter((i) => i.conforme === true).length;
  return { total, conformes, percent: total > 0 ? Math.round((conformes / total) * 100) : 0 };
}
