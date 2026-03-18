import { create } from 'zustand';

interface LaudoEditorState {
  isDirty: boolean;
  isSaving: boolean;
  isReviewing: boolean;
  setDirty: (dirty: boolean) => void;
  setSaving: (saving: boolean) => void;
  setReviewing: (reviewing: boolean) => void;
}

export const useLaudoEditorStore = create<LaudoEditorState>((set) => ({
  isDirty: false,
  isSaving: false,
  isReviewing: false,
  setDirty: (dirty) => set({ isDirty: dirty }),
  setSaving: (saving) => set({ isSaving: saving }),
  setReviewing: (reviewing) => set({ isReviewing: reviewing }),
}));

interface AppState {
  laboratorioId: string | null;
  setLaboratorioId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  laboratorioId: null,
  setLaboratorioId: (id) => set({ laboratorioId: id }),
}));
