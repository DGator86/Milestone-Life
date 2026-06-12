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
