"use client";

import { useState, useActionState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Circle,
  Pencil,
  Archive,
  Trash2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Briefcase,
  Home,
  Heart,
  Target,
  ChevronDown as ChevronDownIcon,
} from "lucide-react";
import { getNextMilestone } from "@/lib/progress";
import { calcProgress } from "@/lib/progress";
import { updateGoal, archiveGoal, deleteGoal, reactivateGoal } from "./actions";
import RecurrenceFields from "@/components/goals/RecurrenceFields";
import { useToast } from "@/lib/toast-context";
import { confirmDestructive } from "@/lib/confirmDestructive";
import type { GoalWithDetails, Group } from "@/lib/types";

const GROUP_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Work: Briefcase,
  Home: Home,
  Health: Heart,
};

const IMPORTANCE_COLORS: Record<string, string> = {
  critical: "bg-milestone-red-dim text-milestone-red",
  important: "bg-milestone-amber-dim text-milestone-amber",
  normal: "bg-gray-100 text-gray-500",
};

const IMPORTANCE_OPTIONS = [
  { value: "normal", label: "Normal", dot: "bg-gray-400" },
  { value: "important", label: "Important", dot: "bg-milestone-amber" },
  { value: "critical", label: "Critical", dot: "bg-milestone-red" },
] as const;

