import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ObraStore {
  selectedObraId: string;
  sidebarOpen: boolean;
  setSelectedObraId: (id: string) => void;
  toggleSidebar: () => void;
}

export const useObraStore = create<ObraStore>()(
  persist(
    (set) => ({
      selectedObraId: '',
      sidebarOpen: true,
      setSelectedObraId: (id) => set({ selectedObraId: id }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    { name: 'obra-store' },
  ),
);
