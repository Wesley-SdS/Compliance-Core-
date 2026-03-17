import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ClinicStore {
  selectedClinicId: string;
  sidebarOpen: boolean;
  setSelectedClinicId: (id: string) => void;
  toggleSidebar: () => void;
}

export const useClinicStore = create<ClinicStore>()(
  persist(
    (set) => ({
      selectedClinicId: '',
      sidebarOpen: true,
      setSelectedClinicId: (id) => set({ selectedClinicId: id }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    { name: 'clinic-store' },
  ),
);