function EditForm({
  goal,
  groups,
  onClose,
}: {
  goal: GoalWithDetails;
  groups: Group[];
  onClose: () => void;
}) {
  const { show } = useToast();
  const [importance, setImportance] = useState(goal.importance);

  const boundAction = updateGoal.bind(null, goal.id);
  const [state, action, isPending] = useActionState(boundAction, null);

  // Close on success
  useEffect(() => {
    if (state?.success) {
      show("Goal updated!", "success");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  return (
    <div className="px-5 pb-5 pt-3 bg-gray-50/60 border-t border-milestone-line animate-fade-up">
      <form action={action} className="space-y-4">
        {state?.error && (
          <p className="text-xs text-milestone-red bg-milestone-red-dim px-3 py-2 rounded-lg">
            {state.error}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">
              Title
            </label>
            <input
              name="title"
              defaultValue={goal.title}
              required
              className="w-full px-3 py-2 border border-milestone-line rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-milestone-blue focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">
              Group
            </label>
            <div className="relative">
              <select
                name="group_id"
                defaultValue={goal.group_id}
                className="w-full px-3 py-2 border border-milestone-line rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-milestone-blue focus:border-transparent bg-white appearance-none"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <ChevronDownIcon size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">
              Type
            </label>
            <div className="relative">
              <select
                name="goal_type"
                defaultValue={goal.goal_type}
                className="w-full px-3 py-2 border border-milestone-line rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-milestone-blue focus:border-transparent bg-white appearance-none"
              >
                <option value="concrete">Concrete</option>
                <option value="touches">Touches</option>
                <option value="deadline">Deadline</option>
                <option value="maintenance">Maintenance</option>
              </select>
              <ChevronDownIcon size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">
              Due Date
            </label>
            <input
              name="due_date"
              type="date"
              defaultValue={goal.due_date ?? ""}
              className="w-full px-3 py-2 border border-milestone-line rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-milestone-blue focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">
              Importance
            </label>
            <input type="hidden" name="importance" value={importance} />
            <div className="flex gap-1.5 h-9">
              {IMPORTANCE_OPTIONS.map(({ value, label, dot }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setImportance(value)}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    importance === value
                      ? "border-milestone-blue bg-milestone-blue-dim text-milestone-blue ring-1 ring-milestone-blue"
                      : "border-milestone-line text-gray-400 hover:border-gray-300"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <RecurrenceFields
          compact
          defaults={{
            is_recurring: goal.is_recurring,
            recurrence_interval: goal.recurrence_interval,
            recurrence_unit: goal.recurrence_unit,
            recurrence_end_date: goal.recurrence_end_date,
          }}
        />

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="bg-milestone-blue text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function GoalRow({
  goal,
  groups,
}: {
  goal: GoalWithDetails;
  groups: Group[];
}) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { show } = useToast();
  const progress = calcProgress(goal.milestones ?? []);
  const GroupIcon = GROUP_ICONS[goal.groups?.name ?? ""] ?? Target;
  const milestones = goal.milestones ?? [];
  const next = getNextMilestone(milestones);

  function handleArchive() {
    startTransition(async () => {
      const result = await archiveGoal(goal.id);
      if (result.error) show(result.error, "error");
      else {
        show("Goal archived", "info");
        router.refresh();
      }
    });
  }

  function handleReactivate() {
    startTransition(async () => {
      const result = await reactivateGoal(goal.id);
      if (result.error) show(result.error, "error");
      else {
        show("Goal reactivated!", "success");
        router.refresh();
      }
    });
  }

  function handleDelete() {
    if (
      !confirmDestructive(
        `Delete "${goal.title}"? This removes the goal and all its milestones permanently.`
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteGoal(goal.id);
      if (result.error) show(result.error, "error");
      else {
        show("Goal deleted", "info");
        router.refresh();
      }
    });
  }

  return (
    <div className={`border-b border-milestone-line last:border-0 ${isPending ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 dark:hover:bg-white/[0.03] transition-colors">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 p-0.5 rounded text-gray-300 dark:text-white/30 hover:text-milestone-blue dark:hover:text-milestone-blue transition-colors"
          aria-label={expanded ? "Collapse goal preview" : "Expand goal preview"}
          aria-expanded={expanded}
        >
          <ChevronRight
            size={16}
            className={`transition-transform ${expanded ? "rotate-90" : ""}`}
          />
        </button>

        {/* Status icon */}
        <div className="shrink-0">
          {goal.status === "completed" ? (
            <CheckCircle size={18} className="text-milestone-green" />
          ) : goal.status === "archived" ? (
            <Archive size={18} className="text-gray-300" />
          ) : (
            <Circle size={18} className="text-gray-200" />
          )}
        </div>

        {/* Goal info */}
        <div className="flex-1 min-w-0">
          <Link
            href={`/goals/${goal.id}`}
            className="font-semibold text-gray-900 text-sm truncate block hover:text-milestone-blue transition-colors"
          >
            {goal.title}
          </Link>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <GroupIcon size={11} className="text-gray-400 shrink-0" />
            <span className="text-xs text-gray-400">{goal.groups?.name}</span>
            <span className="text-gray-200">·</span>
            <span className="text-xs text-gray-400 capitalize">{goal.goal_type}</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded capitalize ${
                IMPORTANCE_COLORS[goal.importance ?? "normal"]
              }`}
            >
              {goal.importance}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="shrink-0 flex items-center gap-2 min-w-[88px]">
          <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                backgroundColor:
                  goal.status === "completed"
                    ? "#36A852"
                    : progress > 50
                    ? "#1769FF"
                    : "#F8B400",
              }}
            />
          </div>
          <span className="text-xs font-bold text-gray-700 tabular-nums w-8 text-right">
            {progress}%
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {goal.status === "archived" ? (
            <button
              type="button"
              onClick={handleReactivate}
              title="Reactivate"
              aria-label="Reactivate goal"
              className="p-1.5 rounded-lg text-gray-300 dark:text-white/35 hover:text-milestone-green hover:bg-milestone-green-dim transition-colors"
            >
              <RotateCcw size={14} />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setEditing((e) => !e)}
                title="Edit"
                aria-label="Edit goal"
                className={`p-1.5 rounded-lg transition-colors ${
                  editing
                    ? "text-milestone-blue bg-milestone-blue-dim"
                    : "text-gray-300 dark:text-white/35 hover:text-milestone-blue hover:bg-milestone-blue-dim"
                }`}
              >
                {editing ? <ChevronUp size={14} /> : <Pencil size={14} />}
              </button>
              {goal.status === "active" && (
                <button
                  type="button"
                  onClick={handleArchive}
                  title="Archive"
                  aria-label="Archive goal"
                  className="p-1.5 rounded-lg text-gray-300 dark:text-white/35 hover:text-milestone-amber hover:bg-milestone-amber-dim transition-colors"
                >
                  <Archive size={14} />
                </button>
              )}
            </>
          )}
          <button
            type="button"
            onClick={handleDelete}
            title="Delete goal"
            aria-label="Delete goal"
            className="p-1.5 rounded-lg text-gray-300 dark:text-white/35 hover:text-milestone-red hover:bg-milestone-red-dim transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {expanded && !editing && (
        <div className="px-5 pb-4 pt-1 bg-gray-50/50 border-t border-milestone-line animate-fade-up">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-gray-500">
              {next ? (
                <>
                  Next: <span className="font-semibold text-gray-700">{next.title}</span>
                  {next.due_date && (
                    <span className="text-gray-400"> · due {next.due_date}</span>
                  )}
                </>
              ) : (
                "All milestones complete"
              )}
            </p>
            <Link
              href={`/goals/${goal.id}`}
              className="text-xs font-semibold text-milestone-blue hover:underline shrink-0"
            >
              Open full detail →
            </Link>
          </div>
        </div>
      )}

      {editing && (
        <EditForm goal={goal} groups={groups} onClose={() => setEditing(false)} />
      )}
    </div>
  );
}

export function GoalsList({
  goals,
  groups,
}: {
  goals: GoalWithDetails[];
  groups: Group[];
}) {
  const sections = [
    { label: "Active", items: goals.filter((g) => g.status === "active") },
    { label: "Completed", items: goals.filter((g) => g.status === "completed") },
    { label: "Archived", items: goals.filter((g) => g.status === "archived") },
  ].filter((s) => s.items.length > 0);

  if (goals.length === 0) {
    return (
      <div className="ms-card p-14 text-center">
        <Target size={40} className="mx-auto mb-3 text-gray-200" />
        <p className="text-sm font-medium text-gray-400">No goals yet.</p>
        <p className="text-xs text-gray-300 mt-1">
          Head to the dashboard to create your first goal.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.label}>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
            {section.label}
            <span className="ml-2 font-semibold text-gray-300">{section.items.length}</span>
          </p>
          <div className="ms-card">
            {section.items.map((goal) => (
              <GoalRow key={goal.id} goal={goal} groups={groups} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
