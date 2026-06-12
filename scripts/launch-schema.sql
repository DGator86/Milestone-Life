-- Milestone — full idempotent schema for Neon (paste into Neon SQL Editor and Run).
-- Safe to run multiple times; existing objects are skipped.

CREATE TABLE IF NOT EXISTS "activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"goal_id" uuid NOT NULL,
	"milestone_id" uuid,
	"action" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"list_id" uuid,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"company" text,
	"role" text,
	"notes" text,
	"touch_frequency_days" integer,
	"last_touched_at" timestamp with time zone,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "crm_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"customer_id" uuid,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text,
	"title" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "crm_customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"industry" text,
	"website" text,
	"phone" text,
	"email" text,
	"status" text DEFAULT 'prospect' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "crm_flows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#1769FF' NOT NULL,
	"stages" jsonb DEFAULT '["Lead","Qualified","Proposal","Negotiation","Won","Lost"]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "crm_opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"customer_id" uuid,
	"contact_id" uuid,
	"flow_id" uuid,
	"title" text NOT NULL,
	"value" numeric(12, 2),
	"stage" text DEFAULT 'Lead' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"close_date" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "crm_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"customer_id" uuid,
	"contact_id" uuid,
	"opportunity_id" uuid,
	"title" text NOT NULL,
	"type" text DEFAULT 'task' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"due_date" date,
	"done" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"contact_id" uuid,
	"title" text NOT NULL,
	"goal_type" text DEFAULT 'concrete' NOT NULL,
	"importance" text DEFAULT 'normal' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"due_date" date,
	"pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"goal_id" uuid NOT NULL,
	"title" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'upcoming' NOT NULL,
	"due_date" date,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "touches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"deal_id" uuid,
	"type" text NOT NULL,
	"notes" text,
	"touched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
DO $$ BEGIN
  ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_milestone_id_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."milestones"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "contacts" ADD CONSTRAINT "contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "contacts" ADD CONSTRAINT "contacts_list_id_groups_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."groups"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "crm_contacts" ADD CONSTRAINT "crm_contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "crm_contacts" ADD CONSTRAINT "crm_contacts_customer_id_crm_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."crm_customers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "crm_customers" ADD CONSTRAINT "crm_customers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "crm_flows" ADD CONSTRAINT "crm_flows_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "crm_opportunities" ADD CONSTRAINT "crm_opportunities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "crm_opportunities" ADD CONSTRAINT "crm_opportunities_customer_id_crm_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."crm_customers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "crm_opportunities" ADD CONSTRAINT "crm_opportunities_contact_id_crm_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."crm_contacts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "crm_opportunities" ADD CONSTRAINT "crm_opportunities_flow_id_crm_flows_id_fk" FOREIGN KEY ("flow_id") REFERENCES "public"."crm_flows"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_customer_id_crm_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."crm_customers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_contact_id_crm_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."crm_contacts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_opportunity_id_crm_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."crm_opportunities"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "goals" ADD CONSTRAINT "goals_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "groups" ADD CONSTRAINT "groups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "milestones" ADD CONSTRAINT "milestones_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "touches" ADD CONSTRAINT "touches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "touches" ADD CONSTRAINT "touches_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 0001: connect goals to CRM
-- Connect goals to CRM customers and opportunities so everything links together.
ALTER TABLE "goals" ADD COLUMN IF NOT EXISTS "customer_id" uuid;
ALTER TABLE "goals" ADD COLUMN IF NOT EXISTS "opportunity_id" uuid;

DO $$ BEGIN
  ALTER TABLE "goals" ADD CONSTRAINT "goals_customer_id_crm_customers_id_fk"
    FOREIGN KEY ("customer_id") REFERENCES "crm_customers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "goals" ADD CONSTRAINT "goals_opportunity_id_crm_opportunities_id_fk"
    FOREIGN KEY ("opportunity_id") REFERENCES "crm_opportunities"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE INDEX IF NOT EXISTS "goals_customer_id_idx" ON "goals" ("customer_id");
CREATE INDEX IF NOT EXISTS "goals_opportunity_id_idx" ON "goals" ("opportunity_id");

-- 0002: workspace settings
-- Per-user workspace customization (company identity, terminology, brand, prefs).
CREATE TABLE IF NOT EXISTS "user_settings" (
  "user_id" uuid PRIMARY KEY NOT NULL,
  "company_name" text,
  "brand_color" text NOT NULL DEFAULT '#1769FF',
  "terminology" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "preferences" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "custom_fields" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 0003: configurable customer type
ALTER TABLE "crm_customers" ADD COLUMN IF NOT EXISTS "customer_type" text;
ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "customer_types" jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 0004: custom ("infini-add") field values per record
ALTER TABLE "crm_customers" ADD COLUMN IF NOT EXISTS "custom" jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE "crm_contacts" ADD COLUMN IF NOT EXISTS "custom" jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE "crm_opportunities" ADD COLUMN IF NOT EXISTS "custom" jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 0005: admin role
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_admin" boolean NOT NULL DEFAULT true;

-- 0006: perpetual flow instances + milestone scheduling
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

DO $$ BEGIN
  ALTER TABLE "crm_flow_instances" ADD CONSTRAINT "crm_flow_instances_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "crm_flow_instances" ADD CONSTRAINT "crm_flow_instances_flow_id_crm_flows_id_fk"
    FOREIGN KEY ("flow_id") REFERENCES "crm_flows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "crm_flow_instances" ADD CONSTRAINT "crm_flow_instances_customer_id_crm_customers_id_fk"
    FOREIGN KEY ("customer_id") REFERENCES "crm_customers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE INDEX IF NOT EXISTS "crm_flow_instances_user_id_idx" ON "crm_flow_instances" ("user_id");
CREATE INDEX IF NOT EXISTS "crm_flow_instances_flow_id_idx" ON "crm_flow_instances" ("flow_id");
CREATE INDEX IF NOT EXISTS "crm_flow_instances_customer_id_idx" ON "crm_flow_instances" ("customer_id");

-- goals → CRM links (added alongside the reconciled trunk)
ALTER TABLE "goals" ADD COLUMN IF NOT EXISTS "customer_id" uuid;
ALTER TABLE "goals" ADD COLUMN IF NOT EXISTS "opportunity_id" uuid;

-- 0007: shared workspaces (members share one dataset, stored under owner_id)
CREATE TABLE IF NOT EXISTS "workspaces" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL DEFAULT 'My Workspace',
  "owner_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "workspaces_owner_id_unique" UNIQUE ("owner_id")
);

DO $$ BEGIN
  ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_id_users_id_fk"
    FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;

DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_workspace_id_workspaces_id_fk"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE INDEX IF NOT EXISTS "users_workspace_id_idx" ON "users" ("workspace_id");
