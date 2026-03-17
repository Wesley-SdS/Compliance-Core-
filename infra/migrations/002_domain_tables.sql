-- ============================================================================
-- 002_domain_tables.sql
-- Domain tables for all ComplianceCore verticals
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- VIEWS / ALIASES for tables created in 001 with compliance_ prefix
-- The service code references shorter table names
-- ============================================================================

CREATE OR REPLACE VIEW documents AS SELECT * FROM compliance_documents;
CREATE OR REPLACE VIEW alerts AS SELECT * FROM compliance_alerts;
CREATE OR REPLACE VIEW checklists AS SELECT * FROM compliance_checklists;
CREATE OR REPLACE VIEW dossiers AS SELECT * FROM compliance_documents WHERE FALSE;

-- Allow INSERT/UPDATE/DELETE on the views via rules
CREATE OR REPLACE RULE documents_insert AS ON INSERT TO documents
  DO INSTEAD INSERT INTO compliance_documents VALUES (NEW.*);
CREATE OR REPLACE RULE documents_update AS ON UPDATE TO documents
  DO INSTEAD UPDATE compliance_documents SET
    id = NEW.id, aggregate_id = NEW.aggregate_id, aggregate_type = NEW.aggregate_type,
    vertical = NEW.vertical, file_name = NEW.file_name, file_key = NEW.file_key,
    file_size = NEW.file_size, mime_type = NEW.mime_type, category = NEW.category,
    expires_at = NEW.expires_at, vektus_file_id = NEW.vektus_file_id,
    version = NEW.version, uploaded_by = NEW.uploaded_by,
    created_at = NEW.created_at, updated_at = NEW.updated_at
  WHERE id = OLD.id;
CREATE OR REPLACE RULE documents_delete AS ON DELETE TO documents
  DO INSTEAD DELETE FROM compliance_documents WHERE id = OLD.id;

CREATE OR REPLACE RULE alerts_insert AS ON INSERT TO alerts
  DO INSTEAD INSERT INTO compliance_alerts VALUES (NEW.*);
CREATE OR REPLACE RULE alerts_update AS ON UPDATE TO alerts
  DO INSTEAD UPDATE compliance_alerts SET
    id = NEW.id, entity_id = NEW.entity_id, entity_type = NEW.entity_type,
    vertical = NEW.vertical, alert_type = NEW.alert_type, due_date = NEW.due_date,
    days_before = NEW.days_before, channels = NEW.channels, status = NEW.status,
    acknowledged_at = NEW.acknowledged_at, acknowledged_by = NEW.acknowledged_by,
    created_at = NEW.created_at
  WHERE id = OLD.id;
CREATE OR REPLACE RULE alerts_delete AS ON DELETE TO alerts
  DO INSTEAD DELETE FROM compliance_alerts WHERE id = OLD.id;

CREATE OR REPLACE RULE checklists_insert AS ON INSERT TO checklists
  DO INSTEAD INSERT INTO compliance_checklists VALUES (NEW.*);
CREATE OR REPLACE RULE checklists_update AS ON UPDATE TO checklists
  DO INSTEAD UPDATE compliance_checklists SET
    id = NEW.id, aggregate_id = NEW.aggregate_id, aggregate_type = NEW.aggregate_type,
    vertical = NEW.vertical, template_id = NEW.template_id, items = NEW.items,
    responses = NEW.responses, status = NEW.status, completed_at = NEW.completed_at,
    created_at = NEW.created_at
  WHERE id = OLD.id;
CREATE OR REPLACE RULE checklists_delete AS ON DELETE TO checklists
  DO INSTEAD DELETE FROM compliance_checklists WHERE id = OLD.id;

-- ============================================================================
-- ESTETIK VERTICAL: clinicas, procedimentos, pops
-- ============================================================================

