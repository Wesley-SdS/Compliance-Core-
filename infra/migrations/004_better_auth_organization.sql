-- 004_better_auth_organization.sql
-- Better Auth organization plugin tables (multi-tenancy)
-- Ref: https://better-auth.com/docs/plugins/organization

CREATE TABLE IF NOT EXISTS organization (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo TEXT,
    metadata TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS member (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    organization_id TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invitation (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    inviter_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    organization_id TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
);

-- Add activeOrganizationId to session (required by organization plugin)
ALTER TABLE session ADD COLUMN IF NOT EXISTS active_organization_id TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_member_user_id ON member(user_id);
CREATE INDEX IF NOT EXISTS idx_member_org_id ON member(organization_id);
CREATE INDEX IF NOT EXISTS idx_member_user_org ON member(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_invitation_email ON invitation(email);
CREATE INDEX IF NOT EXISTS idx_invitation_org_id ON invitation(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitation_status ON invitation(status);
CREATE INDEX IF NOT EXISTS idx_session_active_org ON session(active_organization_id);
