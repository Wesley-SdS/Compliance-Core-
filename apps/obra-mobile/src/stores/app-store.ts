import { create } from 'zustand';

interface AppState {
  selectedObraId: string | null;
  pushEnabled: boolean;
  apiUrl: string;
  setSelectedObraId: (id: string | null) => void;
  setPushEnabled: (enabled: boolean) => void;
  setApiUrl: (url: string) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedObraId: null,
  pushEnabled: true,
  apiUrl: 'http://localhost:3002',
  setSelectedObraId: (id) => set({ selectedObraId: id }),
  setPushEnabled: (enabled) => set({ pushEnabled: enabled }),
  setApiUrl: (url) => set({ apiUrl: url }),
  reset: () => set({ selectedObraId: null, pushEnabled: true, apiUrl: 'http://localhost:3002' }),
}));
