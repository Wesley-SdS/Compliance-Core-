'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiUrl } from '@/lib/api';
import type { SpedFile } from '@/lib/types';

export function useSpedFiles(empresaId: string) {
  return useQuery({
    queryKey: ['sped', empresaId],
    queryFn: () => apiFetch<SpedFile[]>(`/sped/empresa/${empresaId}`),
    enabled: !!empresaId,
  });
}

export function useSpedFile(id: string) {
  return useQuery({
    queryKey: ['sped-file', id],
    queryFn: () => apiFetch<SpedFile>(`/sped/${id}`),
    enabled: !!id,
  });
}

export function useUploadSped() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, empresaId, tipoSped, competencia }: { file: File; empresaId: string; tipoSped: string; competencia: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('empresaId', empresaId);
      formData.append('tipoSped', tipoSped);
      formData.append('competencia', competencia);

      const res = await fetch(apiUrl('/sped/upload'), {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      return res.json() as Promise<SpedFile>;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['sped', data.empresaId] });
    },
  });
}

export function useValidateSped() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<SpedFile>(`/sped/${id}/validate`, { method: 'POST' }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['sped', data.empresaId] });
      qc.invalidateQueries({ queryKey: ['sped-file', data.id] });
    },
  });
}

export function useDeleteSped() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/sped/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sped'] });
    },
  });
}
