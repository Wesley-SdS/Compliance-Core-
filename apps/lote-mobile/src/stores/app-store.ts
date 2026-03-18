import { create } from 'zustand';

interface AppState {
  darkMode: boolean;
  pushEnabled: boolean;
  apiUrl: string;

  setDarkMode: (enabled: boolean) => void;
  setPushEnabled: (enabled: boolean) => void;
  setApiUrl: (url: string) => void;
  reset: () => void;
}

const initialState = {
  darkMode: false,
  pushEnabled: true,
  apiUrl: 'http://localhost:3006',
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,
  setDarkMode: (enabled) => set({ darkMode: enabled }),
  setPushEnabled: (enabled) => set({ pushEnabled: enabled }),
  setApiUrl: (url) => set({ apiUrl: url }),
  reset: () => set(initialState),
}));
