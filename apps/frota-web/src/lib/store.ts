import { create } from 'zustand';

interface FrotaStore {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  filtroTipoVeiculo: string;
  setFiltroTipoVeiculo: (tipo: string) => void;
  filtroComplianceLevel: string;
  setFiltroComplianceLevel: (level: string) => void;
  buscaPlaca: string;
  setBuscaPlaca: (placa: string) => void;
  periodoSelecionado: 'semana' | 'mes' | 'trimestre';
  setPeriodoSelecionado: (periodo: 'semana' | 'mes' | 'trimestre') => void;
}

export const useFrotaStore = create<FrotaStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  filtroTipoVeiculo: 'Todos',
  setFiltroTipoVeiculo: (tipo) => set({ filtroTipoVeiculo: tipo }),
  filtroComplianceLevel: 'Todos',
  setFiltroComplianceLevel: (level) => set({ filtroComplianceLevel: level }),
  buscaPlaca: '',
  setBuscaPlaca: (placa) => set({ buscaPlaca: placa }),
  periodoSelecionado: 'mes',
  setPeriodoSelecionado: (periodo) => set({ periodoSelecionado: periodo }),
}));
