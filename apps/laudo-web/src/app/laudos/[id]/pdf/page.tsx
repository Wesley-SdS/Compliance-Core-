'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useLaudo } from '@/hooks/use-laudos';
import { apiUrl } from '@/lib/api';
import type { FlagResultado } from '@/lib/types';

function flagStyle(flag: FlagResultado) {
  if (flag === 'critico') return { color: '#DC2626', fontWeight: 700 as const };
  if (flag === 'alto' || flag === 'baixo') return { color: '#D97706', fontWeight: 600 as const };
  return { color: '#111827' };
}

export default function LaudoPDFPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: laudo, isLoading } = useLaudo(id);

  if (isLoading) {
    return <div className="animate-pulse h-[800px] bg-slate-200 rounded-xl" />;
  }

  if (!laudo) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Laudo nao encontrado.</p>
        <Link href="/laudos" className="text-violet-600 text-sm mt-2 inline-block">Voltar</Link>
      </div>
    );
  }

  const resultados = laudo.resultados ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href={`/laudos/${id}`} className="text-sm text-violet-600 hover:text-violet-700 font-medium">
          &larr; Voltar ao editor
        </Link>
        <a
          href={apiUrl(`/laudos/${id}/pdf`)}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-violet-500 text-white text-sm font-medium rounded-lg hover:bg-violet-600 transition-colors"
        >
          Download PDF
        </a>
      </div>

      {/* Preview HTML formatado estilo laudo */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm max-w-[800px] mx-auto">
        <div className="p-8" style={{ fontFamily: 'serif' }}>
          {/* Cabecalho */}
          <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
            <h1 className="text-xl font-bold text-slate-800">LABORATORIO DE ANALISES CLINICAS</h1>
            <p className="text-sm text-slate-600 mt-1">
              {laudo.laboratorio_id}
            </p>
            <p className="text-xs text-slate-500 mt-1">Laudo de Exame</p>
          </div>

          {/* Dados do paciente */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <p><strong>Paciente:</strong> {laudo.paciente?.nome ?? '--'}</p>
              <p><strong>CPF:</strong> {laudo.paciente?.cpf ?? '--'}</p>
              <p><strong>Data Nasc.:</strong> {laudo.paciente?.dataNascimento ? new Date(laudo.paciente.dataNascimento).toLocaleDateString('pt-BR') : '--'}</p>
            </div>
            <div>
              <p><strong>Sexo:</strong> {laudo.paciente?.sexo === 'M' ? 'Masculino' : laudo.paciente?.sexo === 'F' ? 'Feminino' : '--'}</p>
              <p><strong>Medico Solicitante:</strong> {laudo.paciente?.medicoSolicitante ?? '--'}</p>
              <p><strong>Data Coleta:</strong> {laudo.data_coleta ? new Date(laudo.data_coleta).toLocaleDateString('pt-BR') : '--'}</p>
            </div>
          </div>

          {/* Tipo de exame */}
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-300 pb-1 mb-3">
              {laudo.tipo_exame}
            </h2>
            <p className="text-xs text-slate-500">Material: {laudo.material_biologico} | Metodologia: {laudo.metodologia}</p>
          </div>

          {/* Tabela de resultados */}
          {resultados.length > 0 && (
            <table className="w-full text-sm mb-6 border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-400">
                  <th className="text-left py-2 font-bold">Analito</th>
                  <th className="text-center py-2 font-bold">Resultado</th>
                  <th className="text-center py-2 font-bold">Unidade</th>
                  <th className="text-center py-2 font-bold">Valor Referencia</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((r) => (
                  <tr key={r.analito} className="border-b border-slate-200">
                    <td className="py-2">{r.analito}</td>
                    <td className="py-2 text-center" style={flagStyle(r.flag)}>
                      {r.resultado} {(r.flag === 'alto' || r.flag === 'critico') && '\u2191'}{r.flag === 'baixo' && '\u2193'}
                    </td>
                    <td className="py-2 text-center text-slate-500">{r.unidade}</td>
                    <td className="py-2 text-center text-slate-500">{r.valorReferencia}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Resultado simples (fallback) */}
          {resultados.length === 0 && laudo.resultado && (
            <div className="mb-6">
              <p><strong>Resultado:</strong> {laudo.resultado}</p>
              {laudo.unidade && <p><strong>Unidade:</strong> {laudo.unidade}</p>}
              {laudo.valor_referencia && <p><strong>Valor de Referencia:</strong> {laudo.valor_referencia}</p>}
            </div>
          )}

          {/* Observacoes */}
          {laudo.observacoes && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-800 mb-1">Observacoes:</h3>
              <p className="text-sm text-slate-600">{laudo.observacoes}</p>
            </div>
          )}

          {/* Assinatura */}
          <div className="border-t-2 border-slate-800 pt-6 mt-8 text-center">
            {laudo.laudo_assinado ? (
              <>
                <div className="w-48 border-b border-slate-800 mx-auto mb-2" />
                <p className="text-sm font-bold">{laudo.assinado_por ?? laudo.bioquimico_responsavel}</p>
                <p className="text-xs text-slate-500">Bioquimico Responsavel</p>
                {laudo.data_liberacao && (
                  <p className="text-xs text-slate-400 mt-1">
                    Liberado em: {new Date(laudo.data_liberacao).toLocaleString('pt-BR')}
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-slate-400 italic">Laudo nao liberado</p>
            )}
          </div>

          {/* Rodape */}
          <div className="text-center text-xs text-slate-400 mt-6 pt-4 border-t border-slate-200">
            Laudo gerado pelo LaudoAI — Rastreabilidade: {laudo.id}
          </div>
        </div>
      </div>
    </div>
  );
}
