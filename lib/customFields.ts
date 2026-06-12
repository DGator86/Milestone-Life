// Custom ("infini-add") fields: user-defined fields that can be attached to CRM
// records. Definitions live on user_settings.custom_fields (per object); the
// values live in a `custom` jsonb column on each record.

export type CustomFieldType = "text" | "number" | "checkbox" | "date" | "select";

export const CUSTOM_FIELD_TYPES: { value: CustomFieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "checkbox", label: "Checkbox" },
  { value: "date", label: "Date" },
  { value: "select", label: "Dropdown" },
];

export interface CustomFieldDef {
  id: string;
  label: string;
  type: CustomFieldType;
  options?: string[]; // only for "select"
}

export type CustomFieldObject = "customer" | "contact" | "opportunity";
export const CUSTOM_FIELD_OBJECTS: CustomFieldObject[] = ["customer", "contact", "opportunity"];

export type CustomFieldDefs = Record<CustomFieldObject, CustomFieldDef[]>;

export const EMPTY_CUSTOM_FIELD_DEFS: CustomFieldDefs = { customer: [], contact: [], opportunity: [] };

const VALID_TYPES = new Set<CustomFieldType>(["text", "number", "checkbox", "date", "select"]);
const MAX_FIELDS_PER_OBJECT = 30;
const MAX_OPTIONS = 50;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// Clean a single object's field definition list (used server-side before persisting).
export function sanitizeFieldList(raw: unknown): CustomFieldDef[] {
  if (!Array.isArray(raw)) return [];
  const seenIds = new Set<string>();
  const out: CustomFieldDef[] = [];
  for (const item of raw) {
    if (!isPlainObject(item)) continue;
    const label = String(item.label ?? "").trim().slice(0, 40);
    const type = item.type as CustomFieldType;
    if (!label || !VALID_TYPES.has(type)) continue;
    let id = String(item.id ?? "").trim().slice(0, 64);
    if (!id || seenIds.has(id)) continue;
    seenIds.add(id);
    const def: CustomFieldDef = { id, label, type };
    if (type === "select") {
      const opts = Array.isArray(item.options) ? item.options : [];
      const seen = new Set<string>();
      def.options = opts
        .map((o) => String(o).trim().slice(0, 40))
        .filter((o) => o && !seen.has(o.toLowerCase()) && seen.add(o.toLowerCase()))
        .slice(0, MAX_OPTIONS);
    }
    out.push(def);
    if (out.length >= MAX_FIELDS_PER_OBJECT) break;
  }
  return out;
}

// Normalize the full per-object defs map read from settings.
export function sanitizeCustomFieldDefs(raw: unknown): CustomFieldDefs {
  const src = isPlainObject(raw) ? raw : {};
  return {
    customer: sanitizeFieldList(src.customer),
    contact: sanitizeFieldList(src.contact),
    opportunity: sanitizeFieldList(src.opportunity),
  };
}

// Collect submitted custom values from a FormData, coercing by field type.
// Inputs are named `cf_<fieldId>`. Returns a `{ fieldId: value }` map.
export function collectCustomValues(formData: FormData, defs: CustomFieldDef[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const def of defs) {
    const key = `cf_${def.id}`;
    if (def.type === "checkbox") {
      out[def.id] = formData.get(key) === "on";
      continue;
    }
    const raw = (formData.get(key) as string | null)?.trim() ?? "";
    if (def.type === "number") {
      const n = raw ? Number(raw) : NaN;
      out[def.id] = raw !== "" && Number.isFinite(n) ? n : null;
    } else if (def.type === "select") {
      out[def.id] = def.options?.includes(raw) ? raw : null;
    } else {
      out[def.id] = raw || null;
    }
  }
  return out;
}

// Read a stored value as a record map (defensive against nulls / bad shapes).
export function readCustomValues(raw: unknown): Record<string, unknown> {
  return isPlainObject(raw) ? raw : {};
}

// Human-readable display for a stored custom value.
export function formatCustomValue(def: CustomFieldDef, value: unknown): string {
  if (def.type === "checkbox") return value ? "Yes" : "No";
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

const TRUTHY = new Set(["true", "yes", "y", "1", "on", "checked"]);
const FALSY = new Set(["false", "no", "n", "0", "off", "unchecked"]);

function coerceSingleValue(def: CustomFieldDef, raw: string): unknown {
  const trimmed = raw.trim();
  if (def.type === "checkbox") {
    const lower = trimmed.toLowerCase();
    if (!trimmed) return false;
    if (TRUTHY.has(lower)) return true;
    if (FALSY.has(lower)) return false;
    return Boolean(trimmed);
  }
  if (!trimmed) return null;
  if (def.type === "number") {
    const n = Number(trimmed.replace(/[$,\s]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  if (def.type === "select") {
    const match = def.options?.find((o) => o.toLowerCase() === trimmed.toLowerCase());
    return match ?? trimmed;
  }
  return trimmed;
}

/** Coerce CSV string values into typed custom field values (import path). */
export function coerceCustomValuesFromStrings(
  raw: Record<string, string>,
  defs: CustomFieldDef[]
): Record<string, unknown> {
  const defById = new Map(defs.map((d) => [d.id, d]));
  const out: Record<string, unknown> = {};
  for (const [fieldId, value] of Object.entries(raw)) {
    const def = defById.get(fieldId);
    if (!def) continue;
    out[fieldId] = coerceSingleValue(def, value ?? "");
  }
  return out;
}

/** Stable id for a custom field created during CSV import. */
export function makeImportFieldId(label: string): string {
  const slug =
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 32) || "field";
  return `imp_${slug}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Merge newly imported field defs into workspace settings without duplicates. */
export function mergeCustomFieldDefs(
  existing: CustomFieldDef[],
  incoming: CustomFieldDef[]
): CustomFieldDef[] {
  const merged = [...existing];
  const ids = new Set(existing.map((f) => f.id));
  const labels = new Set(existing.map((f) => f.label.toLowerCase()));
  for (const item of incoming) {
    if (merged.length >= MAX_FIELDS_PER_OBJECT) break;
    const cleaned = sanitizeFieldList([item])[0];
    if (!cleaned || ids.has(cleaned.id)) continue;
    let label = cleaned.label;
    if (labels.has(label.toLowerCase())) {
      label = `${label} (import)`;
    }
    const def = { ...cleaned, label };
    merged.push(def);
    ids.add(def.id);
    labels.add(def.label.toLowerCase());
  }
  return merged;
}
