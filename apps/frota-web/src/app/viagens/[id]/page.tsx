'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, MapPin, Truck, Clock, AlertTriangle, Square, Coffee, Package, PackageCheck } from 'lucide-react';
import { useViagem, useFinalizarViagem, useRegistrarParada } from '@/hooks/use-viagens';
import type { StatusViagem } from '@/lib/types';

function StatusBadge({ status }: { status: StatusViagem }) {
  const styles: Record<StatusViagem, string> = {
    EM_ROTA: 'bg-sky-100 text-sky-700',
    FINALIZADA: 'bg-green-100 text-green-700',
    AGENDADA: 'bg-blue-100 text-blue-700',
    CANCELADA: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function ParadaIcon({ tipo }: { tipo: string }) {
  switch (tipo) {
    case 'DESCANSO': return <Coffee className="w-4 h-4 text-blue-500" />;
    case 'REFEICAO': return <Coffee className="w-4 h-4 text-amber-500" />;
    case 'CARGA': return <Package className="w-4 h-4 text-green-500" />;
    case 'DESCARGA': return <PackageCheck className="w-4 h-4 text-purple-500" />;
    default: return <Square className="w-4 h-4 text-slate-400" />;
  }
}

export default function ViagemDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: viagem, isLoading } = useViagem(id);
  const finalizarViagem = useFinalizarViagem();
  const registrarParada = useRegistrarParada();

  const [kmFim, setKmFim] = useState('');
  const [tipoParada, setTipoParada] = useState('DESCANSO');
  const [showFinalizarForm, setShowFinalizarForm] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-slate-500">Carregando dados da viagem...</div>
      </div>
    );
  }

  if (!viagem) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-slate-500">Viagem nao encontrada ou API indisponivel.</p>
        <Link href="/viagens" className="mt-4 text-sm text-sky-600 hover:text-sky-700 font-medium">
          Voltar para viagens
        </Link>
      </div>
    );
  }

  const kmPercorridos = viagem.kmFim ? viagem.kmFim - viagem.kmInicio : null;
  const alertaHoras = viagem.horasConducao >= 5.5;

  function handleFinalizar() {
    const km = Number(kmFim);
    if (km > 0) {
      finalizarViagem.mutate({ id, kmFim: km });
      setShowFinalizarForm(false);
    }
  }

  function handleRegistrarParada() {
    registrarParada.mutate({ id, tipo: tipoParada });
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/viagens" className="hover:text-sky-600 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Viagens
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">{viagem.origem} &rarr; {viagem.destino}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <Truck className="w-5 h-5 text-sky-500" />
              {viagem.motorista}
            </h2>
            <p className="text-sm text-slate-500 mt-1">Veiculo: {viagem.veiculo}</p>
            <div className="mt-2">
              <StatusBadge status={viagem.status} />
            </div>
          </div>
          <div className="text-right">
            {viagem.ciot && (
              <div className="text-sm text-slate-500">
                CIOT: <span className="font-mono font-medium text-slate-700">{viagem.ciot}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerta horas conducao */}
      {alertaHoras && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              Atencao: {viagem.horasConducao}h de conducao continua
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Lei 13.103/2015 exige parada de descanso de 30 min a cada 5h30 de conducao.
            </p>
          </div>
        </div>
      )}

      {/* Route info + Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            Informacoes da Rota
          </h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Origem</dt>
              <dd className="text-sm font-medium text-slate-700">{viagem.origem}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Destino</dt>
              <dd className="text-sm font-medium text-slate-700">{viagem.destino}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">KM Inicio</dt>
              <dd className="text-sm font-medium text-slate-700 font-mono">{viagem.kmInicio.toLocaleString('pt-BR')}</dd>
            </div>
            {viagem.kmFim && (
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">KM Fim</dt>
                <dd className="text-sm font-medium text-slate-700 font-mono">{viagem.kmFim.toLocaleString('pt-BR')}</dd>
              </div>
            )}
            {kmPercorridos !== null && (
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">KM Percorridos</dt>
                <dd className="text-sm font-bold text-slate-700 font-mono">{kmPercorridos.toLocaleString('pt-BR')}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Data Inicio</dt>
              <dd className="text-sm font-medium text-slate-700">
                {new Date(viagem.dataInicio).toLocaleString('pt-BR')}
              </dd>
            </div>
            {viagem.dataFim && (
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">Data Fim</dt>
                <dd className="text-sm font-medium text-slate-700">
                  {new Date(viagem.dataFim).toLocaleString('pt-BR')}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Horas de Conducao</dt>
              <dd className={`text-sm font-medium font-mono ${alertaHoras ? 'text-amber-600' : 'text-slate-700'}`}>
                {viagem.horasConducao}h
              </dd>
            </div>
            {viagem.custoEstimado !== undefined && (
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">Custo Estimado</dt>
                <dd className="text-sm font-medium text-slate-700 font-mono">
                  R$ {viagem.custoEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Paradas */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            Paradas ({viagem.paradas.length})
          </h3>

          {viagem.paradas.length > 0 ? (
            <div className="space-y-3">
              {viagem.paradas.map((parada) => (
                <div key={parada.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100">
                  <ParadaIcon tipo={parada.tipo} />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-700">{parada.tipo}</div>
                    <div className="text-xs text-slate-400">
                      {new Date(parada.timestamp).toLocaleString('pt-BR')}
                      {parada.duracao ? ` | ${parada.duracao} min` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Nenhuma parada registrada.</p>
          )}

          {/* Registrar Parada */}
          {viagem.status === 'EM_ROTA' && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <select
                  value={tipoParada}
                  onChange={(e) => setTipoParada(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                >
                  <option value="DESCANSO">Descanso</option>
                  <option value="REFEICAO">Refeicao</option>
                  <option value="CARGA">Carga</option>
                  <option value="DESCARGA">Descarga</option>
                </select>
                <button
                  type="button"
                  onClick={handleRegistrarParada}
                  disabled={registrarParada.isPending}
                  className="px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50"
                >
                  {registrarParada.isPending ? 'Registrando...' : 'Registrar Parada'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Finalizar Viagem */}
      {viagem.status === 'EM_ROTA' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          {!showFinalizarForm ? (
            <button
              type="button"
              onClick={() => setShowFinalizarForm(true)}
              className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
            >
              Finalizar Viagem
            </button>
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-800">Finalizar Viagem</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">KM Final</label>
                <input
                  type="number"
                  value={kmFim}
                  onChange={(e) => setKmFim(e.target.value)}
                  className="w-full max-w-xs px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                  placeholder="Quilometragem final"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleFinalizar}
                  disabled={finalizarViagem.isPending || !kmFim}
                  className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {finalizarViagem.isPending ? 'Finalizando...' : 'Confirmar'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowFinalizarForm(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
