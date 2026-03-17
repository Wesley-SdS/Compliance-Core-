-- ============================================================================
-- 005_tributo_new_tables.sql
-- New tables for Tributo vertical: decisoes_fiscais, legislacao
-- Also fixes obrigacoes_acessorias schema mismatch (adds nome column)
-- ============================================================================

-- ============================================================================
-- DECISOES FISCAIS: signed fiscal decisions linked to empresas
-- ============================================================================

CREATE TABLE decisoes_fiscais (
  id                    TEXT PRIMARY KEY,
  empresa_id            TEXT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  descricao             TEXT NOT NULL,
  fundamentacao_legal   TEXT NOT NULL,
  simulacao_id          TEXT,
  assinatura            TEXT NOT NULL,
  created_by            TEXT NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_decisoes_empresa ON decisoes_fiscais(empresa_id, created_at DESC);
CREATE INDEX idx_decisoes_assinatura ON decisoes_fiscais(assinatura);

-- ============================================================================
-- LEGISLACAO: tax legislation tracking
-- ============================================================================

CREATE TABLE legislacao (
  id          TEXT PRIMARY KEY,
  titulo      TEXT NOT NULL,
  fonte       TEXT NOT NULL,
  data        TEXT NOT NULL,
  resumo      TEXT NOT NULL,
  impacto     TEXT NOT NULL,
  novo        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_legislacao_data ON legislacao(data DESC);
CREATE INDEX idx_legislacao_impacto ON legislacao(impacto);

-- ============================================================================
-- FIX: obrigacoes_acessorias has 'tipo' but service uses 'nome'
-- Add 'nome' column and backfill from 'tipo'
-- ============================================================================

ALTER TABLE obrigacoes_acessorias ADD COLUMN IF NOT EXISTS nome TEXT;
UPDATE obrigacoes_acessorias SET nome = tipo WHERE nome IS NULL;
