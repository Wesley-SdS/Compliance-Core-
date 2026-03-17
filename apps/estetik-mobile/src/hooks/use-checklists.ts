import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../lib/api';
import { useAppStore } from '../stores/app-store';

export interface ChecklistItem {
  id: string;
  question: string;
  category: string;
  response: 'SIM' | 'NAO' | 'PARCIAL' | 'NA' | null;
  notes: string;
  photoUri: string | null;
}

export interface Checklist {
  id: string;
  title: string;
  description: string;
  status: 'pendente' | 'em_andamento' | 'concluido';
  items: ChecklistItem[];
  createdAt: string;
  dueDate: string | null;
  completedAt: string | null;
  progress: number;
}

const DRAFT_KEY = 'checklist_drafts';

async function saveDraftLocally(checklistId: string, items: ChecklistItem[]): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(DRAFT_KEY);
    const drafts: Record<string, ChecklistItem[]> = existing ? JSON.parse(existing) : {};
    drafts[checklistId] = items;
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
  } catch (error) {
    console.error('Erro ao salvar rascunho:', error);
  }
}

async function getDraftLocally(checklistId: string): Promise<ChecklistItem[] | null> {
  try {
    const existing = await AsyncStorage.getItem(DRAFT_KEY);
    if (!existing) return null;
    const drafts: Record<string, ChecklistItem[]> = JSON.parse(existing);
    return drafts[checklistId] || null;
  } catch {
    return null;
  }
}

async function removeDraftLocally(checklistId: string): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(DRAFT_KEY);
    if (!existing) return;
    const drafts: Record<string, ChecklistItem[]> = JSON.parse(existing);
    delete drafts[checklistId];
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
  } catch {
    // Silently ignore
  }
}

export function useChecklists() {
  const clinicId = useAppStore((s) => s.selectedClinicId);

  return useQuery<Checklist[]>({
    queryKey: ['checklists', clinicId],
    queryFn: () => api<Checklist[]>(`/checklists${clinicId ? `?clinicId=${clinicId}` : ''}`),
    refetchInterval: 1000 * 60 * 10,
  });
}

export function useChecklist(id: string) {
  return useQuery<Checklist>({
    queryKey: ['checklist', id],
    queryFn: async () => {
      const checklist = await api<Checklist>(`/checklists/${id}`);
      // Merge with local draft if available
      const draft = await getDraftLocally(id);
      if (draft) {
        checklist.items = draft;
        checklist.progress = calculateProgress(draft);
      }
      return checklist;
    },
  });
}

export function useSaveDraft() {
  return useMutation({
    mutationFn: async ({
      checklistId,
      items,
    }: {
      checklistId: string;
      items: ChecklistItem[];
    }) => {
      await saveDraftLocally(checklistId, items);
    },
  });
}

export function useSubmitChecklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      checklistId,
      items,
    }: {
      checklistId: string;
      items: ChecklistItem[];
    }) => {
      await api(`/checklists/${checklistId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ items }),
      });
      await removeDraftLocally(checklistId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      queryClient.invalidateQueries({ queryKey: ['score'] });
    },
  });
}

export function calculateProgress(items: ChecklistItem[]): number {
  if (items.length === 0) return 0;
  const answered = items.filter((item) => item.response !== null).length;
  return Math.round((answered / items.length) * 100);
}

export { saveDraftLocally, getDraftLocally };
