import { cache } from "react";
import { db } from "@/db";
import { user_settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DEFAULT_TERMS, type Terms } from "./terms";
import { sanitizeCustomFieldDefs, type CustomFieldDefs } from "./customFields";

export interface WorkspaceSettings {
  companyName: string | null;
  brandColor: string;
  terms: Terms;
  preferences: Record<string, boolean>;
  customerTypes: string[];
  customFields: CustomFieldDefs;
}

const DEFAULT_BRAND = "#1769FF";

// Seeded list of company classifications. Admins can edit this in Settings;
// an empty/missing list falls back to these defaults so the dropdown is never empty.
export const DEFAULT_CUSTOMER_TYPES = ["Prospect", "Customer", "Partner", "Vendor", "Reseller"];

export const getSettings = cache(async (userId: string): Promise<WorkspaceSettings> => {
  let row;
  try {
    row = await db.query.user_settings.findFirst({ where: eq(user_settings.user_id, userId) });
  } catch {
    // Table may not exist yet (migration not applied) — fall back to defaults.
    row = undefined;
  }
  const storedTypes = (row?.customer_types as string[] | undefined) ?? [];
  return {
    companyName: row?.company_name ?? null,
    brandColor: row?.brand_color ?? DEFAULT_BRAND,
    terms: { ...DEFAULT_TERMS, ...((row?.terminology as Partial<Terms>) ?? {}) },
    preferences: (row?.preferences as Record<string, boolean>) ?? {},
    customerTypes: storedTypes.length > 0 ? storedTypes : DEFAULT_CUSTOMER_TYPES,
    customFields: sanitizeCustomFieldDefs(row?.custom_fields),
  };
});
