'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch, apiUrl } from '@/lib/api';
import type { PortalLaudo, FlagResultado } from '@/lib/types';

function ResultadoCard({ analito, resultado, unidade, flag, explicacao }: {
  analito: string;
  resultado: string;
  unidade: string;
  flag: FlagResultado;
  explicacao: string;
}) {
  const styles = {
    normal: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', label: 'Dentro dos valores normais' },
    alto: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', label: 'Acima do normal' },
    baixo: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', label: 'Abaixo do normal' },
    critico: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', label: 'Valor que precisa de atencao' },
  };
  const s = styles[flag] ?? styles.normal;

  return (
    <div className={`rounded-lg border p-4 ${s.bg} ${s.border}`}>
      <div className="flex items-center justify-between">
        <h4 className={`text-sm font-semibold ${s.text}`}>{analito}</h4>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>
      </div>
      <p className={`text-lg font-bold mt-1 ${s.text}`}>{resultado} {unidade}</p>
      <p className="text-sm text-slate-600 mt-2">{explicacao}</p>
    </div>
  );
}

export default function PortalPacientePage() {
  const params = useParams();
  const token = params.token as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ['portal', token],
    queryFn: () => apiFetch<PortalLaudo>(`/portal/${token}`),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl border border-slate-200 p-8 max-w-md text-center">
          <h2 className="text-lg font-semibold text-slate-800">Link invalido ou expirado</h2>
          <p className="text-sm text-slate-500 mt-2">Este link pode ter expirado ou nao existe. Entre em contato com o laboratorio.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-violet-500 flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">L</div>
          <h1 className="text-xl font-bold text-slate-800">Seus Resultados</h1>
          <p className="text-sm text-slate-500 mt-1">{data.laboratorio.nome}</p>
        </div>

        {/* Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Paciente</p>
              <p className="font-medium text-slate-800">{data.paciente}</p>
            </div>
            <div>
              <p className="text-slate-500">Exame</p>
              <p className="font-medium text-slate-800">{data.tipoExame}</p>
            </div>
            <div>
              <p className="text-slate-500">Data da Coleta</p>
              <p className="font-medium text-slate-800">{new Date(data.dataColeta).toLocaleDateString('pt-BR')}</p>
            </div>
            <div>
              <p className="text-slate-500">Liberado em</p>
              <p className="font-medium text-slate-800">{new Date(data.dataLiberacao).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </div>

        {/* Resumo */}
        {data.resumo && (
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-6 mb-6">
            <h2 className="text-sm font-semibold text-violet-800 mb-2">Resumo</h2>
            <p className="text-sm text-violet-700">{data.resumo}</p>
          </div>
        )}

        {/* Resultados */}
        <div className="space-y-3 mb-6">
          <h2 className="text-sm font-semibold text-slate-800">Resultados</h2>
          {data.resultados.map((r) => (
            <ResultadoCard key={r.analito} {...r} />
          ))}
        </div>

        {/* Timeline simplificada */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">Rastreabilidade</h2>
          <div className="space-y-2 text-sm text-slate-600">
            <p>Coletado em {new Date(data.dataColeta).toLocaleDateString('pt-BR')}</p>
            <p>Analisado e revisado por {data.bioquimicoResponsavel}</p>
            <p>Liberado em {new Date(data.dataLiberacao).toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        {/* Download */}
        <div className="text-center">
          <a
            href={apiUrl(`/laudos/${data.id}/pdf`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-500 text-white text-sm font-medium rounded-lg hover:bg-violet-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download do Laudo Original (PDF)
          </a>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 mt-8">
          <p>{data.laboratorio.nome} — CNPJ: {data.laboratorio.cnpj}</p>
          <p>{data.laboratorio.endereco}</p>
        </div>
      </div>
    </div>
  );
}
