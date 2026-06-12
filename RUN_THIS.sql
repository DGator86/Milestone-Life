-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │  RUN THIS once against your production Neon database to enable the latest │
-- │  features (admin role, custom fields, flow instances, shared workspaces). │
-- │                                                                           │
-- │  HOW (no terminal needed):                                                │
-- │    Neon Console → your project → "SQL Editor" → paste this whole file →   │
-- │    Run.  Brings the schema up to date through migration 0007.             │
-- │                                                                           │
-- │  Safe to run multiple times — every statement is idempotent.             │
-- │  (For a full from-scratch schema, see scripts/launch-schema.sql.)         │
-- └─────────────────────────────────────────────────────────────────────────┘

-- 0003 · Configurable customer type
ALTER TABLE "crm_customers"  ADD COLUMN IF NOT EXISTS "customer_type" text;
ALTER TABLE "user_settings"  ADD COLUMN IF NOT EXISTS "customer_types" jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 0004 · Custom ("infini-add") field values per record
ALTER TABLE "crm_customers"     ADD COLUMN IF NOT EXISTS "custom" jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE "crm_contacts"      ADD COLUMN IF NOT EXISTS "custom" jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE "crm_opportunities" ADD COLUMN IF NOT EXISTS "custom" jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 0005 · Admin role (defaults true so existing owners keep access; invited
--        members are created with is_admin = false)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_admin" boolean NOT NULL DEFAULT true;

-- 0006 · Perpetual flow instances + per-step milestone scheduling
ALTER TABLE "milestones" ADD COLUMN IF NOT EXISTS "touch_target" integer;
ALTER TABLE "milestones" ADD COLUMN IF NOT EXISTS "touch_period" text;

CREATE TABLE IF NOT EXISTS "crm_flow_instances" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "flow_id" uuid NOT NULL,
  "customer_id" uuid,
  "current_stage_idx" integer NOT NULL DEFAULT 0,
  "run_count" integer NOT NULL DEFAULT 1,
  "status" text NOT NULL DEFAULT 'active',
  "notes" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
DO $$ BEGIN ALTER TABLE "crm_flow_instances" ADD CONSTRAINT "crm_flow_instances_user_id_users_id_fk"        FOREIGN KEY ("user_id")     REFERENCES "users"("id")          ON DELETE cascade;  EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "crm_flow_instances" ADD CONSTRAINT "crm_flow_instances_flow_id_crm_flows_id_fk"    FOREIGN KEY ("flow_id")     REFERENCES "crm_flows"("id")      ON DELETE cascade;  EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "crm_flow_instances" ADD CONSTRAINT "crm_flow_instances_customer_id_crm_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "crm_customers"("id") ON DELETE set null; EXCEPTION WHEN duplicate_object THEN null; END $$;
CREATE INDEX IF NOT EXISTS "crm_flow_instances_user_id_idx"     ON "crm_flow_instances" ("user_id");
CREATE INDEX IF NOT EXISTS "crm_flow_instances_flow_id_idx"     ON "crm_flow_instances" ("flow_id");
CREATE INDEX IF NOT EXISTS "crm_flow_instances_customer_id_idx" ON "crm_flow_instances" ("customer_id");

-- 0007 · Shared workspaces (members share one dataset, stored under owner_id)
CREATE TABLE IF NOT EXISTS "workspaces" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL DEFAULT 'My Workspace',
  "owner_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "workspaces_owner_id_unique" UNIQUE ("owner_id")
);
DO $$ BEGIN ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE restrict; EXCEPTION WHEN duplicate_object THEN null; END $$;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;
DO $$ BEGIN ALTER TABLE "users" ADD CONSTRAINT "users_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE set null; EXCEPTION WHEN duplicate_object THEN null; END $$;
CREATE INDEX IF NOT EXISTS "users_workspace_id_idx" ON "users" ("workspace_id");
