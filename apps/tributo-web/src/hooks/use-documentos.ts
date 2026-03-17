'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiUrl } from '@/lib/api';
import type { Documento } from '@/lib/types';

export function useDocumentos(empresaId: string) {
  return useQuery({
    queryKey: ['documentos', empresaId],
    queryFn: () => apiFetch<Documento[]>(`/empresas/${empresaId}/documents`),
    enabled: !!empresaId,
  });
}

export function useUploadDocumento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, empresaId, category }: { file: File; empresaId: string; category: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      const res = await fetch(apiUrl(`/empresas/${empresaId}/documents`), {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      return res.json() as Promise<Documento>;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['documentos', vars.empresaId] });
    },
  });
}
