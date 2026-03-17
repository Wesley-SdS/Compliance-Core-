'use client';

import { useState, useMemo } from 'react';
import { useLegislacao, useAcknowledgeLegislacao } from '@/hooks/use-legislacao';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Scale,
  ExternalLink,
  CheckCircle2,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowRight,
  Bell,
  BookOpen,
  Loader2,
  Filter,
  Inbox,
} from 'lucide-react';

interface LegislacaoItem {
  id: string;
  sourceId: string;
  title: string;
  summary: string;
  url?: string;
  publishedAt: string;
  affectedVerticals: string[];
  source?: string;
  impactLevel?: 'ALTO' | 'MEDIO' | 'BAIXO';
  acknowledged?: boolean;
  impactDescription?: string;
  actionItems?: string[];
}

const SOURCE_CONFIG: Record<string, { label: string; color: string }> = {
  anvisa: { label: 'Anvisa', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  dou: { label: 'DOU', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  vigilancia: { label: 'Vigilancia Sanitaria', color: 'bg-teal-100 text-teal-800 border-teal-200' },
  default: { label: 'Outro', color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

const IMPACT_CONFIG: Record<string, { label: string; color: string }> = {
  ALTO: { label: 'Alto', color: 'bg-red-100 text-red-800 border-red-200' },
  MEDIO: { label: 'Medio', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  BAIXO: { label: 'Baixo', color: 'bg-green-100 text-green-800 border-green-200' },
};

function getSourceConfig(source?: string) {
  if (!source) return SOURCE_CONFIG.default;
  const key = source.toLowerCase();
  if (key.includes('anvisa')) return SOURCE_CONFIG.anvisa;
  if (key.includes('dou') || key.includes('diario')) return SOURCE_CONFIG.dou;
  if (key.includes('vigilancia') || key.includes('sanitaria')) return SOURCE_CONFIG.vigilancia;
  return SOURCE_CONFIG.default;
}

function LegislacaoSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface LegislacaoCardProps {
  item: LegislacaoItem;
  expanded: boolean;
  onToggle: () => void;
  onAcknowledge: (id: string) => void;
  acknowledging: boolean;
}

function LegislacaoCard({
  item,
  expanded,
  onToggle,
  onAcknowledge,
  acknowledging,
}: LegislacaoCardProps) {
  const sourceConfig = getSourceConfig(item.source ?? item.sourceId);
  const impactConfig = item.impactLevel ? IMPACT_CONFIG[item.impactLevel] : null;

  const mockActionItems = item.actionItems ?? [
    'Revisar protocolos internos',
    'Atualizar documentacao de compliance',
    'Capacitar equipe sobre as novas exigencias',
    'Verificar prazos de adequacao',
  ];

  const mockImpactDesc = item.impactDescription ??
    'Esta norma pode afetar os procedimentos de registro e documentacao da sua clinica. Recomenda-se revisar os processos internos para garantir conformidade dentro do prazo estabelecido.';

  return (
    <Card className={`transition-shadow hover:shadow-md ${!item.acknowledged ? 'border-l-4 border-l-blue-500' : ''}`}>
      <button
        type="button"
        className="w-full text-left"
        onClick={onToggle}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge className={`${sourceConfig.color} border`}>
                  {sourceConfig.label}
                </Badge>
                {impactConfig && (
                  <Badge className={`${impactConfig.color} border`}>
                    Impacto: {impactConfig.label}
                  </Badge>
                )}
                {!item.acknowledged && (
                  <Badge className="animate-pulse border border-blue-200 bg-blue-100 text-blue-800">
                    Novo
                  </Badge>
                )}
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                {item.summary}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Publicado em{' '}
                {new Date(item.publishedAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </CardContent>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4">
          <div className="space-y-4">
            {/* Full Summary */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Resumo Completo</h4>
              <p className="mt-1 text-sm text-gray-600">{item.summary}</p>
            </div>

            <Separator />

            {/* Impact */}
            <div>
              <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Impacto na sua clinica
              </h4>
              <p className="mt-1 text-sm text-gray-600">{mockImpactDesc}</p>
            </div>

            <Separator />

            {/* Action Items */}
            <div>
              <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Checklist de adequacao
              </h4>
              <ul className="mt-2 space-y-2">
                {mockActionItems.map((action, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <div className="h-4 w-4 flex-shrink-0 rounded border border-gray-300" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              {!item.acknowledged && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAcknowledge(item.id);
                  }}
                  disabled={acknowledging}
                  className="gap-1"
                >
                  {acknowledging ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                  Marcar como lido
                </Button>
              )}
              {item.url && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="gap-1"
                >
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3" />
                    Ver texto completo
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function LegislacaoPage() {
  const { data: legislacaoData, isLoading } = useLegislacao();
  const acknowledgeMutation = useAcknowledgeLegislacao();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [impactFilter, setImpactFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');

  const items: LegislacaoItem[] = (legislacaoData as LegislacaoItem[]) ?? [];

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (sourceFilter !== 'all') {
        const source = (item.source ?? item.sourceId ?? '').toLowerCase();
        if (sourceFilter === 'anvisa' && !source.includes('anvisa')) return false;
        if (sourceFilter === 'dou' && !source.includes('dou')) return false;
        if (sourceFilter === 'vigilancia' && !source.includes('vigilancia')) return false;
      }
      if (impactFilter !== 'all' && item.impactLevel !== impactFilter) return false;
      if (readFilter === 'unread' && item.acknowledged) return false;
      if (readFilter === 'read' && !item.acknowledged) return false;
      return true;
    });
  }, [items, sourceFilter, impactFilter, readFilter]);

  const newCount = items.filter((i) => !i.acknowledged).length;
  const actionRequiredCount = items.filter(
    (i) => !i.acknowledged && (i.impactLevel === 'ALTO' || i.impactLevel === 'MEDIO')
  ).length;

  function handleAcknowledge(id: string) {
    acknowledgeMutation.mutate(id);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
        <LegislacaoSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Feed de Legislacao</h1>
        <p className="mt-1 text-sm text-gray-500">
          Acompanhe atualizacoes regulatorias que impactam sua clinica.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-blue-100 p-3">
              <Bell className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{newCount}</p>
              <p className="text-sm text-gray-500">novas normas esta semana</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-amber-100 p-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{actionRequiredCount}</p>
              <p className="text-sm text-gray-500">requerem acao</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Filter className="h-4 w-4" />
          Filtros:
        </div>

        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Fonte" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as fontes</SelectItem>
            <SelectItem value="anvisa">Anvisa</SelectItem>
            <SelectItem value="dou">DOU</SelectItem>
            <SelectItem value="vigilancia">Vigilancia Sanitaria</SelectItem>
          </SelectContent>
        </Select>

        <Select value={impactFilter} onValueChange={setImpactFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Impacto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os niveis</SelectItem>
            <SelectItem value="ALTO">Alto</SelectItem>
            <SelectItem value="MEDIO">Medio</SelectItem>
            <SelectItem value="BAIXO">Baixo</SelectItem>
          </SelectContent>
        </Select>

        <Select value={readFilter} onValueChange={setReadFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="unread">Nao lidos</SelectItem>
            <SelectItem value="read">Lidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Feed */}
      {filteredItems.length > 0 ? (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <LegislacaoCard
              key={item.id}
              item={item}
              expanded={expandedId === item.id}
              onToggle={() =>
                setExpandedId(expandedId === item.id ? null : item.id)
              }
              onAcknowledge={handleAcknowledge}
              acknowledging={acknowledgeMutation.isPending}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Inbox className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-700">
              Nenhuma nova legislacao encontrada.
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Seu compliance esta em dia!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
