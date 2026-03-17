import { create } from 'zustand';

interface ClinicState {
  selectedClinicId: string | null;
  setSelectedClinic: (id: string | null) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const useClinicStore = create<ClinicState>((set) => ({
  selectedClinicId: null,
  setSelectedClinic: (id) => set({ selectedClinicId: id }),
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  darkMode: false,
  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
}));
