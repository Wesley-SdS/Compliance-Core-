'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, User, Clock, MapPin, FileText, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import {
  useMotorista,
  useMotoristaHoras,
  useMotoristaViagens,
  useMotoristaDocumentos,
  useMotoristaAlertas,
} from '@/hooks/use-motoristas';
import { useAcknowledgeAlerta } from '@/hooks/use-alertas';
import type { ComplianceLevel, StatusDocumento } from '@/lib/types';

const tabs = ['Dados', 'Horas de Conducao', 'Viagens', 'Documentos', 'Alertas'] as const;
type Tab = (typeof tabs)[number];

function ComplianceBadge({ level }: { level: ComplianceLevel }) {
  const styles: Record<ComplianceLevel, string> = {
    EXCELENTE: 'bg-green-100 text-green-700',
    BOM: 'bg-blue-100 text-blue-700',
    ATENCAO: 'bg-amber-100 text-amber-700',
    CRITICO: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[level] ?? 'bg-slate-100 text-slate-700'}`}>
      {level}
    </span>
  );
}

function StatusBadge({ status }: { status: StatusDocumento | string }) {
  const styles: Record<string, string> = {
    VALIDO: 'bg-green-100 text-green-700',
    VENCENDO: 'bg-amber-100 text-amber-700',
    VENCIDO: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}

function ConformeBadge({ conforme }: { conforme: boolean }) {
  return conforme ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <CheckCircle className="w-3 h-3" /> Conforme
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
      <XCircle className="w-3 h-3" /> Nao conforme
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    CRITICO: 'bg-red-100 text-red-700',
    ALTO: 'bg-orange-100 text-orange-700',
    MEDIO: 'bg-amber-100 text-amber-700',
    BAIXO: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[severity] ?? 'bg-slate-100 text-slate-700'}`}>
      {severity}
    </span>
  );
}

