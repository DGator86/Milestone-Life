"use client";

import { useState, useTransition, useEffect } from "react";
import { Pencil, ChevronDown, X } from "lucide-react";
import { updateGoal } from "@/app/goals/actions";
import RecurrenceFields from "@/components/goals/RecurrenceFields";
import type { GoalWithDetails, Group } from "@/lib/types";

export default function EditGoalPanel({
  goal,
  groups,
}: {
  goal: GoalWithDetails;
  groups: Group[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-500 dark:text-white/50 bg-gray-100 dark:bg-white/[0.07] rounded-lg hover:bg-gray-200 dark:hover:bg-white/[0.12] transition-colors"
      >
        <Pencil size={12} />
        Edit
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-goal-title"
        className="bg-white dark:bg-[#0B1929] rounded-2xl shadow-card-lg border border-milestone-line dark:border-white/[0.08] w-full max-w-md animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-milestone-line dark:border-white/[0.08]">
          <h2 id="edit-goal-title" className="text-sm font-bold text-gray-900 dark:text-white">Edit Goal</h2>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/70 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form
          action={async (fd) => {
            startTransition(async () => {
              await updateGoal(goal.id, null, fd);
              setOpen(false);
            });
          }}
          className="p-6 space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-white/40 uppercase tracking-wide mb-1.5">
              Title
            </label>
            <input
              name="title"
              defaultValue={goal.title}
              required
              className="w-full px-3.5 py-2.5 border border-milestone-line dark:border-white/[0.12] rounded-lg text-sm font-medium bg-white dark:bg-[#0f2032] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-milestone-blue placeholder:text-gray-300 dark:placeholder:text-white/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-white/40 uppercase tracking-wide mb-1.5">
                Group
              </label>
              <div className="relative">
                <select
                  name="group_id"
                  defaultValue={goal.group_id}
                  className="w-full px-3.5 py-2.5 border border-milestone-line dark:border-white/[0.12] rounded-lg text-sm font-medium bg-white dark:bg-[#0f2032] text-gray-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-milestone-blue"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30 pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-white/40 uppercase tracking-wide mb-1.5">
                Type
              </label>
              <div className="relative">
                <select
                  name="goal_type"
                  defaultValue={goal.goal_type}
                  className="w-full px-3.5 py-2.5 border border-milestone-line dark:border-white/[0.12] rounded-lg text-sm font-medium bg-white dark:bg-[#0f2032] text-gray-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-milestone-blue"
                >
                  <option value="concrete">Concrete</option>
                  <option value="touches">Touches</option>
                  <option value="deadline">Deadline</option>
                  <option value="maintenance">Maintenance</option>
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30 pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-white/40 uppercase tracking-wide mb-1.5">
                Importance
              </label>
              <div className="relative">
                <select
                  name="importance"
                  defaultValue={goal.importance}
                  className="w-full px-3.5 py-2.5 border border-milestone-line dark:border-white/[0.12] rounded-lg text-sm font-medium bg-white dark:bg-[#0f2032] text-gray-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-milestone-blue"
                >
                  <option value="normal">Normal</option>
                  <option value="important">Important</option>
                  <option value="critical">Critical</option>
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30 pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-white/40 uppercase tracking-wide mb-1.5">
                Due Date
              </label>
              <input
                name="due_date"
                type="date"
                defaultValue={goal.due_date ?? ""}
                className="w-full px-3.5 py-2.5 border border-milestone-line dark:border-white/[0.12] rounded-lg text-sm font-medium bg-white dark:bg-[#0f2032] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-milestone-blue"
              />
            </div>
          </div>

          <RecurrenceFields
            defaults={{
              is_recurring: goal.is_recurring,
              recurrence_interval: goal.recurrence_interval,
              recurrence_unit: goal.recurrence_unit,
              recurrence_end_date: goal.recurrence_end_date,
            }}
          />

          <div className="flex gap-2.5 pt-1">
            <button
              type="submit"
              disabled={pending}
              className="bg-milestone-blue text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="bg-gray-100 dark:bg-white/[0.07] text-gray-600 dark:text-white/60 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-200 dark:hover:bg-white/[0.12] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
