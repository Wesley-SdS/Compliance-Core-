'use client';

import { useState } from 'react';
import { useClinicas, useClinicaChecklist } from '@/hooks/use-clinicas';
import { ChecklistForm } from '@compliancecore/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ClipboardCheck,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ListChecks,
  Loader2,
  Save,
  Send,
} from 'lucide-react';
import type { Checklist, ChecklistResponse } from '@compliancecore/shared';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  PENDING: {
    label: 'Pendente',
    variant: 'outline',
    icon: <Clock className="h-3 w-3" />,
  },
  IN_PROGRESS: {
    label: 'Em andamento',
    variant: 'secondary',
    icon: <ListChecks className="h-3 w-3" />,
  },
  COMPLETED: {
    label: 'Completo',
    variant: 'default',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
};

function ChecklistListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="mt-3 h-2 w-full rounded-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChecklistDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="mt-2 h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

interface ChecklistCardProps {
  checklist: Checklist;
  onClick: () => void;
}

function ChecklistCard({ checklist, onClick }: ChecklistCardProps) {
  const totalItems = checklist.items.length;
  const completionPercent = checklist.status === 'COMPLETED' ? 100 : checklist.status === 'IN_PROGRESS' ? 50 : 0;
  const config = STATUS_CONFIG[checklist.status] ?? STATUS_CONFIG.PENDING;

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Checklist de Compliance
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              {checklist.entityType} | {totalItems} itens
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              Criado em {new Date(checklist.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <Badge variant={config.variant} className="flex items-center gap-1">
            {config.icon}
            {config.label}
          </Badge>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Progresso</span>
            <span>{completionPercent}%</span>
          </div>
          <Progress value={completionPercent} className="mt-1 h-2" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ChecklistsPage() {
  const { data: clinicas, isLoading: loadingClinicas } = useClinicas({ limit: 50 });
  const [selectedClinicId, setSelectedClinicId] = useState<string>('');
  const [viewingChecklist, setViewingChecklist] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);
  const [tab, setTab] = useState('todos');

  const clinicaId = selectedClinicId || clinicas?.data?.[0]?.id;
  const { data: checklist, isLoading: loadingChecklist } = useClinicaChecklist(clinicaId);

  // Build a list of checklists (currently API returns one per clinic)
  const allChecklists: Checklist[] = checklist ? [checklist] : [];
  const pendingChecklists = allChecklists.filter((c) => c.status === 'PENDING' || c.status === 'IN_PROGRESS');
  const completedChecklists = allChecklists.filter((c) => c.status === 'COMPLETED');

  const displayChecklists = tab === 'pendentes'
    ? pendingChecklists
    : tab === 'completos'
      ? completedChecklists
      : allChecklists;

  function handleSubmit(responses: ChecklistResponse[]) {
    const total = responses.length;
    const conforme = responses.filter((r) => r.answer === 'SIM').length;
    const score = total > 0 ? Math.round((conforme / total) * 100) : 0;
    setSubmittedScore(score);
    setSubmitted(true);
  }

  function handleSave(_responses: ChecklistResponse[]) {
    // Save draft -- would call API
  }

  // Detail view
  if (viewingChecklist && checklist) {
    if (submitted) {
      return (
        <div className="space-y-6">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => {
              setViewingChecklist(false);
              setSubmitted(false);
              setSubmittedScore(null);
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>

          <Card className="mx-auto max-w-md">
            <CardContent className="flex flex-col items-center p-8">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <h2 className="mt-4 text-xl font-bold text-gray-900">
                Checklist Submetido!
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                O checklist foi submetido com sucesso.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-gray-500">Score parcial:</span>
                <span className="text-2xl font-bold text-indigo-600">{submittedScore}%</span>
              </div>
              <Button
                className="mt-6"
                onClick={() => {
                  setViewingChecklist(false);
                  setSubmitted(false);
                  setSubmittedScore(null);
                }}
              >
                Voltar para lista
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => setViewingChecklist(false)}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Checklist de Compliance
            </h1>
            <p className="text-sm text-gray-500">
              {checklist.entityType} | {checklist.items.length} itens
            </p>
          </div>
        </div>

        <ChecklistForm
          checklist={checklist}
          onSubmit={handleSubmit}
          onSave={handleSave}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Checklists</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie os checklists de compliance das suas clinicas.
          </p>
        </div>

        <Select
          value={clinicaId ?? ''}
          onValueChange={(val) => setSelectedClinicId(val)}
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

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="todos" className="gap-1">
            <ListChecks className="h-4 w-4" />
            Todos
          </TabsTrigger>
          <TabsTrigger value="pendentes" className="gap-1">
            <Clock className="h-4 w-4" />
            Pendentes
          </TabsTrigger>
          <TabsTrigger value="completos" className="gap-1">
            <CheckCircle2 className="h-4 w-4" />
            Completos
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          {loadingClinicas || loadingChecklist ? (
            <ChecklistListSkeleton />
          ) : displayChecklists.length > 0 ? (
            <div className="space-y-4">
              {displayChecklists.map((cl) => (
                <ChecklistCard
                  key={cl.id}
                  checklist={cl}
                  onClick={() => setViewingChecklist(true)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <ClipboardCheck className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-3 text-sm text-gray-500">
                  {tab === 'pendentes'
                    ? 'Nenhum checklist pendente'
                    : tab === 'completos'
                      ? 'Nenhum checklist completo'
                      : 'Nenhum checklist disponivel para esta clinica'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
