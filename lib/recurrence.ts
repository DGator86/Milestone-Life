import { parseDateParts, localDateKey } from "@/lib/dates";

export type RecurrenceUnit = "day" | "week" | "month" | "year";

export const RECURRENCE_UNITS: { value: RecurrenceUnit; label: string }[] = [
  { value: "day", label: "Days" },
  { value: "week", label: "Weeks" },
  { value: "month", label: "Months" },
  { value: "year", label: "Years" },
];

export function advanceDate(
  dateStr: string,
  interval: number,
  unit: RecurrenceUnit
): string {
  const parts = parseDateParts(dateStr);
  if (!parts) return dateStr;

  const date = new Date(parts.y, parts.m - 1, parts.d);
  switch (unit) {
    case "day":
      date.setDate(date.getDate() + interval);
      break;
    case "week":
      date.setDate(date.getDate() + interval * 7);
      break;
    case "month":
      date.setMonth(date.getMonth() + interval);
      break;
    case "year":
      date.setFullYear(date.getFullYear() + interval);
      break;
  }

  return localDateKey(date);
}

export function formatRecurrence(
  interval: number | null | undefined,
  unit: RecurrenceUnit | string | null | undefined
): string {
  const n = interval ?? 1;
  const u = (unit ?? "week") as RecurrenceUnit;
  const unitLabel = RECURRENCE_UNITS.find((item) => item.value === u)?.label.toLowerCase() ?? "weeks";
  const singular = unitLabel.replace(/s$/, "");
  return n === 1 ? `Every ${singular}` : `Every ${n} ${unitLabel.toLowerCase()}`;
}

export function parseRecurringFlag(value: FormDataEntryValue | null): boolean {
  return value === "true" || value === "on" || value === "1";
}

export interface RecurrenceInput {
  is_recurring: boolean;
  recurrence_interval: number | null;
  recurrence_unit: RecurrenceUnit | null;
  recurrence_end_date: string | null;
}

export function parseRecurrenceFromForm(formData: FormData) {
  const isRecurring = parseRecurringFlag(formData.get("is_recurring"));
  const intervalRaw = (formData.get("recurrence_interval") as string)?.trim();
  const unitRaw = (formData.get("recurrence_unit") as string)?.trim();
  const endRaw = (formData.get("recurrence_end_date") as string)?.trim();

  return normalizeRecurrence({
    is_recurring: isRecurring,
    recurrence_interval: intervalRaw ? Number(intervalRaw) : null,
    recurrence_unit: unitRaw || null,
    recurrence_end_date: endRaw || null,
  });
}

export function normalizeRecurrence(raw: {
  is_recurring: boolean;
  recurrence_interval?: number | null;
  recurrence_unit?: string | null;
  recurrence_end_date?: string | null;
}): RecurrenceInput {
  if (!raw.is_recurring) {
    return {
      is_recurring: false,
      recurrence_interval: null,
      recurrence_unit: null,
      recurrence_end_date: null,
    };
  }

  return {
    is_recurring: true,
    recurrence_interval: raw.recurrence_interval ?? 1,
    recurrence_unit: (raw.recurrence_unit as RecurrenceUnit) ?? "week",
    recurrence_end_date: raw.recurrence_end_date || null,
  };
}
