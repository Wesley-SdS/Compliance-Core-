'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Shield, Fuel, Wrench, MapPin, FileText, Users, Bell, BookOpen, Clock,
  Upload, Plus, X, CheckCircle2, XCircle, AlertTriangle, Minus, ChevronLeft,
  Eye, TrendingUp, TrendingDown,
} from 'lucide-react';

import {
  useVeiculo, useVeiculoScore, useVeiculoAbastecimentos, useVeiculoConsumo,
  useVeiculoManutencoes, useVeiculoViagens, useVeiculoDocumentos,
  useVeiculoAlertas, useVeiculoTimeline, useVeiculoDossie,
  useCreateManutencao, useCreateAbastecimento,
} from '@/hooks/use-veiculos';
import { useMotoristas } from '@/hooks/use-motoristas';
import { useUploadDocumento } from '@/hooks/use-frota';
import { useAcknowledgeAlerta } from '@/hooks/use-alertas';
import type { ComplianceLevel, StatusDocumento, StatusManutencao, StatusViagem, StatusOCR } from '@/lib/types';

/* ── helpers ─────────────────────────────────────────────────────── */

function levelColor(level: ComplianceLevel | string) {
  switch (level) {
    case 'EXCELENTE': return { text: 'text-green-600', bg: 'bg-green-50', bar: 'bg-green-500' };
    case 'BOM':       return { text: 'text-blue-600',  bg: 'bg-blue-50',  bar: 'bg-blue-500' };
    case 'ATENCAO':   return { text: 'text-amber-600', bg: 'bg-amber-50', bar: 'bg-amber-500' };
    default:          return { text: 'text-red-600',   bg: 'bg-red-50',   bar: 'bg-red-500' };
  }
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    CONFORME: 'bg-green-100 text-green-700',
    NAO_CONFORME: 'bg-red-100 text-red-700',
    PARCIAL: 'bg-amber-100 text-amber-700',
    NAO_APLICAVEL: 'bg-slate-100 text-slate-500',
    VALIDO: 'bg-green-100 text-green-700',
    VENCENDO: 'bg-amber-100 text-amber-700',
    VENCIDO: 'bg-red-100 text-red-700',
    REALIZADA: 'bg-green-100 text-green-700',
    AGENDADA: 'bg-blue-100 text-blue-700',
    ATRASADA: 'bg-red-100 text-red-700',
    EM_ROTA: 'bg-sky-100 text-sky-700',
    FINALIZADA: 'bg-green-100 text-green-700',
    CANCELADA: 'bg-slate-100 text-slate-500',
    PENDENTE: 'bg-slate-100 text-slate-500',
    PROCESSANDO: 'bg-blue-100 text-blue-700',
    CONCLUIDO: 'bg-green-100 text-green-700',
    ERRO: 'bg-red-100 text-red-700',
  };
  return map[status] ?? 'bg-slate-100 text-slate-700';
}

function Badge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor(status)}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function ComplianceBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
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

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
}

/* ── ScoreGauge ──────────────────────────────────────────────────── */

function ScoreGauge({ value, level, trend }: { value: number; level: string; trend?: string }) {
  const c = levelColor(level);
  const pct = Math.min(value, 100);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" strokeWidth="8" />
          <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor"
            className={c.text} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset} />
        </svg>
        <span className={`absolute text-3xl font-bold ${c.text}`}>{value}</span>
      </div>
      <ComplianceBadge level={level} />
      {trend && (
        <div className="flex items-center gap-1 text-xs text-slate-500">
          {trend === 'MELHORANDO' ? <TrendingUp className="w-3.5 h-3.5 text-green-500" /> :
           trend === 'PIORANDO' ? <TrendingDown className="w-3.5 h-3.5 text-red-500" /> :
           <Minus className="w-3.5 h-3.5 text-slate-400" />}
          <span>{trend.charAt(0) + trend.slice(1).toLowerCase()}</span>
        </div>
      )}
    </div>
  );
}

/* ── Tabs config ─────────────────────────────────────────────────── */

const tabs = [
  { key: 'compliance', label: 'Compliance', icon: Shield },
  { key: 'abastecimentos', label: 'Abastecimentos', icon: Fuel },
  { key: 'manutencoes', label: 'Manutencoes', icon: Wrench },
  { key: 'viagens', label: 'Viagens', icon: MapPin },
  { key: 'documentos', label: 'Documentos', icon: FileText },
  { key: 'motoristas', label: 'Motoristas', icon: Users },
  { key: 'alertas', label: 'Alertas', icon: Bell },
  { key: 'dossie', label: 'Dossie', icon: BookOpen },
  { key: 'atividade', label: 'Atividade', icon: Clock },
] as const;

