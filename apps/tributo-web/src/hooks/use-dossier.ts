'use client';

import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

interface DossierResult {
  empresa: any;
  documents: any[];
  score: any;
  alerts: any[];
  spedFiles: any[];
  docCategories: string[];
  generatedAt: string;
}

export function useGenerateDossier() {
  return useMutation({
    mutationFn: (empresaId: string) =>
      apiFetch<DossierResult>(`/empresas/${empresaId}/dossier`),
  });
}
