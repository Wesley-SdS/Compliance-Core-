export type StatusLaudo = 'RASCUNHO' | 'EM_REVISAO' | 'REVISADO' | 'LIBERADO';
export type ComplianceLevel = 'CRITICO' | 'ATENCAO' | 'BOM' | 'EXCELENTE';
export type FlagResultado = 'normal' | 'alto' | 'baixo' | 'critico';
export type ResultadoCalibracao = 'APROVADO' | 'REPROVADO' | 'APROVADO_COM_RESTRICAO';

export interface Laboratorio {
  id: string;
  nome: string;
  cnpj: string;
  endereco: string;
  responsavel_tecnico: string;
  tipo_laboratorio: string;
  especialidades: string[];
  score?: number;
  level?: ComplianceLevel;
  created_at: string;
}

export interface Paciente {
  nome: string;
  cpf: string;
  dataNascimento: string;
  sexo: 'M' | 'F';
  medicoSolicitante?: string;
}

export interface Resultado {
  analito: string;
  resultado: string;
  unidade: string;
  valorReferencia: string;
  flag: FlagResultado;
}

export interface Laudo {
  id: string;
  laboratorio_id: string;
  paciente_id?: string;
  paciente?: Paciente;
  tipo_exame: string;
  material_biologico: string;
  metodologia: string;
  resultado?: string;
  resultados?: Resultado[];
  unidade?: string;
  valor_referencia?: string;
  observacoes?: string;
  status: StatusLaudo;
  laudo_assinado?: boolean;
  assinado_por?: string;
  equipamento_id?: string;
  equipamento?: Equipamento;
  data_coleta?: string;
  data_liberacao?: string;
  bioquimico_responsavel?: string;
  created_at: string;
  updated_at: string;
}

export interface AlertaIA {
  id: string;
  tipo: 'critico' | 'inconsistencia' | 'sugestao';
  mensagem: string;
  analito?: string;
  acao?: 'aceitar' | 'ignorar' | 'pendente';
  observacao?: string;
}

export interface RevisaoIA {
  laudoId: string;
  alertas: AlertaIA[];
  reviewedAt: string;
}

export interface Equipamento {
  id: string;
  laboratorio_id: string;
  nome: string;
  fabricante: string;
  modelo: string;
  numero_serie: string;
  data_aquisicao: string;
  proxima_calibracao: string;
  calibracao_valida?: boolean;
  rastreabilidade?: boolean;
  status?: string;
  created_at: string;
}

export interface Calibracao {
  id: string;
  equipamento_id: string;
  data_calibracao: string;
  proxima_calibracao: string;
  laboratorio_calibrador: string;
  certificado_numero: string;
  resultado: ResultadoCalibracao;
  observacoes?: string;
  created_at: string;
}

export interface TemplateExame {
  id: string;
  nome: string;
  tipo_exame: string;
  analitos: TemplateAnalito[];
  created_at: string;
}

export interface TemplateAnalito {
  analito: string;
  unidade: string;
  valorReferenciaHomem?: string;
  valorReferenciaMulher?: string;
  valorReferenciaCrianca?: string;
  limiteCriticoAlto?: number;
  limiteCriticoBaixo?: number;
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

export interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  actor: string;
  metadata?: Record<string, unknown>;
}

export interface DashboardStats {
  laudosHoje: number;
  laudosPendentes: number;
  laudosRevisados: number;
  laudosLiberados: number;
  tempoMedioLiberacao: number;
  valoresCriticosHoje: number;
  equipamentosVencidos: number;
  volumePorDia: Array<{ data: string; quantidade: number }>;
  distribuicaoPorExame: Array<{ tipo: string; quantidade: number }>;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface PortalLaudo {
  id: string;
  paciente: string;
  tipoExame: string;
  dataColeta: string;
  dataLiberacao: string;
  bioquimicoResponsavel: string;
  resultados: Array<{
    analito: string;
    resultado: string;
    unidade: string;
    valorReferencia: string;
    flag: FlagResultado;
    explicacao: string;
  }>;
  resumo: string;
  laboratorio: {
    nome: string;
    cnpj: string;
    endereco: string;
  };
}

export interface ConfiguracaoLab {
  nome: string;
  cnpj: string;
  crbioResponsavel: string;
  logo?: string;
  slaHoras: number;
  alertaAntecedencia: number;
  canaisAlerta: string[];
}
