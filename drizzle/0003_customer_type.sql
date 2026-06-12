-- Batch B · Customer Type
-- Adds a configurable "Customer Type" classification to companies, plus the
-- per-workspace list of allowed types stored on user_settings.
-- Idempotent: safe to run more than once. Apply via `npm run db:push`
-- (drizzle-kit) or paste into the Neon SQL console.

ALTER TABLE "crm_customers" ADD COLUMN IF NOT EXISTS "customer_type" text;

ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "customer_types" jsonb DEFAULT '[]'::jsonb NOT NULL;
