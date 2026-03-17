-- 006: Tabelas para parsing real de SPED EFD
-- Novas colunas em sped_files + tabela sped_notas

-- Adicionar colunas de resumo ao sped_files
ALTER TABLE sped_files ADD COLUMN IF NOT EXISTS total_registros INTEGER DEFAULT 0;
ALTER TABLE sped_files ADD COLUMN IF NOT EXISTS total_notas INTEGER DEFAULT 0;
ALTER TABLE sped_files ADD COLUMN IF NOT EXISTS valor_entradas NUMERIC(15,2) DEFAULT 0;
ALTER TABLE sped_files ADD COLUMN IF NOT EXISTS valor_saidas NUMERIC(15,2) DEFAULT 0;
ALTER TABLE sped_files ADD COLUMN IF NOT EXISTS icms_total NUMERIC(15,2) DEFAULT 0;
ALTER TABLE sped_files ADD COLUMN IF NOT EXISTS pis_total NUMERIC(15,2) DEFAULT 0;
ALTER TABLE sped_files ADD COLUMN IF NOT EXISTS cofins_total NUMERIC(15,2) DEFAULT 0;
ALTER TABLE sped_files ADD COLUMN IF NOT EXISTS ipi_total NUMERIC(15,2) DEFAULT 0;
ALTER TABLE sped_files ADD COLUMN IF NOT EXISTS parse_errors JSONB;

-- Tabela de notas fiscais extraídas do SPED
CREATE TABLE IF NOT EXISTS sped_notas (
  id TEXT PRIMARY KEY,
  sped_file_id TEXT NOT NULL REFERENCES sped_files(id) ON DELETE CASCADE,
  ind_oper TEXT NOT NULL, -- 0=Entrada, 1=Saída
  cod_mod TEXT,
  num_doc TEXT,
  chv_nfe TEXT,
  dt_doc TEXT,
  vl_doc NUMERIC(15,2) DEFAULT 0,
  vl_bc_icms NUMERIC(15,2) DEFAULT 0,
  vl_icms NUMERIC(15,2) DEFAULT 0,
  vl_ipi NUMERIC(15,2) DEFAULT 0,
  vl_pis NUMERIC(15,2) DEFAULT 0,
  vl_cofins NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sped_notas_sped_file_id ON sped_notas(sped_file_id);
CREATE INDEX IF NOT EXISTS idx_sped_notas_ind_oper ON sped_notas(ind_oper);

-- Coluna decisao_id em calculos_tributarios (para vincular decisão fiscal)
ALTER TABLE calculos_tributarios ADD COLUMN IF NOT EXISTS decisao_id TEXT REFERENCES decisoes_fiscais(id);
ALTER TABLE calculos_tributarios ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
