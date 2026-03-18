'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

// ======================== TYPES ========================

export interface Loteamento {
  id: string;
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  area_total: number;
  total_lotes: number;
  matricula_numero?: string;
  registro_cartorio: boolean;
  aprovacao_prefeitura: boolean;
  responsavel: string;
  cnpj_loteador: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Lote {
  id: string;
  loteamento_id: string;
  quadra: string;
  numero: string;
  area_m2: number;
  valor_venda: number;
  frente?: number;
  fundo?: number;
  lado_direito?: number;
  lado_esquerdo?: number;
  status: 'DISPONIVEL' | 'RESERVADO' | 'VENDIDO' | 'QUITADO';
  comprador_id?: string;
  contrato_registrado: boolean;
  created_at: string;
}

export interface Contrato {
  id: string;
  loteamento_id: string;
  lote_id: string;
  comprador_id: string;
  valor_total: number;
  valor_entrada: number;
  numero_parcelas: number;
  taxa_juros_mensal: number;
  sistema: 'PRICE' | 'SAC';
  status: 'ATIVO' | 'QUITADO' | 'DISTRATADO' | 'INADIMPLENTE';
  created_at: string;
  comprador_nome?: string;
  lote_quadra?: string;
  lote_numero?: string;
}

export interface Parcela {
  id: string;
  contrato_id: string;
  numero: number;
  valor: number;
  amortizacao: number;
  juros: number;
  saldo_devedor: number;
  vencimento: string;
  status: 'PENDENTE' | 'PAGO' | 'ATRASADO';
  data_pagamento?: string;
  valor_pago?: number;
}

export interface Comprador {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  loteamento_id: string;
  lgpd_consentimento: boolean;
  created_at: string;
}

export interface InfraestruturaItem {
  id: string;
  loteamento_id: string;
  item: string;
  percentual: number;
  responsavel?: string;
  prazo?: string;
  observacoes?: string;
  updated_at: string;
}

export interface Aprovacao {
  id: string;
  loteamento_id: string;
  tipo: 'PREFEITURA' | 'CARTORIO' | 'GRAPROHAB' | 'AMBIENTAL';
  status: 'PENDENTE' | 'EM_ANALISE' | 'APROVADO' | 'NEGADO';
  protocolo?: string;
  data_aprovacao?: string;
  observacoes?: string;
  created_at: string;
}

export interface FinanceiroDashboard {
  vgv: number;
  recebido: number;
  a_receber: number;
  inadimplencia_rs: number;
  inadimplencia_pct: number;
  contratos_ativos: number;
  contratos_quitados: number;
}

export interface CobrancaRegua {
  etapas: Array<{
    dias: number;
    canal: string;
    template: string;
  }>;
}

export interface CobrancaDashboard {
  vencidos_total: number;
  inadimplencia_pct: number;
  acoes_pendentes: number;
  por_periodo: Array<{ periodo: string; quantidade: number; valor: number }>;
}

export interface ScoreData {
  score: number;
  level: 'EXCELENTE' | 'BOM' | 'ATENCAO' | 'CRITICO';
  trend: 'MELHORANDO' | 'PIORANDO' | 'ESTAVEL';
  criteria: Array<{
    criterionId: string;
    name?: string;
    status: string;
    score: number;
    details: string;
    weight?: number;
  }>;
}

export interface ScoreHistory {
  history: Array<{ date: string; score: number; level: string }>;
}

export interface TimelineEvent {
  id: string;
  type: string;
  data: Record<string, any>;
  timestamp: string;
  actor_id?: string;
}

export interface DossierData {
  loteamento: Loteamento;
  documents: any[];
  score: ScoreData | null;
  alerts: any[];
  lotes: Lote[];
  compradores: Comprador[];
  generatedAt: string;
}

export interface PortalData {
  comprador: Comprador;
  lote: Lote;
  loteamento: { nome: string };
  parcelas: Parcela[];
  infraestrutura: InfraestruturaItem[];
  documentos: any[];
}

export interface GlobalStats {
  loteamentos_ativos: number;
  lotes_total: number;
  lotes_vendidos: number;
  lotes_disponiveis: number;
  contratos_ativos: number;
  inadimplencia_pct: number;
}

export interface LegislacaoItem {
  id: string;
  lei: string;
  titulo: string;
  resumo: string;
  impacto: string;
  data: string;
  url?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ======================== HOOKS ========================

// ----- Loteamentos -----
export function useLoteamentos(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['loteamentos', page, limit],
    queryFn: () => apiFetch<PaginatedResponse<Loteamento>>(`/loteamentos?page=${page}&limit=${limit}`),
  });
}

export function useLoteamento(id: string) {
  return useQuery({
    queryKey: ['loteamento', id],
    queryFn: () => apiFetch<Loteamento>(`/loteamentos/${id}`),
    enabled: !!id,
  });
}

