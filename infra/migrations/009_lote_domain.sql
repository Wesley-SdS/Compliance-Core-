-- Migration 009: LotePro domain tables
-- Vertical: lote (compliance imobiliário para loteadoras)

-- Loteamentos
CREATE TABLE IF NOT EXISTS loteamentos (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  endereco TEXT,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  area_total NUMERIC(12,2),
  total_lotes INTEGER DEFAULT 0,
  matricula_numero TEXT,
  registro_cartorio BOOLEAN DEFAULT false,
  aprovacao_prefeitura BOOLEAN DEFAULT false,
  areas_publicas_entregues BOOLEAN DEFAULT false,
  infraestrutura_minima BOOLEAN DEFAULT false,
  dimob_entregue BOOLEAN DEFAULT false,
  efd_reinf_entregue BOOLEAN DEFAULT false,
  responsavel TEXT,
  cnpj_loteador TEXT,
  status TEXT NOT NULL DEFAULT 'EM_IMPLANTACAO',
  score NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lotes
CREATE TABLE IF NOT EXISTS lotes (
  id TEXT PRIMARY KEY,
  loteamento_id TEXT NOT NULL REFERENCES loteamentos(id) ON DELETE CASCADE,
  quadra TEXT NOT NULL,
  numero TEXT NOT NULL,
  area_m2 NUMERIC(10,2) NOT NULL,
  valor_venda NUMERIC(12,2) NOT NULL,
  frente NUMERIC(8,2),
  fundo NUMERIC(8,2),
  lado_direito NUMERIC(8,2),
  lado_esquerdo NUMERIC(8,2),
  status TEXT NOT NULL DEFAULT 'DISPONIVEL',
  comprador_id TEXT,
  contrato_registrado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lotes_loteamento ON lotes(loteamento_id);
CREATE INDEX IF NOT EXISTS idx_lotes_status ON lotes(loteamento_id, status);

-- Compradores
CREATE TABLE IF NOT EXISTS compradores (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  loteamento_id TEXT REFERENCES loteamentos(id),
  lgpd_consentimento BOOLEAN DEFAULT false,
  lgpd_consentimento_data TIMESTAMPTZ,
  access_token TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_compradores_loteamento ON compradores(loteamento_id);
CREATE INDEX IF NOT EXISTS idx_compradores_token ON compradores(access_token);

-- Contratos
CREATE TABLE IF NOT EXISTS contratos (
  id TEXT PRIMARY KEY,
  loteamento_id TEXT NOT NULL REFERENCES loteamentos(id),
  lote_id TEXT NOT NULL REFERENCES lotes(id),
  comprador_id TEXT NOT NULL REFERENCES compradores(id),
  valor_total NUMERIC(12,2) NOT NULL,
  valor_entrada NUMERIC(12,2) DEFAULT 0,
  valor_financiado NUMERIC(12,2) NOT NULL,
  numero_parcelas INTEGER NOT NULL,
  taxa_juros_mensal NUMERIC(6,4) NOT NULL,
  sistema TEXT NOT NULL DEFAULT 'PRICE',
  status TEXT NOT NULL DEFAULT 'ATIVO',
  multa_distrato NUMERIC(12,2),
  valor_devolver NUMERIC(12,2),
  distratado_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contratos_loteamento ON contratos(loteamento_id);
CREATE INDEX IF NOT EXISTS idx_contratos_comprador ON contratos(comprador_id);

-- Parcelas
CREATE TABLE IF NOT EXISTS parcelas (
  id TEXT PRIMARY KEY,
  contrato_id TEXT NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  valor_amortizacao NUMERIC(12,2),
  valor_juros NUMERIC(12,2),
  valor_prestacao NUMERIC(12,2) NOT NULL,
  saldo_devedor NUMERIC(12,2),
  data_vencimento DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDENTE',
  data_pagamento TIMESTAMPTZ,
  valor_pago NUMERIC(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_parcelas_contrato ON parcelas(contrato_id, numero);

-- Infraestrutura itens
CREATE TABLE IF NOT EXISTS infraestrutura_itens (
  id TEXT PRIMARY KEY,
  loteamento_id TEXT NOT NULL REFERENCES loteamentos(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  percentual NUMERIC(5,2) DEFAULT 0,
  responsavel TEXT,
  prazo DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_infra_loteamento ON infraestrutura_itens(loteamento_id);

-- Infraestrutura evidências
CREATE TABLE IF NOT EXISTS infraestrutura_evidencias (
  id TEXT PRIMARY KEY,
  infraestrutura_item_id TEXT NOT NULL REFERENCES infraestrutura_itens(id) ON DELETE CASCADE,
  descricao TEXT,
  file_name TEXT NOT NULL,
  file_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aprovações
CREATE TABLE IF NOT EXISTS aprovacoes (
  id TEXT PRIMARY KEY,
  loteamento_id TEXT NOT NULL REFERENCES loteamentos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDENTE',
  protocolo TEXT,
  data_aprovacao DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aprovacoes_loteamento ON aprovacoes(loteamento_id);

-- Régua de cobrança
CREATE TABLE IF NOT EXISTS cobranca_regua (
  id TEXT PRIMARY KEY,
  etapas JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cobrança execuções
CREATE TABLE IF NOT EXISTS cobranca_execucoes (
  id TEXT PRIMARY KEY,
  contrato_id TEXT NOT NULL REFERENCES contratos(id),
  etapa_index INTEGER NOT NULL,
  canal TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Legislação feed
CREATE TABLE IF NOT EXISTS legislacao_feed (
  id TEXT PRIMARY KEY,
  lei TEXT NOT NULL,
  titulo TEXT NOT NULL,
  resumo TEXT,
  impacto TEXT DEFAULT 'medio',
  data DATE,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
