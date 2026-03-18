export type TipoVeiculo = 'CAMINHAO' | 'CARRETA' | 'VAN' | 'UTILITARIO';
export type ComplianceLevel = 'CRITICO' | 'ATENCAO' | 'BOM' | 'EXCELENTE';
export type StatusViagem = 'EM_ROTA' | 'FINALIZADA' | 'AGENDADA' | 'CANCELADA';
export type StatusDocumento = 'VALIDO' | 'VENCENDO' | 'VENCIDO';
export type StatusManutencao = 'REALIZADA' | 'AGENDADA' | 'ATRASADA';
export type StatusOCR = 'PENDENTE' | 'PROCESSANDO' | 'CONCLUIDO' | 'ERRO';
export type CategoriaDocumento = 'CNH' | 'MOPP' | 'CRLV' | 'SEGURO_RCTR_C' | 'LICENCIAMENTO' | 'VISTORIA' | 'ANTT' | 'OUTRO';

export interface Veiculo {
  id: string;
  placa: string;
  tipo: TipoVeiculo;
  marca: string;
  modelo: string;
  ano: number;
  chassi?: string;
  renavam?: string;
  km: number;
  score: number;
  level: ComplianceLevel;
  proximoAlerta?: string;
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

export interface Motorista {
  id: string;
  nome: string;
  cpf: string;
  cnh: string;
  cnhCategoria: string;
  cnhValidade: string;
  moppValidade?: string;
  statusCnh: StatusDocumento;
  statusMopp?: StatusDocumento;
  score: number;
  level: ComplianceLevel;
  veiculosVinculados?: string[];
  createdAt?: string;
}

export interface HorasConducao {
  motorista: string;
  motoristaId: string;
  data: string;
  horasDirigidas: number;
  horasDescanso: number;
  horasContinuas: number;
  conforme: boolean;
  alertas: string[];
}

export interface Viagem {
  id: string;
  motoristaId: string;
  motorista: string;
  veiculoId: string;
  veiculo: string;
  origem: string;
  destino: string;
  kmInicio: number;
  kmFim?: number;
  dataInicio: string;
  dataFim?: string;
  status: StatusViagem;
  horasConducao: number;
  custoEstimado?: number;
  paradas: Parada[];
  ciot?: string;
}

export interface Parada {
  id: string;
  tipo: 'DESCANSO' | 'REFEICAO' | 'CARGA' | 'DESCARGA';
  timestamp: string;
  duracao?: number;
}

export interface Abastecimento {
  id: string;
  veiculoId: string;
  data: string;
  litros: number;
  valorLitro: number;
  total: number;
  posto: string;
  km: number;
  statusOcr: StatusOCR;
  imagemUrl?: string;
}

export interface Manutencao {
  id: string;
  veiculoId: string;
  tipo: string;
  data: string;
  km: number;
  custo: number;
  fornecedor?: string;
  descricao?: string;
  status: StatusManutencao;
}

export interface Documento {
  id: string;
  veiculoId?: string;
  motoristaId?: string;
  categoria: CategoriaDocumento;
  nome: string;
  status: StatusDocumento;
  vencimento: string;
  arquivoUrl?: string;
  createdAt?: string;
}

export interface Alerta {
  id: string;
  tipo: string;
  mensagem: string;
  severity: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAIXO';
  veiculoId?: string;
  motoristaId?: string;
  acknowledged: boolean;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  actor?: string;
}

export interface CustoDashboard {
  custoTotal: number;
  custoCombustivel: number;
  custoManutencao: number;
  custoPedagio: number;
  custoSeguro: number;
  custoPorVeiculo: Array<{ veiculoId: string; placa: string; custo: number }>;
  custoPorKm: Array<{ data: string; valor: number }>;
  periodo: string;
}

export interface FrotaStats {
  veiculosAtivos: number;
  documentosVencendo: number;
  manutencoesAtrasadas: number;
  viagensHoje: number;
  motoristasEmRota: number;
  scoreMedia: number;
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

export interface ChecklistItem {
  id: string;
  item: string;
  categoria: string;
  obrigatorio: boolean;
  conforme?: boolean;
  observacao?: string;
}

export interface ChecklistPreViagem {
  id: string;
  veiculoId: string;
  motoristaId: string;
  data: string;
  items: ChecklistItem[];
  score: number;
  status: 'APROVADO' | 'REPROVADO' | 'PARCIAL';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
