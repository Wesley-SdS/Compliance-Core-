-- 007_laudo_domain.sql
-- Templates, portal tokens, and laudo column extensions

-- Templates de exames com analitos padrao
CREATE TABLE IF NOT EXISTS laudo_templates (
  id TEXT PRIMARY KEY,
  laboratorio_id TEXT REFERENCES laboratorios(id),
  nome TEXT NOT NULL,
  tipo_exame TEXT NOT NULL,
  analitos JSONB NOT NULL DEFAULT '[]',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_laudo_templates_lab ON laudo_templates(laboratorio_id);
CREATE INDEX IF NOT EXISTS idx_laudo_templates_tipo ON laudo_templates(tipo_exame);

-- Portal tokens para acesso publico a laudos
CREATE TABLE IF NOT EXISTS portal_tokens (
  id TEXT PRIMARY KEY,
  laudo_id TEXT NOT NULL REFERENCES laudos(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_portal_tokens_laudo ON portal_tokens(laudo_id);
CREATE INDEX IF NOT EXISTS idx_portal_tokens_expires ON portal_tokens(expires_at);

-- Colunas adicionais na tabela laudos
ALTER TABLE laudos ADD COLUMN IF NOT EXISTS resultados JSONB;
ALTER TABLE laudos ADD COLUMN IF NOT EXISTS revisao_ia JSONB;
ALTER TABLE laudos ADD COLUMN IF NOT EXISTS crbio_responsavel TEXT;
ALTER TABLE laudos ADD COLUMN IF NOT EXISTS bioquimico_responsavel TEXT;
ALTER TABLE laudos ADD COLUMN IF NOT EXISTS paciente_nome TEXT;
ALTER TABLE laudos ADD COLUMN IF NOT EXISTS data_coleta TIMESTAMPTZ;
ALTER TABLE laudos ADD COLUMN IF NOT EXISTS liberado_at TIMESTAMPTZ;
ALTER TABLE laudos ADD COLUMN IF NOT EXISTS laudo_assinado BOOLEAN DEFAULT false;

-- Indices para queries de dashboard
CREATE INDEX IF NOT EXISTS idx_laudos_status ON laudos(laboratorio_id, status);
CREATE INDEX IF NOT EXISTS idx_laudos_created ON laudos(laboratorio_id, created_at);
CREATE INDEX IF NOT EXISTS idx_laudos_liberado ON laudos(laboratorio_id, liberado_at);
