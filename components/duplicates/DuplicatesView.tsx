"use client";

import { useState, useTransition } from "react";
import { GitMerge, Trash2, Building2, UserRound } from "lucide-react";
import type { DuplicateGroup } from "@/lib/crm/duplicates";
import { mergeCustomers, mergeContacts, deleteDuplicateRecord } from "@/app/duplicates/actions";
import { useToast } from "@/lib/toast-context";

export default function DuplicatesView({ groups }: { groups: DuplicateGroup[] }) {
  const [isPending, startTransition] = useTransition();
  const { show } = useToast();
  const [keepIds, setKeepIds] = useState<Record<string, string>>(() =>
    Object.fromEntries(groups.map((g) => [g.key, g.records[0]?.id ?? ""])),
  );

  function run(action: () => Promise<{ error?: string; success?: boolean }>) {
    startTransition(async () => {
      const result = await action();
      if (result.error) show(result.error, "error");
      else show("Updated", "success");
    });
  }

  if (groups.length === 0) {
    return (
      <div className="ms-card p-10 text-center">
        <p className="text-sm font-medium text-gray-500">No duplicates found.</p>
        <p className="text-xs text-gray-400 mt-1">Companies and contacts look clean.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" style={{ opacity: isPending ? 0.7 : 1 }}>
      {groups.map((group) => {
        const keepId = keepIds[group.key] ?? group.records[0]?.id;
        const Icon = group.entity === "customer" ? Building2 : UserRound;
        return (
          <div key={group.key} className="ms-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-milestone-line bg-gray-50/60 dark:bg-white/[0.03] flex items-center gap-2">
              <Icon size={15} className="text-milestone-blue shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{group.reason}</p>
                <p className="text-xs text-gray-400">{group.records.length} records</p>
              </div>
            </div>
            <div className="divide-y divide-milestone-line/70">
              {group.records.map((record) => (
                <div key={record.id} className="px-5 py-3 flex items-center gap-3">
                  <input
                    type="radio"
                    name={`keep-${group.key}`}
                    checked={keepId === record.id}
                    onChange={() => setKeepIds((prev) => ({ ...prev, [group.key]: record.id }))}
                    className="accent-milestone-blue"
                    aria-label={`Keep ${record.label}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{record.label}</p>
                    {record.subtitle && (
                      <p className="text-xs text-gray-400 truncate">{record.subtitle}</p>
                    )}
                    {record.email && (
                      <p className="text-xs text-gray-400 truncate">{record.email}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!window.confirm(`Delete “${record.label}”? This cannot be undone.`)) return;
                      run(() => deleteDuplicateRecord(group.entity, record.id));
                    }}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-milestone-red hover:bg-milestone-red-dim transition-colors"
                    title="Delete this record"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            {group.records.length > 1 && keepId && (
              <div className="px-5 py-3 border-t border-milestone-line bg-gray-50/40 dark:bg-white/[0.02]">
                <button
                  type="button"
                  disabled={!keepId}
                  onClick={() => {
                    const losers = group.records.filter((r) => r.id !== keepId);
                    if (!losers.length) return;
                    if (
                      !window.confirm(
                        `Merge ${losers.length} duplicate${losers.length === 1 ? "" : "s"} into the selected record?`,
                      )
                    ) {
                      return;
                    }
                    run(async () => {
                      for (const loser of losers) {
                        const result =
                          group.entity === "customer"
                            ? await mergeCustomers(keepId, loser.id)
                            : await mergeContacts(keepId, loser.id);
                        if (result.error) return result;
                      }
                      return { success: true };
                    });
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-milestone-blue hover:underline disabled:opacity-50"
                >
                  <GitMerge size={14} />
                  Merge into selected
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
