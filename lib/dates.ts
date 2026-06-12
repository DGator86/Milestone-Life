/** Parse YYYY-MM-DD or ISO date strings into local calendar parts. */
export function parseDateParts(value: string | null | undefined): { y: number; m: number; d: number } | null {
  if (!value) return null;
  const dateOnly = value.includes("T") ? value.slice(0, 10) : value;
  const [y, m, d] = dateOnly.split("-").map(Number);
  if (!y || !m || !d) return null;
  return { y, m, d };
}

export function toDateKey(value: string | null | undefined): string | null {
  const parts = parseDateParts(value);
  if (!parts) return null;
  const { y, m, d } = parts;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function startOfLocalDay(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function daysUntilDate(value: string | null | undefined, today = new Date()): number | null {
  const parts = parseDateParts(value);
  if (!parts) return null;
  const t0 = startOfLocalDay(today);
  const due = new Date(parts.y, parts.m - 1, parts.d);
  return Math.round((due.getTime() - t0.getTime()) / 86400000);
}

export function isSameLocalMonth(value: string | null | undefined, year: number, month: number): boolean {
  const parts = parseDateParts(value);
  if (!parts) return false;
  return parts.y === year && parts.m - 1 === month;
}

export function dayOfMonth(value: string | null | undefined): number | null {
  return parseDateParts(value)?.d ?? null;
}

export function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