type TabKey = (typeof tabs)[number]['key'];

/* ── Compliance Tab ──────────────────────────────────────────────── */

const criteriaConfig = [
  { id: 'cnh_mopp', name: 'CNH / MOPP', weight: 20 },
  { id: 'crlv', name: 'CRLV', weight: 20 },
  { id: 'seguro_rctr_c', name: 'Seguro RCTR-C', weight: 15 },
  { id: 'ciot', name: 'CIOT', weight: 15 },
  { id: 'manutencao', name: 'Manutencao', weight: 15 },
  { id: 'horas_descanso', name: 'Horas de Descanso', weight: 15 },
];

function ComplianceTab({ id }: { id: string }) {
  const { data: scoreData, isLoading } = useVeiculoScore(id);

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;

  const criteria = scoreData?.criteria ?? [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-800 mb-6">Breakdown de Compliance</h3>
      <div className="space-y-5">
        {criteriaConfig.map((cfg) => {
          const criterion = criteria.find((c) => c.criterionId === cfg.id);
          const score = criterion?.score ?? 0;
          const status = criterion?.status ?? 'NAO_APLICAVEL';
          const barColor = status === 'CONFORME' ? 'bg-green-500' : status === 'PARCIAL' ? 'bg-amber-500' : status === 'NAO_CONFORME' ? 'bg-red-500' : 'bg-slate-300';

          return (
            <div key={cfg.id}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">{cfg.name}</span>
                  <span className="text-xs text-slate-400">peso {cfg.weight}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700">{score}%</span>
                  <Badge status={status} />
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className={`${barColor} h-2.5 rounded-full transition-all`} style={{ width: `${score}%` }} />
              </div>
              {criterion?.details && (
                <p className="text-xs text-slate-500 mt-1">{criterion.details}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Abastecimentos Tab ──────────────────────────────────────────── */

function AbastecimentosTab({ id }: { id: string }) {
  const { data: abastecimentos, isLoading } = useVeiculoAbastecimentos(id);
  const { data: consumo, isLoading: consumoLoading } = useVeiculoConsumo(id);

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      {/* Consumo chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800">Consumo (km/l)</h3>
          {consumo && <span className="text-sm text-slate-500">Media: <strong>{consumo.media.toFixed(1)} km/l</strong></span>}
        </div>
        {consumoLoading || !consumo ? (
          <Skeleton className="w-full h-[200px]" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={consumo.historico}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="data" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip formatter={(v: number) => [`${v.toFixed(2)} km/l`, 'Consumo']} />
              <Line type="monotone" dataKey="kmPorLitro" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Data</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Litros</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">R$/L</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Total</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Posto</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">KM</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">OCR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {abastecimentos && abastecimentos.length > 0 ? abastecimentos.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-sm text-slate-700">{new Date(a.data).toLocaleDateString('pt-BR')}</td>
                <td className="px-6 py-4 text-sm text-slate-600 font-mono">{a.litros.toFixed(1)}</td>
                <td className="px-6 py-4 text-sm text-slate-600 font-mono">R$ {a.valorLitro.toFixed(3)}</td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-700 font-mono">R$ {a.total.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{a.posto}</td>
                <td className="px-6 py-4 text-sm text-slate-500 font-mono">{a.km.toLocaleString('pt-BR')}</td>
                <td className="px-6 py-4"><Badge status={a.statusOcr} /></td>
              </tr>
            )) : (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">Nenhum abastecimento registrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Manutencoes Tab ─────────────────────────────────────────────── */

const manutencaoSchema = z.object({
  veiculoId: z.string(),
  tipo: z.string().min(1, 'Obrigatorio'),
  data: z.string().min(1, 'Obrigatorio'),
  km: z.coerce.number().min(0),
  custo: z.coerce.number().min(0),
  fornecedor: z.string().optional(),
  descricao: z.string().optional(),
});

type ManutencaoForm = z.infer<typeof manutencaoSchema>;

function ManutencoesTab({ id }: { id: string }) {
  const { data: manutencoes, isLoading } = useVeiculoManutencoes(id);
  const createManutencao = useCreateManutencao();
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ManutencaoForm>({
    resolver: zodResolver(manutencaoSchema),
    defaultValues: { veiculoId: id, tipo: '', data: '', km: 0, custo: 0, fornecedor: '', descricao: '' },
  });

  const onSubmit = (data: ManutencaoForm) => {
    createManutencao.mutate(data, {
      onSuccess: () => { reset({ veiculoId: id }); setShowForm(false); },
    });
  };

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Historico de Manutencoes</h3>
        <button type="button" onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-sky-600 bg-sky-50 rounded-lg hover:bg-sky-100 transition-colors">
          <Plus className="w-4 h-4" />
          Nova Manutencao
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register('veiculoId')} />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                <input {...register('tipo')} placeholder="Troca de oleo"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent" />
                {errors.tipo && <p className="text-xs text-red-500 mt-1">{errors.tipo.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                <input type="date" {...register('data')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent" />
                {errors.data && <p className="text-xs text-red-500 mt-1">{errors.data.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">KM</label>
                <input type="number" {...register('km')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Custo (R$)</label>
                <input type="number" step="0.01" {...register('custo')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fornecedor</label>
                <input {...register('fornecedor')} placeholder="Opcional"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descricao</label>
                <input {...register('descricao')} placeholder="Opcional"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">
                Cancelar
              </button>
              <button type="submit" disabled={createManutencao.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-sky-500 rounded-lg hover:bg-sky-600 disabled:opacity-50">
                {createManutencao.isPending ? 'Salvando...' : 'Registrar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Tipo</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Data</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">KM</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Fornecedor</th>
              <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Custo</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {manutencoes && manutencoes.length > 0 ? manutencoes.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-sm font-medium text-slate-700">{m.tipo}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{new Date(m.data).toLocaleDateString('pt-BR')}</td>
                <td className="px-6 py-4 text-sm text-slate-500 font-mono">{m.km.toLocaleString('pt-BR')}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{m.fornecedor ?? '-'}</td>
                <td className="px-6 py-4 text-sm text-slate-700 text-right font-mono">R$ {m.custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td className="px-6 py-4"><Badge status={m.status} /></td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">Nenhuma manutencao registrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Viagens Tab ─────────────────────────────────────────────────── */

function ViagensTab({ id }: { id: string }) {
  const { data: viagens, isLoading } = useVeiculoViagens(id);

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Rota</th>
            <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">KM</th>
            <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Duracao</th>
            <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Custo</th>
            <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Horas</th>
            <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {viagens && viagens.length > 0 ? viagens.map((v) => {
            const kmTotal = v.kmFim && v.kmInicio ? v.kmFim - v.kmInicio : null;
            const duracao = v.dataFim && v.dataInicio
              ? Math.round((new Date(v.dataFim).getTime() - new Date(v.dataInicio).getTime()) / (1000 * 60 * 60))
              : null;

            return (
              <tr key={v.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-slate-700">{v.origem} → {v.destino}</div>
                  <div className="text-xs text-slate-400">{v.motorista} | {new Date(v.dataInicio).toLocaleDateString('pt-BR')}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 font-mono">{kmTotal ? kmTotal.toLocaleString('pt-BR') : '-'}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{duracao !== null ? `${duracao}h` : '-'}</td>
                <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                  {v.custoEstimado ? `R$ ${v.custoEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{v.horasConducao}h</td>
                <td className="px-6 py-4"><Badge status={v.status} /></td>
              </tr>
            );
          }) : (
            <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">Nenhuma viagem registrada.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ── Documentos Tab ──────────────────────────────────────────────── */

function DocumentosTab({ id }: { id: string }) {
  const { data: documentos, isLoading } = useVeiculoDocumentos(id);
  const uploadDoc = useUploadDocumento();
  const [uploading, setUploading] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    uploadDoc.mutate({ veiculoId: id, formData }, {
      onSettled: () => setUploading(false),
    });
    e.target.value = '';
  };

  if (isLoading) return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Documentos do Veiculo</h3>
        <label className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-sky-600 bg-sky-50 rounded-lg hover:bg-sky-100 transition-colors cursor-pointer">
          <Upload className="w-4 h-4" />
          {uploading ? 'Enviando...' : 'Upload'}
          <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.jpg,.jpeg,.png" />
        </label>
      </div>

      {documentos && documentos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documentos.map((doc) => {
            const statusStyle = doc.status === 'VALIDO' ? 'border-l-green-500' : doc.status === 'VENCENDO' ? 'border-l-amber-500' : 'border-l-red-500';
            return (
              <div key={doc.id} className={`bg-white rounded-xl border border-slate-200 border-l-4 ${statusStyle} p-5`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-medium">{doc.categoria.replace(/_/g, ' ')}</span>
                    <h4 className="text-sm font-semibold text-slate-800 mt-0.5">{doc.nome}</h4>
                  </div>
                  <Badge status={doc.status} />
                </div>
                <div className="text-xs text-slate-500">
                  Vencimento: <strong>{new Date(doc.vencimento).toLocaleDateString('pt-BR')}</strong>
                </div>
                {doc.arquivoUrl && (
                  <a href={doc.arquivoUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-sky-600 mt-2 hover:text-sky-700">
                    <Eye className="w-3.5 h-3.5" /> Ver documento
                  </a>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Nenhum documento cadastrado.</p>
        </div>
      )}
    </div>
  );
}

/* ── Motoristas Tab ──────────────────────────────────────────────── */

function MotoristasTab({ id }: { id: string }) {
  const { data: veiculo } = useVeiculo(id);
  const { data: allMotoristas, isLoading } = useMotoristas();

  // Filter motoristas linked to this vehicle
  const motoristas = allMotoristas?.filter(
    (m) => m.veiculosVinculados?.includes(id),
  );

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-800">Motoristas Vinculados</h3>
      {motoristas && motoristas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {motoristas.map((m) => {
            const cnhColor = m.statusCnh === 'VALIDO' ? 'text-green-600' : m.statusCnh === 'VENCENDO' ? 'text-amber-600' : 'text-red-600';
            const moppColor = m.statusMopp === 'VALIDO' ? 'text-green-600' : m.statusMopp === 'VENCENDO' ? 'text-amber-600' : 'text-red-600';

            return (
              <div key={m.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">{m.nome}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">CPF: {m.cpf}</p>
                  </div>
                  <ComplianceBadge level={m.level} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">CNH</span>
                    <span className="font-mono text-slate-700">{m.cnh} - Cat. {m.cnhCategoria}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">CNH Validade</span>
                    <span className={`font-medium ${cnhColor}`}>
                      {new Date(m.cnhValidade).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">CNH Status</span>
                    <Badge status={m.statusCnh} />
                  </div>
                  {m.moppValidade && (
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">MOPP Validade</span>
                        <span className={`font-medium ${moppColor}`}>
                          {new Date(m.moppValidade).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">MOPP Status</span>
                        <Badge status={m.statusMopp ?? 'NAO_APLICAVEL'} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Nenhum motorista vinculado a este veiculo.</p>
        </div>
      )}
    </div>
  );
}

/* ── Alertas Tab ─────────────────────────────────────────────────── */

function AlertasTab({ id }: { id: string }) {
  const { data: alertas, isLoading } = useVeiculoAlertas(id);
  const ack = useAcknowledgeAlerta();

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>;

  return (
    <div className="space-y-3">
      {alertas && alertas.length > 0 ? alertas.map((a) => {
        const sevColor = a.severity === 'CRITICO' ? 'border-l-red-500 bg-red-50' :
                         a.severity === 'ALTO' ? 'border-l-amber-500 bg-amber-50' :
                         a.severity === 'MEDIO' ? 'border-l-blue-500 bg-blue-50' :
                         'border-l-slate-400 bg-slate-50';
        return (
          <div key={a.id} className={`rounded-xl border border-slate-200 border-l-4 ${sevColor} p-5 flex items-start justify-between`}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase text-slate-500">{a.tipo}</span>
                <Badge status={a.severity} />
                {a.acknowledged && <span className="text-xs text-green-600 font-medium">Reconhecido</span>}
              </div>
              <p className="text-sm text-slate-700">{a.mensagem}</p>
              <p className="text-xs text-slate-400 mt-1">{new Date(a.createdAt).toLocaleString('pt-BR')}</p>
            </div>
            {!a.acknowledged && (
              <button type="button" onClick={() => ack.mutate(a.id)}
                disabled={ack.isPending}
                className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-sky-600 bg-white border border-sky-200 rounded-lg hover:bg-sky-50 transition-colors disabled:opacity-50">
                Reconhecer
              </button>
            )}
          </div>
        );
      }) : (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Nenhum alerta para este veiculo.</p>
        </div>
      )}
    </div>
  );
}

/* ── Dossie Tab ──────────────────────────────────────────────────── */

function DossieTab({ id }: { id: string }) {
  const { data: dossie, isLoading } = useVeiculoDossie(id);

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-800 mb-4">Dossie do Veiculo</h3>
      {dossie ? (
        <pre className="text-xs text-slate-600 bg-slate-50 rounded-lg p-4 overflow-auto max-h-[500px] whitespace-pre-wrap">
          {JSON.stringify(dossie, null, 2)}
        </pre>
      ) : (
        <p className="text-sm text-slate-500">Dossie nao disponivel.</p>
      )}
    </div>
  );
}

/* ── Atividade Tab ───────────────────────────────────────────────── */

function AtividadeTab({ id }: { id: string }) {
  const { data: timeline, isLoading } = useVeiculoTimeline(id);

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-800 mb-6">Linha do Tempo</h3>
      {timeline && timeline.length > 0 ? (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
          <div className="space-y-6">
            {timeline.map((event) => {
              const typeColor = event.type === 'ALERTA' ? 'bg-red-500' :
                               event.type === 'MANUTENCAO' ? 'bg-amber-500' :
                               event.type === 'DOCUMENTO' ? 'bg-blue-500' :
                               event.type === 'VIAGEM' ? 'bg-green-500' :
                               'bg-sky-500';
              return (
                <div key={event.id} className="relative flex items-start gap-4 pl-10">
                  <div className={`absolute left-2.5 w-3 h-3 rounded-full ${typeColor} border-2 border-white`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-700">{event.title}</p>
                      <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{event.type}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{event.description}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(event.timestamp).toLocaleString('pt-BR')}
                      {event.actor && <span> - {event.actor}</span>}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">Nenhum evento registrado.</p>
      )}
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────── */

export default function VeiculoDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<TabKey>('compliance');

  const { data: veiculo, isLoading: veiculoLoading } = useVeiculo(id);
  const { data: scoreData, isLoading: scoreLoading } = useVeiculoScore(id);

  if (veiculoLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-40" />
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-start justify-between">
          <div className="space-y-2"><Skeleton className="h-7 w-64" /><Skeleton className="h-4 w-48" /></div>
          <Skeleton className="h-36 w-36 rounded-full" />
        </div>
      </div>
    );
  }

  if (!veiculo) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-slate-500">Veiculo nao encontrado ou API indisponivel.</p>
        <Link href="/veiculos" className="mt-4 text-sm text-sky-600 hover:text-sky-700 font-medium">
          Voltar para veiculos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/veiculos" className="flex items-center gap-1 hover:text-sky-600">
          <ChevronLeft className="w-4 h-4" />
          Veiculos
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">{veiculo.placa}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">{veiculo.placa} - {veiculo.marca} {veiculo.modelo}</h2>
            <p className="text-sm text-slate-500 mt-1">
              {veiculo.tipo} | Ano: {veiculo.ano} | KM: {veiculo.km.toLocaleString('pt-BR')}
            </p>
            {scoreData?.criteria && (
              <div className="flex flex-wrap gap-2 mt-3">
                {scoreData.criteria.map((c) => (
                  <span key={c.criterionId} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${statusColor(c.status)}`}>
                    {c.status === 'CONFORME' ? <CheckCircle2 className="w-3 h-3" /> : c.status === 'NAO_CONFORME' ? <XCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    {c.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div>
            {scoreLoading || !scoreData ? (
              <Skeleton className="h-36 w-36 rounded-full" />
            ) : (
              <ScoreGauge value={scoreData.value} level={scoreData.level} trend={scoreData.trend} />
            )}
          </div>
        </div>
      </div>

      {/* Tabs nav */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <nav className="flex gap-1 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 pb-3 px-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}>
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'compliance' && <ComplianceTab id={id} />}
      {activeTab === 'abastecimentos' && <AbastecimentosTab id={id} />}
      {activeTab === 'manutencoes' && <ManutencoesTab id={id} />}
      {activeTab === 'viagens' && <ViagensTab id={id} />}
      {activeTab === 'documentos' && <DocumentosTab id={id} />}
      {activeTab === 'motoristas' && <MotoristasTab id={id} />}
      {activeTab === 'alertas' && <AlertasTab id={id} />}
      {activeTab === 'dossie' && <DossieTab id={id} />}
      {activeTab === 'atividade' && <AtividadeTab id={id} />}
    </div>
  );
}
