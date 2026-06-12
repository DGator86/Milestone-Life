-- Batch B · Custom ("infini-add") fields
-- Stores user-defined field VALUES per record. Field DEFINITIONS live on
-- user_settings.custom_fields (already present). Idempotent: safe to re-run.
-- Apply via `npm run db:push` (drizzle-kit) or the Neon SQL console.

ALTER TABLE "crm_customers" ADD COLUMN IF NOT EXISTS "custom" jsonb DEFAULT '{}'::jsonb NOT NULL;

ALTER TABLE "crm_contacts" ADD COLUMN IF NOT EXISTS "custom" jsonb DEFAULT '{}'::jsonb NOT NULL;

ALTER TABLE "crm_opportunities" ADD COLUMN IF NOT EXISTS "custom" jsonb DEFAULT '{}'::jsonb NOT NULL;
