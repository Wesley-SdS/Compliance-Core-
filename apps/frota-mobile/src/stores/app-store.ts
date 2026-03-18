import { create } from 'zustand';

interface AppState {
  selectedVeiculoId: string | null;
  darkMode: boolean;
  pushEnabled: boolean;
  apiUrl: string;
  viagemAtiva: string | null;

  setSelectedVeiculoId: (id: string | null) => void;
  setDarkMode: (enabled: boolean) => void;
  setPushEnabled: (enabled: boolean) => void;
  setApiUrl: (url: string) => void;
  setViagemAtiva: (id: string | null) => void;
  reset: () => void;
}

const initialState = {
  selectedVeiculoId: null,
  darkMode: false,
  pushEnabled: true,
  apiUrl: 'http://localhost:3005',
  viagemAtiva: null,
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setSelectedVeiculoId: (id) => set({ selectedVeiculoId: id }),
  setDarkMode: (enabled) => set({ darkMode: enabled }),
  setPushEnabled: (enabled) => set({ pushEnabled: enabled }),
  setApiUrl: (url) => set({ apiUrl: url }),
  setViagemAtiva: (id) => set({ viagemAtiva: id }),
  reset: () => set(initialState),
}));
