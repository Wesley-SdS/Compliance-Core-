-- Migration 008: FrotaLeve domain tables
-- Adds abastecimentos, manutencoes, paradas, and checklists tables

BEGIN;

-- Abastecimentos (fuel records)
CREATE TABLE IF NOT EXISTS abastecimentos (
  id          TEXT PRIMARY KEY,
  veiculo_id  TEXT NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
  data        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  litros      NUMERIC(10,2) NOT NULL,
  valor_litro NUMERIC(10,4) NOT NULL,
  total       NUMERIC(12,2) NOT NULL,
  posto       TEXT,
  km          NUMERIC(12,1) NOT NULL,
  status_ocr  TEXT NOT NULL DEFAULT 'PENDENTE',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_abastecimentos_veiculo ON abastecimentos(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_abastecimentos_data ON abastecimentos(data);

-- Manutencoes (maintenance records)
CREATE TABLE IF NOT EXISTS manutencoes (
  id          TEXT PRIMARY KEY,
  veiculo_id  TEXT NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL,
  data        TIMESTAMPTZ NOT NULL,
  km          NUMERIC(12,1) NOT NULL,
  custo       NUMERIC(12,2) NOT NULL DEFAULT 0,
  fornecedor  TEXT,
  descricao   TEXT,
  status      TEXT NOT NULL DEFAULT 'CONCLUIDA',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_manutencoes_veiculo ON manutencoes(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_manutencoes_data ON manutencoes(data);
CREATE INDEX IF NOT EXISTS idx_manutencoes_status ON manutencoes(status);

-- Paradas (trip stops)
CREATE TABLE IF NOT EXISTS paradas (
  id          TEXT PRIMARY KEY,
  viagem_id   TEXT NOT NULL REFERENCES viagens(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_paradas_viagem ON paradas(viagem_id);

-- Checklists (pre-trip inspections)
CREATE TABLE IF NOT EXISTS checklists (
  id            TEXT PRIMARY KEY,
  veiculo_id    TEXT NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
  motorista_id  TEXT NOT NULL REFERENCES motoristas(id) ON DELETE CASCADE,
  data          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  items         JSONB NOT NULL DEFAULT '[]',
  score         INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'PENDENTE',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checklists_veiculo ON checklists(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_checklists_motorista ON checklists(motorista_id);
CREATE INDEX IF NOT EXISTS idx_checklists_data ON checklists(data);

COMMIT;
