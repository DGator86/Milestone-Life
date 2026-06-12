"use client";

import type { CustomFieldDef } from "@/lib/customFields";

const INPUT = "ms-input";
const LABEL = "ms-label";

// Renders the appropriate input for a user-defined custom field. Inputs are
// named `cf_<id>` so the server action can collect and coerce them by type.
export default function CustomFieldInput({ field, value }: { field: CustomFieldDef; value?: unknown }) {
  const name = `cf_${field.id}`;
  if (field.type === "checkbox") {
    return (
      <div className="flex items-center">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name={name} defaultChecked={!!value} className="w-4 h-4 accent-milestone-blue" />
          {field.label}
        </label>
      </div>
    );
  }
  if (field.type === "select") {
    return (
      <div>
        <label className={LABEL}>{field.label}</label>
        <select name={name} className={INPUT} defaultValue={typeof value === "string" ? value : ""}>
          <option value="">—</option>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>
    );
  }
  const inputType = field.type === "number" ? "number" : field.type === "date" ? "date" : "text";
  return (
    <div>
      <label className={LABEL}>{field.label}</label>
      <input
        name={name}
        type={inputType}
        defaultValue={value === null || value === undefined ? "" : String(value)}
        className={INPUT}
      />
    </div>
  );
}