-- clinicas: JSONB data pattern (id, data, created_at, updated_at)
CREATE TABLE clinicas (
  id          TEXT PRIMARY KEY,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clinicas_created ON clinicas(created_at DESC);

-- procedimentos: JSONB data pattern
CREATE TABLE procedimentos (
  id          TEXT PRIMARY KEY,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_procedimentos_created ON procedimentos(created_at DESC);
CREATE INDEX idx_procedimentos_tipo ON procedimentos((data->>'tipo')) WHERE data->>'ativo' = 'true';

-- pops: JSONB data pattern
CREATE TABLE pops (
  id          TEXT PRIMARY KEY,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pops_created ON pops(created_at DESC);
CREATE INDEX idx_pops_procedimento ON pops((data->>'procedimentoId'));

-- dossiers: aggregate dossiers for any vertical
CREATE TABLE compliance_dossiers (
  id            TEXT PRIMARY KEY,
  aggregate_id  TEXT NOT NULL,
  data          JSONB NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dossiers_aggregate ON compliance_dossiers(aggregate_id);

-- Re-create the dossiers view properly pointing to the real table
DROP VIEW IF EXISTS dossiers;
CREATE OR REPLACE VIEW dossiers AS SELECT * FROM compliance_dossiers;
CREATE OR REPLACE RULE dossiers_insert AS ON INSERT TO dossiers
  DO INSTEAD INSERT INTO compliance_dossiers VALUES (NEW.*);
CREATE OR REPLACE RULE dossiers_update AS ON UPDATE TO dossiers
  DO INSTEAD UPDATE compliance_dossiers SET
    id = NEW.id, aggregate_id = NEW.aggregate_id, data = NEW.data, created_at = NEW.created_at
  WHERE id = OLD.id;
CREATE OR REPLACE RULE dossiers_delete AS ON DELETE TO dossiers
  DO INSTEAD DELETE FROM compliance_dossiers WHERE id = OLD.id;

-- ============================================================================
-- OBRA VERTICAL: obras, etapas, materiais, obra_trabalhadores
-- ============================================================================

CREATE TABLE obras (
  id                  TEXT PRIMARY KEY,
  nome                TEXT NOT NULL,
  endereco            TEXT NOT NULL,
  responsavel         TEXT NOT NULL,
  tipo_obra           TEXT NOT NULL,
  area_m2             NUMERIC(12,2),
  numero_pavimentos   INT,
  inicio_previsao     TEXT,
  fim_previsao        TEXT,
  cnpj_construtora    TEXT,
  crea_responsavel    TEXT,
  status              TEXT NOT NULL DEFAULT 'PLANEJAMENTO',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_obras_created ON obras(created_at DESC);
CREATE INDEX idx_obras_status ON obras(status);

CREATE TABLE etapas (
  id                    TEXT PRIMARY KEY,
  obra_id               TEXT NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  nome                  TEXT NOT NULL,
  tipo                  TEXT NOT NULL,
  ordem                 INT NOT NULL DEFAULT 0,
  inicio_previsao       TEXT,
  fim_previsao          TEXT,
  inicio_real           TEXT,
  fim_real              TEXT,
  descricao             TEXT,
  status                TEXT NOT NULL DEFAULT 'PENDENTE',
  percentual_concluido  NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_etapas_obra ON etapas(obra_id, ordem ASC);

CREATE TABLE materiais (
  id                    TEXT PRIMARY KEY,
  obra_id               TEXT NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  nome                  TEXT NOT NULL,
  descricao             TEXT,
  quantidade            NUMERIC(12,4) NOT NULL,
  unidade               TEXT NOT NULL,
  fornecedor            TEXT,
  nota_fiscal           TEXT,
  nota_fiscal_vektus_id TEXT,
  status                TEXT NOT NULL DEFAULT 'PENDENTE',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_materiais_obra ON materiais(obra_id, created_at DESC);

CREATE TABLE obra_trabalhadores (
  id          TEXT PRIMARY KEY,
  obra_id     TEXT NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  cpf         TEXT,
  funcao      TEXT,
  status      TEXT NOT NULL DEFAULT 'ATIVO',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_obra_trabalhadores_obra ON obra_trabalhadores(obra_id);

-- ============================================================================
-- TRIBUTO VERTICAL: empresas, calculos_tributarios, sped_files, obrigacoes_acessorias
-- ============================================================================

CREATE TABLE empresas (
  id                    TEXT PRIMARY KEY,
  razao_social          TEXT NOT NULL,
  nome_fantasia         TEXT,
  cnpj                  TEXT NOT NULL,
  inscricao_estadual    TEXT,
  inscricao_municipal   TEXT,
  regime_tributario      TEXT NOT NULL,
  cnae_principal        TEXT,
  endereco              TEXT,
  email                 TEXT,
  telefone              TEXT,
  status                TEXT NOT NULL DEFAULT 'ATIVA',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_empresas_cnpj ON empresas(cnpj);
CREATE INDEX idx_empresas_created ON empresas(created_at DESC);

CREATE TABLE calculos_tributarios (
  id                        TEXT PRIMARY KEY,
  empresa_id                TEXT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  faturamento_bruto         NUMERIC(15,2) NOT NULL,
  cbs                       NUMERIC(15,2) NOT NULL,
  ibs                       NUMERIC(15,2) NOT NULL,
  imposto_seletivo          NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_tributos            NUMERIC(15,2) NOT NULL,
  carga_tributaria_efetiva  NUMERIC(8,2) NOT NULL,
  creditos_aproveitados     NUMERIC(15,2) NOT NULL DEFAULT 0,
  valor_liquido             NUMERIC(15,2) NOT NULL,
  competencia               TEXT NOT NULL,
  tipo_operacao             TEXT NOT NULL,
  descricao                 TEXT,
  simulado_em               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_calculos_empresa ON calculos_tributarios(empresa_id, simulado_em DESC);

CREATE TABLE sped_files (
  id              TEXT PRIMARY KEY,
  empresa_id      TEXT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo_sped       TEXT NOT NULL,
  competencia     TEXT NOT NULL,
  file_name       TEXT NOT NULL,
  file_key        TEXT NOT NULL,
  vektus_file_id  TEXT,
  status          TEXT NOT NULL DEFAULT 'PROCESSANDO',
  validated_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sped_empresa ON sped_files(empresa_id, competencia DESC);

CREATE TABLE obrigacoes_acessorias (
  id            TEXT PRIMARY KEY,
  empresa_id    TEXT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo          TEXT NOT NULL,
  competencia   TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'PENDENTE',
  vencimento    TIMESTAMPTZ,
  entregue_em   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_obrigacoes_empresa ON obrigacoes_acessorias(empresa_id);

-- ============================================================================
-- LAUDO VERTICAL: laboratorios, laudos, equipamentos, calibracoes
-- ============================================================================

CREATE TABLE laboratorios (
  id                    TEXT PRIMARY KEY,
  nome                  TEXT NOT NULL,
  cnpj                  TEXT NOT NULL,
  endereco              TEXT NOT NULL,
  responsavel_tecnico   TEXT NOT NULL,
  crbm                  TEXT,
  tipo_laboratorio      TEXT NOT NULL,
  especialidades        JSONB NOT NULL DEFAULT '[]',
  status                TEXT NOT NULL DEFAULT 'ATIVO',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_laboratorios_cnpj ON laboratorios(cnpj);
CREATE INDEX idx_laboratorios_created ON laboratorios(created_at DESC);

CREATE TABLE laudos (
  id                  TEXT PRIMARY KEY,
  laboratorio_id      TEXT NOT NULL REFERENCES laboratorios(id) ON DELETE CASCADE,
  paciente_id         TEXT,
  tipo_exame          TEXT NOT NULL,
  material_biologico  TEXT NOT NULL,
  metodologia         TEXT NOT NULL,
  resultado           TEXT,
  unidade             TEXT,
  valor_referencia    TEXT,
  observacoes         TEXT,
  status              TEXT NOT NULL DEFAULT 'RASCUNHO',
  laudo_assinado      BOOLEAN NOT NULL DEFAULT FALSE,
  assinado_por        TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_laudos_laboratorio ON laudos(laboratorio_id, created_at DESC);

CREATE TABLE equipamentos (
  id                  TEXT PRIMARY KEY,
  laboratorio_id      TEXT NOT NULL REFERENCES laboratorios(id) ON DELETE CASCADE,
  nome                TEXT NOT NULL,
  fabricante          TEXT NOT NULL,
  modelo              TEXT NOT NULL,
  numero_serie        TEXT NOT NULL,
  data_aquisicao      TEXT NOT NULL,
  proxima_calibracao  TEXT NOT NULL,
  rastreabilidade     BOOLEAN NOT NULL DEFAULT FALSE,
  calibracao_valida   BOOLEAN NOT NULL DEFAULT TRUE,
  status              TEXT NOT NULL DEFAULT 'ATIVO',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_equipamentos_laboratorio ON equipamentos(laboratorio_id);
CREATE INDEX idx_equipamentos_calibracao ON equipamentos(proxima_calibracao) WHERE status = 'ATIVO';

CREATE TABLE calibracoes (
  id                      TEXT PRIMARY KEY,
  equipamento_id          TEXT NOT NULL REFERENCES equipamentos(id) ON DELETE CASCADE,
  data_calibracao         TEXT NOT NULL,
  proxima_calibracao      TEXT NOT NULL,
  laboratorio_calibrador  TEXT NOT NULL,
  certificado_numero      TEXT NOT NULL,
  resultado               TEXT NOT NULL,
  observacoes             TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_calibracoes_equipamento ON calibracoes(equipamento_id, data_calibracao DESC);

-- ============================================================================
-- FROTA VERTICAL: veiculos, motoristas, viagens, descansos
-- ============================================================================

CREATE TABLE veiculos (
  id                  TEXT PRIMARY KEY,
  placa               TEXT NOT NULL,
  renavam             TEXT NOT NULL,
  marca               TEXT NOT NULL,
  modelo              TEXT NOT NULL,
  ano_fabricacao       INT NOT NULL,
  ano_modelo           INT NOT NULL,
  tipo_veiculo        TEXT NOT NULL,
  capacidade_carga    NUMERIC(10,2),
  tem_tacografo       BOOLEAN NOT NULL DEFAULT FALSE,
  tacografo_aferido   BOOLEAN,
  tacografo_validade  TEXT,
  crlv_validade       TEXT,
  crlv_valido         BOOLEAN NOT NULL DEFAULT TRUE,
  ipva_quitado        BOOLEAN NOT NULL DEFAULT FALSE,
  seguro_valido       BOOLEAN NOT NULL DEFAULT FALSE,
  manutencao_em_dia   BOOLEAN NOT NULL DEFAULT FALSE,
  status              TEXT NOT NULL DEFAULT 'ATIVO',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_veiculos_placa ON veiculos(placa);
CREATE INDEX idx_veiculos_created ON veiculos(created_at DESC);
CREATE INDEX idx_veiculos_status ON veiculos(status);

CREATE TABLE motoristas (
  id                  TEXT PRIMARY KEY,
  nome                TEXT NOT NULL,
  cpf                 TEXT NOT NULL,
  cnh_numero          TEXT NOT NULL,
  cnh_categoria       TEXT NOT NULL,
  cnh_validade        TEXT NOT NULL,
  telefone            TEXT,
  transporta_perigoso BOOLEAN NOT NULL DEFAULT FALSE,
  mopp_valido         BOOLEAN NOT NULL DEFAULT FALSE,
  mopp_validade       TEXT,
  em_viagem           BOOLEAN NOT NULL DEFAULT FALSE,
  descanso_conforme   BOOLEAN NOT NULL DEFAULT TRUE,
  status              TEXT NOT NULL DEFAULT 'ATIVO',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_motoristas_cpf ON motoristas(cpf);
CREATE INDEX idx_motoristas_nome ON motoristas(nome ASC);
CREATE INDEX idx_motoristas_cnh_validade ON motoristas(cnh_validade) WHERE status = 'ATIVO';

CREATE TABLE viagens (
  id                      TEXT PRIMARY KEY,
  veiculo_id              TEXT NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
  motorista_id            TEXT NOT NULL REFERENCES motoristas(id) ON DELETE CASCADE,
  origem                  TEXT NOT NULL,
  destino                 TEXT NOT NULL,
  distancia_km            NUMERIC(10,2),
  carga_descricao         TEXT,
  peso_kg                 NUMERIC(10,2),
  ciot_numero             TEXT,
  data_partida            TEXT NOT NULL,
  data_chegada_prevista   TEXT NOT NULL,
  data_chegada_real       TEXT,
  km_percorridos          NUMERIC(10,2),
  observacoes             TEXT,
  status                  TEXT NOT NULL DEFAULT 'PLANEJADA',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_viagens_veiculo ON viagens(veiculo_id, data_partida DESC);
CREATE INDEX idx_viagens_motorista ON viagens(motorista_id, data_partida DESC);
CREATE INDEX idx_viagens_status ON viagens(status);
CREATE INDEX idx_viagens_created ON viagens(created_at DESC);

CREATE TABLE descansos (
  id              TEXT PRIMARY KEY,
  motorista_id    TEXT NOT NULL REFERENCES motoristas(id) ON DELETE CASCADE,
  viagem_id       TEXT REFERENCES viagens(id) ON DELETE SET NULL,
  tipo            TEXT NOT NULL,
  inicio          TEXT NOT NULL,
  fim             TEXT,
  local_descanso  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_descansos_motorista ON descansos(motorista_id, inicio DESC);

-- ============================================================================
-- LOTE VERTICAL: loteamentos, lotes, compradores
-- ============================================================================

CREATE TABLE loteamentos (
  id                        TEXT PRIMARY KEY,
  nome                      TEXT NOT NULL,
  endereco                  TEXT NOT NULL,
  cidade                    TEXT NOT NULL,
  estado                    TEXT NOT NULL,
  area_total                NUMERIC(15,2) NOT NULL,
  total_lotes               INT NOT NULL,
  matricula_numero          TEXT,
  registro_cartorio         BOOLEAN NOT NULL DEFAULT FALSE,
  aprovacao_prefeitura      BOOLEAN NOT NULL DEFAULT FALSE,
  areas_publicas_entregues  BOOLEAN NOT NULL DEFAULT FALSE,
  infraestrutura_minima     BOOLEAN NOT NULL DEFAULT FALSE,
  dimob_entregue            BOOLEAN NOT NULL DEFAULT FALSE,
  efd_reinf_entregue        BOOLEAN NOT NULL DEFAULT FALSE,
  responsavel               TEXT NOT NULL,
  cnpj_loteador             TEXT NOT NULL,
  status                    TEXT NOT NULL DEFAULT 'EM_IMPLANTACAO',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_loteamentos_created ON loteamentos(created_at DESC);
CREATE INDEX idx_loteamentos_cnpj ON loteamentos(cnpj_loteador);

CREATE TABLE lotes (
  id                    TEXT PRIMARY KEY,
  loteamento_id         TEXT NOT NULL REFERENCES loteamentos(id) ON DELETE CASCADE,
  quadra                TEXT NOT NULL,
  numero                TEXT NOT NULL,
  area_m2               NUMERIC(12,2) NOT NULL,
  valor_venda           NUMERIC(15,2) NOT NULL,
  frente                NUMERIC(8,2),
  fundo                 NUMERIC(8,2),
  lado_direito          NUMERIC(8,2),
  lado_esquerdo         NUMERIC(8,2),
  comprador_id          TEXT,
  status                TEXT NOT NULL DEFAULT 'DISPONIVEL',
  contrato_registrado   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lotes_loteamento ON lotes(loteamento_id, quadra, numero);
CREATE INDEX idx_lotes_status ON lotes(loteamento_id, status);

CREATE TABLE compradores (
  id                        TEXT PRIMARY KEY,
  loteamento_id             TEXT NOT NULL REFERENCES loteamentos(id) ON DELETE CASCADE,
  nome                      TEXT NOT NULL,
  cpf_cnpj                  TEXT NOT NULL,
  email                     TEXT,
  telefone                  TEXT,
  endereco                  TEXT,
  lgpd_consentimento        BOOLEAN NOT NULL DEFAULT FALSE,
  lgpd_consentimento_data   TIMESTAMPTZ,
  status                    TEXT NOT NULL DEFAULT 'ATIVO',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compradores_loteamento ON compradores(loteamento_id, nome ASC);
CREATE INDEX idx_compradores_cpf ON compradores(cpf_cnpj);
CREATE INDEX idx_compradores_lgpd ON compradores(loteamento_id) WHERE lgpd_consentimento = FALSE;

-- ============================================================================
-- Add entity_type column to checklists if services query by it
-- (001 migration did not include entity_type; services use it)
-- ============================================================================

ALTER TABLE compliance_checklists ADD COLUMN IF NOT EXISTS entity_type TEXT;
CREATE INDEX IF NOT EXISTS idx_checklists_entity_type ON compliance_checklists(aggregate_id, entity_type);

-- Add aggregate_type to compliance_scores if not queryable by service code
-- (services insert with aggregate_id and query by it — already indexed)

-- ============================================================================
-- Add foreign key from lotes.comprador_id -> compradores.id
-- ============================================================================

ALTER TABLE lotes ADD CONSTRAINT fk_lotes_comprador
  FOREIGN KEY (comprador_id) REFERENCES compradores(id) ON DELETE SET NULL;
