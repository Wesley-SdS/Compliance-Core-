import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAppStore } from '../stores/app-store';

export interface ScoreData {
  score: number;
  level: string;
  trend: 'up' | 'down' | 'stable';
  trendDelta: number;
  lastUpdated: string;
  stats: {
    documentos: { total: number; pendentes: number; vencidos: number };
    alertas: { total: number; criticos: number; naoLidos: number };
    checklists: { total: number; pendentes: number; concluidos: number };
  };
  urgentAlerts: Array<{
    id: string;
    title: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    createdAt: string;
    message: string;
  }>;
}

export function useScore() {
  const clinicId = useAppStore((s) => s.selectedClinicId);

  return useQuery<ScoreData>({
    queryKey: ['score', clinicId],
    queryFn: () => api<ScoreData>(`/compliance/score${clinicId ? `?clinicId=${clinicId}` : ''}`),
    refetchInterval: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: true,
    placeholderData: {
      score: 0,
      level: 'Carregando...',
      trend: 'stable',
      trendDelta: 0,
      lastUpdated: new Date().toISOString(),
      stats: {
        documentos: { total: 0, pendentes: 0, vencidos: 0 },
        alertas: { total: 0, criticos: 0, naoLidos: 0 },
        checklists: { total: 0, pendentes: 0, concluidos: 0 },
      },
      urgentAlerts: [],
    },
  });
}

export function getScoreColor(score: number): string {
  if (score < 40) return '#DC2626';
  if (score < 60) return '#EA580C';
  if (score < 80) return '#CA8A04';
  return '#16A34A';
}

export function getScoreLabel(score: number): string {
  if (score < 40) return 'Crítico';
  if (score < 60) return 'Atenção';
  if (score < 80) return 'Bom';
  return 'Excelente';
}
