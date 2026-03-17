export type RegimeTributario = 'SIMPLES_NACIONAL' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL' | 'MEI';
export type ComplianceLevel = 'CRITICO' | 'ATENCAO' | 'BOM' | 'EXCELENTE';
export type TipoOperacao = 'VENDA_MERCADORIA' | 'PRESTACAO_SERVICO' | 'IMPORTACAO';
export type TipoSped = 'FISCAL' | 'CONTABIL' | 'CONTRIBUICOES';

export interface Empresa {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  regimeTributario: RegimeTributario;
  cnaePrincipal?: string;
  endereco?: string;
  email?: string;
  telefone?: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  score?: number;
  level?: ComplianceLevel;
  createdAt?: string;
}

export interface ScoreData {
  value: number;
  level: ComplianceLevel;
  trend: 'MELHORANDO' | 'PIORANDO' | 'ESTAVEL';
  criteria?: ScoreCriterion[];
}

export interface ScoreCriterion {
  criterionId: string;
  name: string;
  weight: number;
  status: 'CONFORME' | 'NAO_CONFORME' | 'PARCIAL' | 'NAO_APLICAVEL';
  score: number;
  details?: string;
}

export interface Simulacao {
  id: string;
  empresaId: string;
  faturamentoBruto: number;
  cbs: number;
  ibs: number;
  is: number;
  totalTributos: number;
  cargaTributariaEfetiva: number;
  creditosAproveitados: number;
  valorLiquido: number;
  competencia: string;
  simuladoEm: string;
}

export interface SimulacaoInput {
  empresaId: string;
  faturamentoBruto: number;
  tipoOperacao: TipoOperacao;
  aliquotaCbs?: number;
  aliquotaIbs?: number;
  aliquotaIs?: number;
  creditosPis?: number;
  creditosCofins?: number;
  competencia: string;
  descricao?: string;
}

export interface SpedFile {
  id: string;
  empresaId: string;
  tipoSped: TipoSped;
  competencia: string;
  fileName: string;
  status: string;
  createdAt: string;
}

export interface Obrigacao {
  id: string;
  nome: string;
  competencia: string;
  vencimento: string;
  status: 'pendente' | 'entregue' | 'atrasado';
  empresa?: string;
}

export interface DecisaoFiscal {
  id: string;
  empresaId: string;
  descricao: string;
  fundamentacaoLegal: string;
  simulacaoId?: string;
  assinatura: string;
  createdAt: string;
}

export interface Documento {
  id: string;
  nome: string;
  category: string;
  status: string;
  vencimento?: string;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  actor: string;
}

export interface LegislacaoItem {
  id: string;
  titulo: string;
  fonte: string;
  data: string;
  resumo: string;
  impacto: 'ALTO' | 'MEDIO' | 'BAIXO';
  novo: boolean;
}

export interface OtimizacaoResult {
  cenarioAtual: { totalCreditos: number; cargaTotal: number };
  cenarioOtimizado: { totalCreditos: number; cargaTotal: number };
  economia: number;
  recomendacoes: Array<{
    fornecedor: string;
    regimeAtual: string;
    regimeRecomendado: string;
    economiaEstimada: number;
  }>;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
