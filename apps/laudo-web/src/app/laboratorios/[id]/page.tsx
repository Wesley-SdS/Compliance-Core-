'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ScoreGauge, AuditTimeline, ComplianceBadge } from '@compliancecore/ui';
import { useLaboratorio, useLabScore, useLabTimeline } from '@/hooks/use-laboratorio';
import { useLaudos } from '@/hooks/use-laudos';
import { useEquipamentos } from '@/hooks/use-equipamentos';
import type { ComplianceLevel, ScoreTrend } from '@compliancecore/shared';

const tabs = ['Visao Geral', 'Laudos', 'Equipamentos', 'Score', 'Timeline'] as const;
type Tab = (typeof tabs)[number];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    RASCUNHO: 'bg-slate-100 text-slate-700',
    EM_REVISAO: 'bg-amber-100 text-amber-700',
    REVISADO: 'bg-blue-100 text-blue-700',
    LIBERADO: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}

export default function LabDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<Tab>('Visao Geral');

  const { data: lab, isLoading: loadingLab } = useLaboratorio(id);
  const { data: score } = useLabScore(id);
  const { data: laudosData } = useLaudos({ laboratorioId: id });
  const { data: equipamentos } = useEquipamentos(id);
  const { data: timeline } = useLabTimeline(id);

  const laudos = laudosData?.data ?? [];

  if (loadingLab) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-slate-200 rounded-xl" />
        <div className="h-8 bg-slate-200 rounded w-full" />
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (!lab) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-slate-500">Laboratorio nao encontrado.</p>
        <Link href="/laboratorios" className="mt-4 text-sm text-violet-600 hover:text-violet-700 font-medium">
          Voltar para laboratorios
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/laboratorios" className="hover:text-violet-600">Laboratorios</Link>
        <span>/</span>
        <span className="text-slate-800 dark:text-slate-200 font-medium">{lab.nome}</span>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">{lab.nome}</h2>
            <p className="text-sm text-slate-500 mt-1">{lab.endereco}</p>
            <p className="text-sm text-slate-500">CNPJ: {lab.cnpj} | Tipo: {lab.tipo_laboratorio}</p>
          </div>
          {score && (
            <ScoreGauge
              score={score.value}
              level={score.level as ComplianceLevel}
              trend={(score.trend ?? 'ESTAVEL') as ScoreTrend}
              size={100}
            />
          )}
        </div>
      </div>

      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-violet-500 text-violet-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'Visao Geral' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">Informacoes</h3>
            <dl className="space-y-3">
              <div className="flex justify-between"><dt className="text-sm text-slate-500">Responsavel Tecnico</dt><dd className="text-sm font-medium text-slate-700 dark:text-slate-300">{lab.responsavel_tecnico}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-slate-500">Tipo</dt><dd className="text-sm font-medium text-slate-700 dark:text-slate-300">{lab.tipo_laboratorio}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-slate-500">Endereco</dt><dd className="text-sm font-medium text-slate-700 dark:text-slate-300">{lab.endereco}</dd></div>
            </dl>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">Resumo</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700">
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{laudos.length}</div>
                <div className="text-xs text-slate-500">Laudos</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700">
                <div className="text-2xl font-bold text-green-600">{laudos.filter((l) => l.status === 'LIBERADO').length}</div>
                <div className="text-xs text-slate-500">Liberados</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700">
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{(equipamentos ?? []).length}</div>
                <div className="text-xs text-slate-500">Equipamentos</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700">
                <div className="text-2xl font-bold text-amber-600">{(equipamentos ?? []).filter((e) => !e.calibracao_valida).length}</div>
                <div className="text-xs text-slate-500">Calibracoes pendentes</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Laudos' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Tipo de Exame</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Paciente</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Data</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {laudos.map((laudo) => (
                <tr key={laudo.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4">
                    <Link href={`/laudos/${laudo.id}`} className="text-sm font-medium text-violet-600 hover:text-violet-700">
                      {laudo.tipo_exame}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{laudo.paciente?.nome ?? '--'}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{laudo.data_coleta ? new Date(laudo.data_coleta).toLocaleDateString('pt-BR') : '--'}</td>
                  <td className="px-6 py-4"><StatusBadge status={laudo.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Equipamentos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(equipamentos ?? []).map((eq) => (
            <Link
              key={eq.id}
              href={`/equipamentos/${eq.id}`}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{eq.nome}</h3>
                  <p className="text-xs text-slate-500">{eq.fabricante} {eq.modelo}</p>
                </div>
                <ComplianceBadge status={eq.calibracao_valida ? 'CONFORME' : 'NAO_CONFORME'} size="sm" />
              </div>
              <p className="text-xs text-slate-400 mt-2">Proxima calibracao: {new Date(eq.proxima_calibracao).toLocaleDateString('pt-BR')}</p>
            </Link>
          ))}
        </div>
      )}

      {activeTab === 'Score' && score && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-8">
            <ScoreGauge
              score={score.value}
              level={score.level as ComplianceLevel}
              trend={(score.trend ?? 'ESTAVEL') as ScoreTrend}
              size={160}
            />
            <div className="flex-1 space-y-3">
              {(score.criteria ?? []).map((c) => (
                <div key={c.criterionId}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 dark:text-slate-400">{c.name}</span>
                    <span className="font-medium">{c.score}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${c.score >= 80 ? 'bg-green-500' : c.score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${c.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Timeline' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <AuditTimeline
            events={(timeline ?? []).map((e) => ({
              ...e,
              timestamp: new Date(e.timestamp),
            }))}
          />
        </div>
      )}
    </div>
  );
}