export function useCreateLoteamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => apiFetch('/loteamentos', { method: 'POST', body: JSON.stringify(dto) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loteamentos'] }),
  });
}

export function useUpdateLoteamento(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => apiFetch(`/loteamentos/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loteamento', id] });
      qc.invalidateQueries({ queryKey: ['loteamentos'] });
    },
  });
}

// ----- Score -----
export function useLoteamentoScore(id: string) {
  return useQuery({
    queryKey: ['loteamento-score', id],
    queryFn: () => apiFetch<ScoreData>(`/loteamentos/${id}/score`),
    enabled: !!id,
  });
}

export function useScoreHistory(id: string) {
  return useQuery({
    queryKey: ['score-history', id],
    queryFn: () => apiFetch<ScoreHistory>(`/loteamentos/${id}/score/history`),
    enabled: !!id,
  });
}

// ----- Lotes -----
export function useLotes(loteamentoId: string) {
  return useQuery({
    queryKey: ['lotes', loteamentoId],
    queryFn: () => apiFetch<Lote[]>(`/lotes/loteamento/${loteamentoId}`),
    enabled: !!loteamentoId,
  });
}

export function useLotesResumo(loteamentoId: string) {
  return useQuery({
    queryKey: ['lotes-resumo', loteamentoId],
    queryFn: () => apiFetch<{ total: number; disponivel: number; reservado: number; vendido: number }>(`/lotes/loteamento/${loteamentoId}/resumo`),
    enabled: !!loteamentoId,
  });
}

export function useCreateLotes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => apiFetch('/lotes', { method: 'POST', body: JSON.stringify(dto) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lotes'] }),
  });
}

// ----- Contratos -----
export function useContratos(loteamentoId: string) {
  return useQuery({
    queryKey: ['contratos', loteamentoId],
    queryFn: () => apiFetch<Contrato[]>(`/loteamentos/${loteamentoId}/contratos`),
    enabled: !!loteamentoId,
  });
}

export function useContrato(id: string) {
  return useQuery({
    queryKey: ['contrato', id],
    queryFn: () => apiFetch<Contrato & { parcelas: Parcela[] }>(`/contratos/${id}`),
    enabled: !!id,
  });
}

export function useCreateContrato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => apiFetch('/contratos', { method: 'POST', body: JSON.stringify(dto) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contratos'] });
      qc.invalidateQueries({ queryKey: ['lotes'] });
    },
  });
}

export function useRegistrarPagamento(contratoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => apiFetch(`/contratos/${contratoId}/pagamento`, { method: 'POST', body: JSON.stringify(dto) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contrato', contratoId] });
      qc.invalidateQueries({ queryKey: ['contratos'] });
    },
  });
}

export function useDistrato(contratoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch(`/contratos/${contratoId}/distrato`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contrato', contratoId] });
      qc.invalidateQueries({ queryKey: ['contratos'] });
      qc.invalidateQueries({ queryKey: ['lotes'] });
    },
  });
}

export function useParcelas(contratoId: string) {
  return useQuery({
    queryKey: ['parcelas', contratoId],
    queryFn: () => apiFetch<Parcela[]>(`/contratos/${contratoId}/parcelas`),
    enabled: !!contratoId,
  });
}

// ----- Compradores -----
export function useCompradores(loteamentoId: string) {
  return useQuery({
    queryKey: ['compradores', loteamentoId],
    queryFn: () => apiFetch<Comprador[]>(`/loteamentos/${loteamentoId}/compradores`),
    enabled: !!loteamentoId,
  });
}

export function useCreateComprador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => apiFetch('/compradores', { method: 'POST', body: JSON.stringify(dto) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compradores'] }),
  });
}

// ----- Infraestrutura -----
export function useInfraestrutura(loteamentoId: string) {
  return useQuery({
    queryKey: ['infraestrutura', loteamentoId],
    queryFn: () => apiFetch<InfraestruturaItem[]>(`/loteamentos/${loteamentoId}/infraestrutura`),
    enabled: !!loteamentoId,
  });
}

export function useUpdateInfraestrutura() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: any) => apiFetch(`/infraestrutura/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['infraestrutura'] }),
  });
}

// ----- Aprovações -----
export function useAprovacoes(loteamentoId: string) {
  return useQuery({
    queryKey: ['aprovacoes', loteamentoId],
    queryFn: () => apiFetch<Aprovacao[]>(`/loteamentos/${loteamentoId}/aprovacoes`),
    enabled: !!loteamentoId,
  });
}

export function useCreateAprovacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => apiFetch('/aprovacoes', { method: 'POST', body: JSON.stringify(dto) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['aprovacoes'] }),
  });
}

