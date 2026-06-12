-- Batch B · Admin role
-- Adds an is_admin flag to users so config surfaces (Settings, Flows) can be
-- gated. Defaults to true so existing single-user accounts retain full access;
-- future invited members can be created with is_admin = false.
-- Idempotent. Apply via `npm run db:push` or the Neon SQL console.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_admin" boolean DEFAULT true NOT NULL;
