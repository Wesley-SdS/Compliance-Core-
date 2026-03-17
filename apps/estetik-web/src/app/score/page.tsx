'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useClinicas, useClinicaScore, useClinicaDocuments, useCalculateScore } from '@/hooks/use-clinicas';
import { ScoreGauge } from '@compliancecore/ui/ScoreGauge';
import { DossierPreview } from '@compliancecore/ui/DossierPreview';
import { ComplianceBadge } from '@compliancecore/ui/ComplianceBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Target,
  RefreshCcw,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Loader2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { CriterionResult, BadgeStatus } from '@compliancecore/shared';

const CRITERION_WEIGHTS: Record<string, number> = {
  ALVARA_SANITARIO: 20,
  RESPONSAVEL_TECNICO: 15,
  EQUIPAMENTOS_ANVISA: 15,
  PROFISSIONAIS_TREINADOS: 15,
  DOCUMENTACAO_OBRIGATORIA: 15,
  LGPD_COMPLIANCE: 10,
  CONTROLE_RESIDUOS: 10,
};

const CRITERION_LABELS: Record<string, string> = {
  ALVARA_SANITARIO: 'Alvara Sanitario',
  RESPONSAVEL_TECNICO: 'Responsavel Tecnico',
  EQUIPAMENTOS_ANVISA: 'Equipamentos Anvisa',
  PROFISSIONAIS_TREINADOS: 'Profissionais Treinados',
  DOCUMENTACAO_OBRIGATORIA: 'Documentacao Obrigatoria',
  LGPD_COMPLIANCE: 'LGPD Compliance',
  CONTROLE_RESIDUOS: 'Controle de Residuos',
};

function getBarColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

function getBarColorHex(score: number): string {
  if (score >= 80) return '#16A34A';
  if (score >= 50) return '#F59E0B';
  return '#DC2626';
}

function mapStatus(status: string): BadgeStatus {
  const map: Record<string, BadgeStatus> = {
    CONFORME: 'CONFORME',
    NAO_CONFORME: 'NAO_CONFORME',
    PARCIAL: 'PARCIAL',
    NAO_APLICAVEL: 'NAO_APLICAVEL',
  };
  return map[status] ?? 'NAO_APLICAVEL';
}