export function useUpdateAprovacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: any) => apiFetch(`/aprovacoes/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['aprovacoes'] }),
  });
}

// ----- Financeiro -----
export function useFinanceiro(loteamentoId: string) {
  return useQuery({
    queryKey: ['financeiro', loteamentoId],
    queryFn: () => apiFetch<FinanceiroDashboard>(`/loteamentos/${loteamentoId}/financeiro`),
    enabled: !!loteamentoId,
  });
}

// ----- Cobrança -----
export function useCobrancaRegua() {
  return useQuery({
    queryKey: ['cobranca-regua'],
    queryFn: () => apiFetch<CobrancaRegua>('/cobranca/regua'),
  });
}

export function useUpdateCobrancaRegua() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => apiFetch('/cobranca/regua', { method: 'PATCH', body: JSON.stringify(dto) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cobranca-regua'] }),
  });
}

export function useCobrancaDashboard() {
  return useQuery({
    queryKey: ['cobranca-dashboard'],
    queryFn: () => apiFetch<CobrancaDashboard>('/cobranca/dashboard'),
  });
}

export function useExecutarCobranca() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => apiFetch('/cobranca/executar', { method: 'POST', body: JSON.stringify(dto) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cobranca-dashboard'] }),
  });
}

// ----- Documentos -----
export function useDocumentos(loteamentoId: string) {
  return useQuery({
    queryKey: ['documentos', loteamentoId],
    queryFn: () => apiFetch<any[]>(`/loteamentos/${loteamentoId}/documents`),
    enabled: !!loteamentoId,
  });
}

export function useUploadDocumento(loteamentoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => apiFetch(`/loteamentos/${loteamentoId}/documents`, { method: 'POST', body: JSON.stringify(dto) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documentos', loteamentoId] }),
  });
}

// ----- Alertas -----
export function useAlertas(loteamentoId: string) {
  return useQuery({
    queryKey: ['alertas', loteamentoId],
    queryFn: () => apiFetch<any[]>(`/loteamentos/${loteamentoId}/alerts`),
    enabled: !!loteamentoId,
  });
}

export function useAcknowledgeAlerta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) => apiFetch(`/loteamentos/alertas/${alertId}/acknowledge`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alertas'] }),
  });
}

// ----- Timeline -----
export function useTimeline(loteamentoId: string, page = 1) {
  return useQuery({
    queryKey: ['timeline', loteamentoId, page],
    queryFn: () => apiFetch<{ data: TimelineEvent[] }>(`/loteamentos/${loteamentoId}/timeline?page=${page}&limit=50`),
    enabled: !!loteamentoId,
  });
}

// ----- Dossiê -----
export function useDossier(loteamentoId: string) {
  return useQuery({
    queryKey: ['dossier', loteamentoId],
    queryFn: () => apiFetch<DossierData>(`/loteamentos/${loteamentoId}/dossier`),
    enabled: !!loteamentoId,
  });
}

// ----- Checklist -----
export function useChecklist(loteamentoId: string) {
  return useQuery({
    queryKey: ['checklist', loteamentoId],
    queryFn: () => apiFetch<any[]>(`/loteamentos/${loteamentoId}/checklist`),
    enabled: !!loteamentoId,
  });
}

// ----- Portal -----
export function usePortal(token: string) {
  return useQuery({
    queryKey: ['portal', token],
    queryFn: () => apiFetch<PortalData>(`/portal/${token}`),
    enabled: !!token,
  });
}

// ----- Global Stats -----
export function useGlobalScore() {
  return useQuery({
    queryKey: ['global-score'],
    queryFn: () => apiFetch<ScoreData>('/lote/score'),
  });
}

export function useGlobalStats() {
  return useQuery({
    queryKey: ['global-stats'],
    queryFn: () => apiFetch<GlobalStats>('/lote/stats'),
  });
}

// ----- Global Score History -----
export function useGlobalScoreHistory() {
  return useQuery({
    queryKey: ['global-score-history'],
    queryFn: () => apiFetch<ScoreHistory>('/lote/score/history'),
  });
}

// ----- Boleto -----
export function useGerarBoleto(contratoId: string) {
  return useMutation({
    mutationFn: (dto: { parcelaNumero: number }) =>
      apiFetch(`/contratos/${contratoId}/boleto`, { method: 'POST', body: JSON.stringify(dto) }),
  });
}

// ----- Infraestrutura Evidência -----
export function useUploadEvidencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string; item: string; descricao: string; fileName: string; content: string }) =>
      apiFetch(`/loteamentos/${id}/infraestrutura/evidencia`, { method: 'POST', body: JSON.stringify(dto) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['infraestrutura'] }),
  });
}

// ----- Legislação -----
export function useLegislacao() {
  return useQuery({
    queryKey: ['legislacao'],
    queryFn: () => apiFetch<LegislacaoItem[]>('/legislacao'),
  });
}

// ----- Simulador -----
export function useSimulador() {
  return useMutation({
    mutationFn: (dto: any) => apiFetch<any>('/lotes/simular-financiamento', { method: 'POST', body: JSON.stringify(dto) }),
  });
}
