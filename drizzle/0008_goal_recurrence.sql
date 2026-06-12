ALTER TABLE "goals" ADD COLUMN "is_recurring" boolean DEFAULT false NOT NULL;
ALTER TABLE "goals" ADD COLUMN "recurrence_interval" integer;
ALTER TABLE "goals" ADD COLUMN "recurrence_unit" text;
ALTER TABLE "goals" ADD COLUMN "recurrence_end_date" date;