function CriterionCard({ criterion }: { criterion: CriterionResult }) {
  const [expanded, setExpanded] = useState(false);
  const weight = CRITERION_WEIGHTS[criterion.criterionId] ?? 10;
  const label = CRITERION_LABELS[criterion.criterionId] ?? criterion.criterionId.replace(/_/g, ' ');

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        className="w-full text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <Badge variant="outline" className="text-xs">
                  Peso: {weight}%
                </Badge>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-2.5 flex-1 rounded-full bg-gray-200">
                  <div
                    className={`h-2.5 rounded-full transition-all ${getBarColor(criterion.score)}`}
                    style={{ width: `${criterion.score}%` }}
                  />
                </div>
                <span className="w-12 text-right text-sm font-semibold text-gray-900">
                  {Math.round(criterion.score)}%
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ComplianceBadge status={mapStatus(criterion.status)} size="sm" />
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
        </CardContent>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4">
          <p className="text-sm text-gray-600">{criterion.details}</p>
          {criterion.evidence && criterion.evidence.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-500">Evidencias vinculadas:</p>
              <ul className="mt-1 space-y-1">
                {criterion.evidence.map((ev, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                    <FileText className="h-3 w-3 text-indigo-500" />
                    {ev}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function ScoreSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-48" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="flex items-center justify-center">
          <CardContent className="p-8">
            <Skeleton className="h-[180px] w-[180px] rounded-full" />
          </CardContent>
        </Card>
        <div className="space-y-4 lg:col-span-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-3 h-2.5 w-full rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ScorePage() {
  const { data: clinicas, isLoading: loadingClinicas } = useClinicas({ limit: 50 });
  const [selectedId, setSelectedId] = useState<string>('');
  const [dossierOpen, setDossierOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const clinicaId = selectedId || clinicas?.data?.[0]?.id;
  const clinicaNome = clinicas?.data?.find((c: any) => c.id === clinicaId)?.nome ?? '';

  const { data: score, isLoading: loadingScore } = useClinicaScore(clinicaId);
  const { data: documents } = useClinicaDocuments(clinicaId);
  const calculateScore = useCalculateScore(clinicaId ?? '');
  const { data: scoreHistory } = useQuery({
    queryKey: ['score-history', clinicaId],
    queryFn: () => api(`/clinicas/${clinicaId}/score/history?months=6`),
    enabled: !!clinicaId,
  });

  const scoreHistoryData = ((scoreHistory as any)?.scores || []).map((s: any) => ({
    month: new Date(s.calculatedAt).toLocaleDateString('pt-BR', { month: 'short' }),
    score: s.overall,
  }));

  if (loadingClinicas) {
    return <ScoreSkeleton />;
  }

  const breakdown = score?.breakdown ?? [];
  const recommendations = [...breakdown]
    .filter((c) => c.status === 'NAO_CONFORME' || c.status === 'PARCIAL')
    .sort((a, b) => {
      const wA = CRITERION_WEIGHTS[a.criterionId] ?? 10;
      const wB = CRITERION_WEIGHTS[b.criterionId] ?? 10;
      return wB - wA;
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Score Detalhado</h1>
          <p className="mt-1 text-sm text-gray-500">
            Analise detalhada do compliance por criterio.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={clinicaId ?? ''}
            onValueChange={(val) => setSelectedId(val)}
          >
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Selecione a clinica" />
            </SelectTrigger>
            <SelectContent>
              {clinicas?.data?.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loadingScore ? (
        <ScoreSkeleton />
      ) : (
        <>
          {/* Score Gauge + Breakdown */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Large gauge */}
            <Card className="flex flex-col items-center justify-center">
              <CardContent className="flex flex-col items-center gap-4 p-8">
                {score ? (
                  <>
                    <ScoreGauge
                      score={score.overall}
                      level={score.level}
                      size={180}
                      showLabel
                      trend={score.trend}
                    />
                    <p className="text-sm text-gray-500">
                      Calculado em{' '}
                      {new Date(score.calculatedAt).toLocaleDateString('pt-BR')}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => calculateScore.mutate()}
                        disabled={calculateScore.isPending}
                        className="gap-1"
                      >
                        {calculateScore.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCcw className="h-4 w-4" />
                        )}
                        Recalcular Score
                      </Button>

                      <Dialog open={dossierOpen} onOpenChange={setDossierOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-1">
                            <FileText className="h-4 w-4" />
                            Gerar Dossie
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Dossie de Auditoria</DialogTitle>
                          </DialogHeader>
                          <DossierPreview
                            entityName={clinicaNome}
                            period={{ start: '01/01/2026', end: '16/03/2026' }}
                            score={score.overall}
                            level={score.level}
                            documentCount={documents?.length ?? 0}
                            eventCount={0}
                            checklistCount={1}
                            onGenerate={() => {
                              setGenerating(true);
                              setTimeout(() => setGenerating(false), 3000);
                            }}
                            generating={generating}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center">
                    <Target className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-3 text-sm text-gray-500">Score nao calculado</p>
                    <Button
                      variant="default"
                      size="sm"
                      className="mt-3 gap-1"
                      onClick={() => calculateScore.mutate()}
                      disabled={calculateScore.isPending || !clinicaId}
                    >
                      {calculateScore.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCcw className="h-4 w-4" />
                      )}
                      Calcular Score
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Criterion Breakdown */}
            <div className="space-y-3 lg:col-span-2">
              <h3 className="text-sm font-semibold text-gray-700">
                Detalhamento por Criterio
              </h3>
              {breakdown.length > 0 ? (
                breakdown.map((criterion) => (
                  <CriterionCard key={criterion.criterionId} criterion={criterion} />
                ))
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-sm text-gray-500">
                      Nenhum criterio disponivel. Calcule o score primeiro.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  Para melhorar seu score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recommendations.map((rec) => {
                    const label = CRITERION_LABELS[rec.criterionId] ?? rec.criterionId.replace(/_/g, ' ');
                    const weight = CRITERION_WEIGHTS[rec.criterionId] ?? 10;
                    return (
                      <div
                        key={rec.criterionId}
                        className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3"
                      >
                        <div className="flex items-center gap-3">
                          {rec.status === 'NAO_CONFORME' ? (
                            <XCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{label}</p>
                            <p className="text-xs text-gray-500">
                              Peso: {weight}% | {rec.details}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Resolver
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Score History Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900">
                Evolucao do Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scoreHistoryData.length === 0 ? (
                <div className="flex h-[280px] items-center justify-center">
                  <p className="text-sm text-gray-400">Nenhum historico de score disponivel.</p>
                </div>
              ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={scoreHistoryData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid #E5E7EB',
                    }}
                    formatter={(value: number) => [`${value}%`, 'Score']}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#4F46E5"
                    strokeWidth={2}
                    fill="url(#scoreGradient)"
                    dot={{ fill: '#4F46E5', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
