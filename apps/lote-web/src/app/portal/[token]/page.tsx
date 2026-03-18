'use client';

import { useParams } from 'next/navigation';
import { usePortal } from '@/hooks/use-api';
import { ParcelasTable } from '@/components/ParcelasTable';
import { InfraestruturaProgress } from '@/components/InfraestruturaProgress';
import { formatCurrency, formatArea, formatDate } from '@/lib/format';

export default function PortalCompradorPage() {
  const params = useParams();
  const token = params.token as string;
  const { data, isLoading, error } = usePortal(token);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-sm text-slate-500">Carregando portal do comprador...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Link inválido ou expirado</h1>
          <p className="text-sm text-slate-500">Solicite um novo link de acesso ao seu vendedor.</p>
        </div>
      </div>
    );
  }

  const { comprador, lote, loteamento, parcelas, infraestrutura, documentos } = data;
  const proximaParcela = parcelas?.find((p: any) => p.status === 'PENDENTE' || p.status === 'ATRASADO');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Public header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500 flex items-center justify-center font-bold text-white text-sm">L</div>
            <div>
              <div className="font-bold text-sm text-slate-800">LotePro</div>
              <div className="text-[10px] text-slate-400">Portal do Comprador</div>
            </div>
          </div>
          <div className="text-sm text-slate-600">Olá, {comprador?.nome}</div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Lote Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Seu Lote</h2>
          <p className="text-sm text-slate-500 mb-4">{loteamento?.nome}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-slate-500">Quadra</div>
              <div className="text-sm font-bold text-slate-700">{lote?.quadra}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Lote</div>
              <div className="text-sm font-bold text-slate-700">{lote?.numero}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Área</div>
              <div className="text-sm font-bold text-slate-700">{formatArea(lote?.area_m2 ?? 0)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Status</div>
              <div className="text-sm font-bold text-slate-700">{lote?.status}</div>
            </div>
          </div>
        </div>

        {/* Próxima Parcela */}
        {proximaParcela && (
          <div className={`rounded-xl border p-6 ${proximaParcela.status === 'ATRASADO' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-slate-600">Próxima Parcela — #{proximaParcela.numero}</div>
                <div className="text-2xl font-bold text-slate-800 font-mono mt-1">
                  {formatCurrency(proximaParcela.valor ?? proximaParcela.prestacao)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Vencimento: {formatDate(proximaParcela.vencimento ?? proximaParcela.data_vencimento)}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                  proximaParcela.status === 'ATRASADO' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {proximaParcela.status === 'ATRASADO' ? 'Atrasado' : 'Pendente'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Parcelas */}
        <div>
          <h3 className="text-base font-semibold text-slate-800 mb-4">Parcelas</h3>
          {parcelas && parcelas.length > 0 ? (
            <ParcelasTable
              parcelas={parcelas.map((p: any) => ({
                ...p,
                valor: p.valor ?? p.prestacao,
                vencimento: p.vencimento ?? p.data_vencimento,
              }))}
            />
          ) : (
            <p className="text-sm text-slate-500">Nenhuma parcela encontrada.</p>
          )}
        </div>

        {/* Infraestrutura */}
        <div>
          <h3 className="text-base font-semibold text-slate-800 mb-4">Progresso da Infraestrutura</h3>
          {infraestrutura && infraestrutura.length > 0 ? (
            <InfraestruturaProgress itens={infraestrutura} />
          ) : (
            <p className="text-sm text-slate-500">Dados de infraestrutura indisponíveis.</p>
          )}
        </div>

        {/* Documentos */}
        <div>
          <h3 className="text-base font-semibold text-slate-800 mb-4">Documentos Disponíveis</h3>
          {documentos && documentos.length > 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {documentos.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-slate-700">{doc.file_name}</div>
                    <div className="text-xs text-slate-500">{doc.category}</div>
                  </div>
                  <button type="button" className="text-xs text-rose-600 hover:text-rose-700 font-medium">
                    Download
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Nenhum documento disponível.</p>
          )}
        </div>
      </div>
    </div>
  );
}
