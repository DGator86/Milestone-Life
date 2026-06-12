"use client";

import { useState } from "react";
import { ChevronDown, Repeat } from "lucide-react";
import { RECURRENCE_UNITS, type RecurrenceUnit } from "@/lib/recurrence";

interface RecurrenceDefaults {
  is_recurring?: boolean;
  recurrence_interval?: number | null;
  recurrence_unit?: RecurrenceUnit | string | null;
  recurrence_end_date?: string | null;
}

const inputClass =
  "w-full px-3.5 py-2.5 border border-milestone-line dark:border-white/[0.12] rounded-lg text-sm font-medium bg-white dark:bg-[#0f2032] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-milestone-blue";
const labelClass =
  "block text-xs font-bold text-gray-500 dark:text-white/40 uppercase tracking-wide mb-1.5";

export default function RecurrenceFields({
  defaults,
  compact = false,
}: {
  defaults?: RecurrenceDefaults;
  compact?: boolean;
}) {
  const [recurring, setRecurring] = useState(defaults?.is_recurring ?? false);

  return (
    <div className={compact ? "space-y-3" : "space-y-4 rounded-xl border border-milestone-line dark:border-white/[0.08] p-4 bg-gray-50/60 dark:bg-white/[0.03]"}>
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={recurring}
          onChange={(e) => setRecurring(e.target.checked)}
          className="h-4 w-4 rounded border-milestone-line text-milestone-blue focus:ring-milestone-blue"
        />
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-white/80">
          <Repeat size={14} className="text-milestone-blue" />
          Recurring goal
        </span>
      </label>
      <input type="hidden" name="is_recurring" value={recurring ? "true" : "false"} />

      {recurring && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className={labelClass}>Repeat every</label>
            <div className="flex gap-2">
              <input
                name="recurrence_interval"
                type="number"
                min={1}
                max={365}
                defaultValue={defaults?.recurrence_interval ?? 1}
                required={recurring}
                className={`${inputClass} w-20 shrink-0`}
              />
              <div className="relative flex-1">
                <select
                  name="recurrence_unit"
                  defaultValue={(defaults?.recurrence_unit as RecurrenceUnit) ?? "week"}
                  required={recurring}
                  className={`${inputClass} appearance-none pr-8`}
                >
                  {RECURRENCE_UNITS.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30 pointer-events-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>Repeat until</label>
            <input
              name="recurrence_end_date"
              type="date"
              defaultValue={defaults?.recurrence_end_date ?? ""}
              className={inputClass}
            />
            <p className="text-[11px] text-gray-400 dark:text-white/35 mt-1">
              Leave blank to repeat indefinitely
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
