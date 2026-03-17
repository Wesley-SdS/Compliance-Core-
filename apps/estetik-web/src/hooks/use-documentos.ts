import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useDocumentos(category?: string, status?: string) {
  return useQuery({
    queryKey: ['documentos', category, status],
    queryFn: () => api('/documentos'),
  });
}

export function useUploadDocumento(clinicaId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      fileName: string;
      fileKey: string;
      fileSize: number;
      mimeType: string;
      category: string;
      expiresAt?: string;
    }) => api(`/clinicas/${clinicaId}/documents`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      queryClient.invalidateQueries({ queryKey: ['clinica-documents', clinicaId] });
    },
  });
}