export default function MotoristaDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<Tab>('Dados');

  const { data: motorista, isLoading } = useMotorista(id);
  const { data: horas } = useMotoristaHoras(id);
  const { data: viagens } = useMotoristaViagens(id);
  const { data: documentos } = useMotoristaDocumentos(id);
  const { data: alertas } = useMotoristaAlertas(id);
  const acknowledgeAlerta = useAcknowledgeAlerta();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-slate-500">Carregando dados do motorista...</div>
      </div>
    );
  }

  if (!motorista) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-slate-500">Motorista nao encontrado ou API indisponivel.</p>
        <Link href="/motoristas" className="mt-4 text-sm text-sky-600 hover:text-sky-700 font-medium">
          Voltar para motoristas
        </Link>
      </div>
    );
  }

  const horasNaoConformes = horas?.filter((h) => !h.conforme) ?? [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/motoristas" className="hover:text-sky-600 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Motoristas
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">{motorista.nome}</span>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center">
              <User className="w-6 h-6 text-sky-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-800">{motorista.nome}</h2>
              <p className="text-sm text-slate-500 mt-1">CPF: {motorista.cpf}</p>
              <div className="flex items-center gap-3 mt-2">
                <ComplianceBadge level={motorista.level} />
                <StatusBadge status={motorista.statusCnh} />
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{motorista.score}</div>
            <div className="text-xs font-medium text-blue-600">Score</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab: Dados */}
      {activeTab === 'Dados' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              Dados Pessoais
            </h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">Nome</dt>
                <dd className="text-sm font-medium text-slate-700">{motorista.nome}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">CPF</dt>
                <dd className="text-sm font-medium text-slate-700 font-mono">{motorista.cpf}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              CNH e MOPP
            </h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">CNH</dt>
                <dd className="text-sm font-medium text-slate-700 font-mono">{motorista.cnh}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">Categoria</dt>
                <dd className="text-sm font-medium text-slate-700">{motorista.cnhCategoria}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">Validade CNH</dt>
                <dd className="text-sm font-medium text-slate-700">
                  {new Date(motorista.cnhValidade).toLocaleDateString('pt-BR')}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">Status CNH</dt>
                <dd><StatusBadge status={motorista.statusCnh} /></dd>
              </div>
              {motorista.moppValidade && (
                <>
                  <div className="flex justify-between">
                    <dt className="text-sm text-slate-500">Validade MOPP</dt>
                    <dd className="text-sm font-medium text-slate-700">
                      {new Date(motorista.moppValidade).toLocaleDateString('pt-BR')}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-slate-500">Status MOPP</dt>
                    <dd>{motorista.statusMopp ? <StatusBadge status={motorista.statusMopp} /> : <span className="text-xs text-slate-400">N/A</span>}</dd>
                  </div>
                </>
              )}
            </dl>
          </div>
        </div>
      )}

      {/* Tab: Horas de Conducao */}
      {activeTab === 'Horas de Conducao' && (
        <div className="space-y-4">
          {horasNaoConformes.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Alerta: {horasNaoConformes.length} dia(s) com horas nao conformes (Lei 13.103/2015)
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Verificar limite de 10h diarias de conducao e descanso minimo de 11h.
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Data</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Horas Dirigidas</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Horas Descanso</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Horas Continuas</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(horas ?? []).length > 0 ? (
                  (horas ?? []).map((h, i) => (
                    <tr key={i} className={`hover:bg-slate-50 transition-colors ${!h.conforme ? 'bg-red-50/50' : ''}`}>
                      <td className="px-6 py-4 text-sm text-slate-700">{new Date(h.data).toLocaleDateString('pt-BR')}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-mono">{h.horasDirigidas}h</td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-mono">{h.horasDescanso}h</td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-mono">{h.horasContinuas}h</td>
                      <td className="px-6 py-4"><ConformeBadge conforme={h.conforme} /></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                      Nenhum registro de horas encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Viagens */}
      {activeTab === 'Viagens' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Rota</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Veiculo</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Data</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Horas Conducao</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(viagens ?? []).length > 0 ? (
                (viagens ?? []).map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/viagens/${v.id}`} className="text-sm font-medium text-slate-700 hover:text-sky-600">
                        {v.origem} &rarr; {v.destino}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-mono">{v.veiculo}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(v.dataInicio).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">{v.horasConducao}h</td>
                    <td className="px-6 py-4">
                      <ViagemStatusBadge status={v.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                    Nenhuma viagem encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Documentos */}
      {activeTab === 'Documentos' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {(documentos ?? []).length > 0 ? (
              (documentos ?? []).map((doc) => (
                <div key={doc.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-sm font-medium text-slate-700">{doc.nome}</div>
                      <div className="text-xs text-slate-400">{doc.categoria}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500">
                      Vencimento: {new Date(doc.vencimento).toLocaleDateString('pt-BR')}
                    </span>
                    <StatusBadge status={doc.status} />
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-sm text-slate-500">
                Nenhum documento encontrado.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Alertas */}
      {activeTab === 'Alertas' && (
        <div className="space-y-3">
          {(alertas ?? []).length > 0 ? (
            (alertas ?? []).map((alerta) => (
              <div
                key={alerta.id}
                className={`bg-white rounded-xl border p-4 flex items-start justify-between ${
                  alerta.acknowledged ? 'border-slate-200 opacity-60' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    alerta.severity === 'CRITICO' ? 'text-red-500' :
                    alerta.severity === 'ALTO' ? 'text-orange-500' :
                    alerta.severity === 'MEDIO' ? 'text-amber-500' : 'text-blue-500'
                  }`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">{alerta.tipo}</span>
                      <SeverityBadge severity={alerta.severity} />
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{alerta.mensagem}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(alerta.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                {!alerta.acknowledged && (
                  <button
                    type="button"
                    onClick={() => acknowledgeAlerta.mutate(alerta.id)}
                    className="px-3 py-1.5 text-xs font-medium text-sky-600 border border-sky-300 rounded-lg hover:bg-sky-50 transition-colors flex-shrink-0"
                  >
                    Reconhecer
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
              Nenhum alerta encontrado.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ViagemStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
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
