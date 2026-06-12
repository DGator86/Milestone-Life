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
