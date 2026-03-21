import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { ScoreGauge } from '@compliancecore/ui';
import type {
  ComplianceScore,
  ComplianceLevel,
  CriterionResult,
  Document,
  Checklist,
  ChecklistItem,
  TimelineData,
  TimelineEvent,
  DueAlert,
  PaginatedEvents,
} from '@compliancecore/shared';

interface Clinica {
  id: string;
  nome: string;
  cnpj: string;
  endereco: string;
  telefone?: string;
  email?: string;
  responsavelTecnico?: {
    nome: string;
    crm?: string;
    cro?: string;
    especialidade: string;
  };
  equipamentos?: Array<{
    nome: string;
    fabricante: string;
    registroAnvisa?: string;
  }>;
  profissionais?: Array<{
    nome: string;
    funcao: string;
    treinamentoValido: boolean;
  }>;
  lgpdTermVersion?: string;
  lgpdTermAccepted?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

const CRITERION_STATUS_COLORS: Record<string, string> = {
  CONFORME: 'bg-green-100 text-green-800',
  NAO_CONFORME: 'bg-red-100 text-red-800',
  PARCIAL: 'bg-amber-100 text-amber-800',
  NAO_APLICAVEL: 'bg-gray-100 text-gray-600',
};

const CRITERION_STATUS_LABELS: Record<string, string> = {
  CONFORME: 'Conforme',
  NAO_CONFORME: 'Nao Conforme',
  PARCIAL: 'Parcial',
  NAO_APLICAVEL: 'N/A',
};

async function getClinica(id: string): Promise<Clinica | null> {
  try {
    return await api<Clinica>(`/clinicas/${id}`);
  } catch {
    return null;
  }
}

async function getScore(id: string): Promise<ComplianceScore | null> {
  try {
    return await api<ComplianceScore>(`/clinicas/${id}/score`);
  } catch {
    return null;
  }
}

async function getDocuments(id: string): Promise<Document[]> {
  try {
    return await api<Document[]>(`/clinicas/${id}/documents`);
  } catch {
    return [];
  }
}

async function getChecklist(id: string): Promise<Checklist | null> {
  try {
    return await api<Checklist>(`/clinicas/${id}/checklist`);
  } catch {
    return null;
  }
}

async function getTimeline(id: string): Promise<TimelineData | null> {
  try {
    return await api<TimelineData>(`/clinicas/${id}/timeline`);
  } catch {
    return null;
  }
}

async function getAlerts(id: string): Promise<DueAlert[]> {
  try {
    return await api<DueAlert[]>(`/clinicas/${id}/alerts`);
  } catch {
    return [];
  }
}

function TabButton({
  tab,
  currentTab,
  label,
  clinicaId,
}: {
  tab: string;
  currentTab: string;
  label: string;
  clinicaId: string;
}) {
  const isActive = tab === currentTab;
  return (
    <Link
      href={`/clinicas/${clinicaId}?tab=${tab}`}
      className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
        isActive
          ? 'border-indigo-600 text-indigo-600'
          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
      }`}
    >
      {label}
    </Link>
  );
}

function OverviewTab({
  clinica,
  score,
  alerts,
}: {
  clinica: Clinica;
  score: ComplianceScore | null;
  alerts: DueAlert[];
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Score */}
      <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-medium text-gray-500">
          Score de Compliance
        </h3>
        {score ? (
          <ScoreGauge
            score={score.overall}
            level={score.level}
            size={160}
            showLabel
            trend={score.trend}
          />
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-500">Score nao calculado</p>
            <p className="mt-1 text-xs text-gray-400">
              Clique em recalcular para gerar o score
            </p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
        <h3 className="mb-4 text-sm font-medium text-gray-500">Informacoes</h3>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs text-gray-500">CNPJ</dt>
            <dd className="mt-1 text-sm font-medium text-gray-900">
              {clinica.cnpj}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Endereco</dt>
            <dd className="mt-1 text-sm font-medium text-gray-900">
              {clinica.endereco}
            </dd>
          </div>
          {clinica.telefone && (
            <div>
              <dt className="text-xs text-gray-500">Telefone</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">
                {clinica.telefone}
              </dd>
            </div>
          )}
          {clinica.email && (
            <div>
              <dt className="text-xs text-gray-500">Email</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">
                {clinica.email}
              </dd>
            </div>
          )}
          {clinica.responsavelTecnico && (
            <div className="col-span-2">
              <dt className="text-xs text-gray-500">Responsavel Tecnico</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">
                {clinica.responsavelTecnico.nome} (
                {clinica.responsavelTecnico.crm ||
                  clinica.responsavelTecnico.cro}
                ) - {clinica.responsavelTecnico.especialidade}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-gray-500">Equipamentos</dt>
            <dd className="mt-1 text-sm font-medium text-gray-900">
              {clinica.equipamentos?.length ?? 0} cadastrados
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Profissionais</dt>
            <dd className="mt-1 text-sm font-medium text-gray-900">
              {clinica.profissionais?.length ?? 0} cadastrados
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">LGPD</dt>
            <dd className="mt-1 text-sm font-medium text-gray-900">
              {clinica.lgpdTermAccepted ? 'Termos aceitos' : 'Pendente'}
            </dd>
          </div>
        </dl>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-3">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-sm font-medium text-gray-900">
              Alertas ({alerts.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center gap-4 px-6 py-3">
                <span
                  className={`h-2 w-2 rounded-full ${
                    alert.daysUntilDue <= 7
                      ? 'bg-red-500'
                      : alert.daysUntilDue <= 30
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{alert.alertType}</p>
                  <p className="text-xs text-gray-500">
                    Vence em {alert.daysUntilDue} dias
                  </p>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(alert.dueDate).toLocaleDateString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreTab({ score }: { score: ComplianceScore | null }) {
  if (!score) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
        <p className="text-sm text-gray-500">
          Score ainda nao foi calculado para esta clinica.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <ScoreGauge
          score={score.overall}
          level={score.level}
          size={180}
          showLabel
          trend={score.trend}
        />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            Score Geral: {score.overall}%
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Calculado em{' '}
            {new Date(score.calculatedAt).toLocaleString('pt-BR')}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-sm font-semibold text-gray-900">
            Detalhamento por Criterio
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {score.breakdown.map((criterion) => (
            <div
              key={criterion.criterionId}
              className="flex items-center gap-4 px-6 py-4"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {criterion.criterionId.replace(/_/g, ' ')}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {criterion.details}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24">
                  <div className="h-2 rounded-full bg-gray-200">
                    <div
                      className={`h-2 rounded-full ${
                        criterion.score >= 80
                          ? 'bg-green-500'
                          : criterion.score >= 50
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${criterion.score}%` }}
                    />
                  </div>
                </div>
                <span className="w-10 text-right text-sm font-medium text-gray-900">
                  {Math.round(criterion.score)}%
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    CRITERION_STATUS_COLORS[criterion.status]
                  }`}
                >
                  {CRITERION_STATUS_LABELS[criterion.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DocumentsTab({ documents }: { documents: Document[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">
          {documents.length} documentos
        </h3>
        <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          Upload
        </button>
      </div>

      {documents.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Documento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Expiracao
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Versao
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">
                      {doc.fileName}
                    </p>
                    <p className="text-xs text-gray-500">{doc.mimeType}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                      {doc.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">
                      {doc.expiresAt
                        ? new Date(doc.expiresAt).toLocaleDateString('pt-BR')
                        : 'Sem validade'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">v{doc.version}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white py-12 text-center shadow-sm">
          <p className="text-sm text-gray-500">Nenhum documento enviado</p>
        </div>
      )}
    </div>
  );
}

function ChecklistTab({ checklist }: { checklist: Checklist | null }) {
  if (!checklist) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
        <p className="text-sm text-gray-500">
          Nao foi possivel carregar o checklist.
        </p>
      </div>
    );
  }

  const categories = [
    ...new Set(checklist.items.map((item) => item.category)),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">
            Checklist de Compliance
          </h3>
          <p className="text-xs text-gray-500">
            Status: {checklist.status} | {checklist.items.length} itens
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            checklist.status === 'COMPLETED'
              ? 'bg-green-100 text-green-800'
              : checklist.status === 'IN_PROGRESS'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-gray-100 text-gray-700'
          }`}
        >
          {checklist.status}
        </span>
      </div>

      {categories.map((category) => (
        <div
          key={category}
          className="rounded-xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
            <h4 className="text-sm font-medium text-gray-700">{category}</h4>
          </div>
          <div className="divide-y divide-gray-100">
            {checklist.items
              .filter((item) => item.category === category)
              .map((item) => (
                <div key={item.id} className="flex items-start gap-3 px-6 py-4">
                  <input
                    type="checkbox"
                    disabled={checklist.status === 'COMPLETED'}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{item.question}</p>
                    {item.helpText && (
                      <p className="mt-1 text-xs text-gray-500">
                        {item.helpText}
                      </p>
                    )}
                    {item.regulationRef && (
                      <p className="mt-1 text-xs text-indigo-600">
                        Ref: {item.regulationRef}
                      </p>
                    )}
                  </div>
                  {item.required && (
                    <span className="text-xs text-red-500">Obrigatorio</span>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TimelineTab({ timeline }: { timeline: TimelineData | null }) {
  if (!timeline || timeline.events.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
        <p className="text-sm text-gray-500">Nenhum evento registrado</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="relative">
        <div className="absolute left-4 top-0 h-full w-0.5 bg-gray-200" />
        <div className="space-y-6">
          {timeline.events.map((event) => (
            <div key={event.id} className="relative flex gap-4 pl-10">
              <div className="absolute left-2.5 top-1 h-3 w-3 rounded-full border-2 border-indigo-600 bg-white" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {event.title}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {event.description}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {new Date(event.timestamp).toLocaleString('pt-BR')} | por{' '}
                  {event.actor}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DossierTab({ clinicaId }: { clinicaId: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
        <h3 className="mt-4 text-sm font-medium text-gray-900">
          Gerar Dossie de Auditoria
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          O dossie consolida todos os documentos, scores e historico de
          compliance da clinica em um unico PDF para fins de auditoria.
        </p>
        <form
          action={async () => {
            'use server';
            await api(`/clinicas/${clinicaId}/dossier`, { method: 'POST' });
          }}
        >
          <button
            type="submit"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Gerar Dossie
          </button>
        </form>
      </div>
    </div>
  );
}

export default async function ClinicaDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { tab = 'overview' } = await searchParams;

  const clinica = await getClinica(id);
  if (!clinica) {
    notFound();
  }

  const [score, documents, checklist, timeline, alerts] = await Promise.all([
    getScore(id),
    getDocuments(id),
    getChecklist(id),
    getTimeline(id),
    getAlerts(id),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/clinicas"
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {clinica.nome}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              CNPJ: {clinica.cnpj} | {clinica.endereco}
            </p>
          </div>
        </div>
        {score && (
          <div className="text-right">
            <ScoreGauge
              score={score.overall}
              level={score.level}
              size={64}
              showLabel={false}
            />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-0">
          <TabButton
            tab="overview"
            currentTab={tab}
            label="Visao Geral"
            clinicaId={id}
          />
          <TabButton
            tab="documents"
            currentTab={tab}
            label="Documentos"
            clinicaId={id}
          />
          <TabButton
            tab="score"
            currentTab={tab}
            label="Score"
            clinicaId={id}
          />
          <TabButton
            tab="checklist"
            currentTab={tab}
            label="Checklist"
            clinicaId={id}
          />
          <TabButton
            tab="timeline"
            currentTab={tab}
            label="Timeline"
            clinicaId={id}
          />
          <TabButton
            tab="dossier"
            currentTab={tab}
            label="Dossie"
            clinicaId={id}
          />
        </nav>
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <OverviewTab clinica={clinica} score={score} alerts={alerts} />
      )}
      {tab === 'documents' && <DocumentsTab documents={documents} />}
      {tab === 'score' && <ScoreTab score={score} />}
      {tab === 'checklist' && <ChecklistTab checklist={checklist} />}
      {tab === 'timeline' && <TimelineTab timeline={timeline} />}
      {tab === 'dossier' && <DossierTab clinicaId={id} />}
    </div>
  );
}
