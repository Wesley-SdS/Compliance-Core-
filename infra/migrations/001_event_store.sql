CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE compliance_events (
  id              TEXT PRIMARY KEY,
  aggregate_id    TEXT NOT NULL,
  aggregate_type  TEXT NOT NULL,
  event_type      TEXT NOT NULL,
  event_version   INT NOT NULL DEFAULT 1,
  payload         JSONB NOT NULL,
  actor_id        TEXT NOT NULL,
  actor_role      TEXT NOT NULL,
  ip              INET,
  correlation_id  TEXT NOT NULL,
  vertical        TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_aggregate ON compliance_events(aggregate_id, created_at);
CREATE INDEX idx_events_type ON compliance_events(event_type, created_at);
CREATE INDEX idx_events_vertical ON compliance_events(vertical, created_at);
CREATE INDEX idx_events_actor ON compliance_events(actor_id, created_at);
CREATE INDEX idx_events_correlation ON compliance_events(correlation_id);

CREATE TABLE compliance_snapshots (
  aggregate_id    TEXT PRIMARY KEY,
  aggregate_type  TEXT NOT NULL,
  state           JSONB NOT NULL,
  version         INT NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE compliance_documents (
  id              TEXT PRIMARY KEY,
  aggregate_id    TEXT NOT NULL,
  aggregate_type  TEXT NOT NULL,
  vertical        TEXT NOT NULL,
  file_name       TEXT NOT NULL,
  file_key        TEXT NOT NULL,
  file_size       BIGINT NOT NULL,
  mime_type       TEXT NOT NULL,
  category        TEXT NOT NULL,
  expires_at      TIMESTAMPTZ,
  vektus_file_id  TEXT,
  version         INT NOT NULL DEFAULT 1,
  uploaded_by     TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_docs_aggregate ON compliance_documents(aggregate_id);
CREATE INDEX idx_docs_expiry ON compliance_documents(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_docs_vertical ON compliance_documents(vertical);

CREATE TABLE compliance_alerts (
  id              TEXT PRIMARY KEY,
  entity_id       TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  vertical        TEXT NOT NULL,
  alert_type      TEXT NOT NULL,
  due_date        TIMESTAMPTZ NOT NULL,
  days_before     INT[] NOT NULL DEFAULT '{30,15,7,1}',
  channels        TEXT[] NOT NULL DEFAULT '{in_app}',
  status          TEXT NOT NULL DEFAULT 'PENDING',
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerts_entity ON compliance_alerts(entity_id);
CREATE INDEX idx_alerts_due ON compliance_alerts(due_date) WHERE status = 'PENDING';
CREATE INDEX idx_alerts_vertical ON compliance_alerts(vertical);

CREATE TABLE compliance_scores (
  id              TEXT PRIMARY KEY,
  aggregate_id    TEXT NOT NULL,
  aggregate_type  TEXT NOT NULL,
  vertical        TEXT NOT NULL,
  overall         NUMERIC(5,2) NOT NULL,
  level           TEXT NOT NULL,
  breakdown       JSONB NOT NULL,
  trend           TEXT NOT NULL DEFAULT 'ESTAVEL',
  calculated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scores_aggregate ON compliance_scores(aggregate_id, calculated_at);
CREATE INDEX idx_scores_vertical ON compliance_scores(vertical);

CREATE TABLE compliance_checklists (
  id              TEXT PRIMARY KEY,
  aggregate_id    TEXT NOT NULL,
  aggregate_type  TEXT NOT NULL,
  vertical        TEXT NOT NULL,
  template_id     TEXT,
  items           JSONB NOT NULL,
  responses       JSONB,
  status          TEXT NOT NULL DEFAULT 'PENDING',
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_checklists_aggregate ON compliance_checklists(aggregate_id);

CREATE TABLE legislation_updates (
  id              TEXT PRIMARY KEY,
  source_id       TEXT NOT NULL,
  title           TEXT NOT NULL,
  summary         TEXT,
  url             TEXT,
  published_at    TIMESTAMPTZ,
  affected_verticals TEXT[] NOT NULL,
  vektus_file_id  TEXT,
  analyzed        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_legislation_source ON legislation_updates(source_id, published_at);
CREATE INDEX idx_legislation_verticals ON legislation_updates USING GIN(affected_verticals);
