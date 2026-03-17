export type Vertical = 'estetik' | 'obra' | 'tributo' | 'laudo' | 'frota' | 'lote';

export const VERTICALS: Record<Vertical, { name: string; description: string }> = {
  estetik: { name: 'EstetikComply', description: 'Clínicas de estética' },
  obra: { name: 'ObraMaster', description: 'Construtores' },
  tributo: { name: 'TributoSim', description: 'Escritórios contábeis' },
  laudo: { name: 'LaudoAI', description: 'Laboratórios' },
  frota: { name: 'FrotaLeve', description: 'Transportadores' },
  lote: { name: 'LotePro', description: 'Loteadores' },
};

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: Date;
  actor: string;
  metadata?: Record<string, unknown>;
}

export interface TimelineData {
  events: TimelineEvent[];
  entityId: string;
  period: { start: Date; end: Date };
}
