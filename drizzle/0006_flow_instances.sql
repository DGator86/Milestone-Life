-- Reconcile · Perpetual flow instances + milestone scheduling
-- Brings the flow-instance and per-step scheduling work into the main trunk.
-- Idempotent: safe to re-run. Apply via `npm run db:push` or the Neon SQL console.

-- Per-step scheduling fields on milestones
ALTER TABLE "milestones" ADD COLUMN IF NOT EXISTS "touch_target" integer;
ALTER TABLE "milestones" ADD COLUMN IF NOT EXISTS "touch_period" text;

-- Running instances of a flow (a customer cycling through a flow's stages)
CREATE TABLE IF NOT EXISTS "crm_flow_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"flow_id" uuid NOT NULL,
	"customer_id" uuid,
	"current_stage_idx" integer DEFAULT 0 NOT NULL,
	"run_count" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
	ALTER TABLE "crm_flow_instances" ADD CONSTRAINT "crm_flow_instances_user_id_users_id_fk"
		FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
	ALTER TABLE "crm_flow_instances" ADD CONSTRAINT "crm_flow_instances_flow_id_crm_flows_id_fk"
		FOREIGN KEY ("flow_id") REFERENCES "public"."crm_flows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
	ALTER TABLE "crm_flow_instances" ADD CONSTRAINT "crm_flow_instances_customer_id_crm_customers_id_fk"
		FOREIGN KEY ("customer_id") REFERENCES "public"."crm_customers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "crm_flow_instances_user_id_idx" ON "crm_flow_instances" ("user_id");
CREATE INDEX IF NOT EXISTS "crm_flow_instances_flow_id_idx" ON "crm_flow_instances" ("flow_id");
CREATE INDEX IF NOT EXISTS "crm_flow_instances_customer_id_idx" ON "crm_flow_instances" ("customer_id");
