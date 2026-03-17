import { create } from 'zustand';

interface AppState {
  selectedClinicId: string | null;
  darkMode: boolean;
  pushEnabled: boolean;
  apiUrl: string;

  setSelectedClinicId: (id: string | null) => void;
  setDarkMode: (enabled: boolean) => void;
  setPushEnabled: (enabled: boolean) => void;
  setApiUrl: (url: string) => void;
  reset: () => void;
}

const initialState = {
  selectedClinicId: null,
  darkMode: false,
  pushEnabled: true,
  apiUrl: 'http://localhost:3001',
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setSelectedClinicId: (id) => set({ selectedClinicId: id }),
  setDarkMode: (enabled) => set({ darkMode: enabled }),
  setPushEnabled: (enabled) => set({ pushEnabled: enabled }),
  setApiUrl: (url) => set({ apiUrl: url }),
  reset: () => set(initialState),
}));
