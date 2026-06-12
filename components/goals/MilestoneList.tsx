"use client";

import { useState, useTransition } from "react";
import { CheckCircle, Plus, Trash2, ChevronDown } from "lucide-react";
import { updateMilestoneStatus, addMilestone, deleteMilestone } from "@/app/goals/actions";
import type { GoalWithDetails, Milestone, MilestoneStatus } from "@/lib/types";

const STATUS_CONFIG: Record<
  MilestoneStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  upcoming: {
    label: "Upcoming",
    bg: "bg-gray-100",
    text: "text-gray-500",
    dot: "bg-gray-300",
  },
  in_progress: {
    label: "In Progress",
    bg: "bg-milestone-blue-dim",
    text: "text-milestone-blue",
    dot: "bg-milestone-blue",
  },
  waiting: {
    label: "Waiting",
    bg: "bg-blue-50",
    text: "text-blue-400",
    dot: "bg-blue-300",
  },
  stuck: {
    label: "Stuck",
    bg: "bg-milestone-red-dim",
    text: "text-milestone-red",
    dot: "bg-milestone-red",
  },
  completed: {
    label: "Completed",
    bg: "bg-milestone-green-dim",
    text: "text-milestone-green",
    dot: "bg-milestone-green",
  },
};

const ALL_STATUSES: MilestoneStatus[] = [
  "upcoming",
  "in_progress",
  "waiting",
  "stuck",
  "completed",
];

function MilestoneRow({
  ms,
  goalId,
  index,
  isCurrent,
}: {
  ms: Milestone;
  goalId: string;
  index: number;
  isCurrent: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [deleting, startDeleteTransition] = useTransition();
  const cfg = STATUS_CONFIG[ms.status] ?? STATUS_CONFIG.upcoming;

  function handleStatusChange(newStatus: MilestoneStatus) {
    if (newStatus === ms.status) return;
    startTransition(async () => {
      await updateMilestoneStatus(ms.id, newStatus, goalId);
    });
  }

  function handleDelete() {
    if (!confirm(`Delete milestone "${ms.title}"?`)) return;
    startDeleteTransition(async () => {
      await deleteMilestone(ms.id, goalId);
    });
  }

  return (
    <div
      className={`px-4 py-3.5 border-b border-milestone-line dark:border-white/[0.06] last:border-0 hover:bg-gray-50/40 dark:hover:bg-white/[0.03] transition-colors ${
        pending || deleting ? "opacity-50 pointer-events-none" : ""
      } ${isCurrent ? "bg-milestone-blue-dim/35 dark:bg-milestone-blue/10" : ""}`}
    >
      <div className="flex items-start sm:items-center gap-3">
        {/* Position badge */}
        <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/[0.07] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
          <span className="text-[11px] font-bold text-gray-400 dark:text-white/40 tabular-nums">{index + 1}</span>
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          {isCurrent && (
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-milestone-blue">
              Current
            </p>
          )}
          <p
            className={`text-sm font-medium leading-snug ${
              ms.status === "completed" ? "text-gray-400 dark:text-white/30 line-through" : "text-gray-800 dark:text-white"
            }`}
          >
            {ms.title}
          </p>
          {ms.due_date && (
            <p className="text-xs text-gray-400 mt-0.5 sm:hidden">
              Due{" "}
              {new Date(ms.due_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </p>
          )}
        </div>

        {/* Due date */}
        {ms.due_date && (
          <span className="text-xs text-gray-400 shrink-0 tabular-nums hidden sm:block">
            {new Date(ms.due_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}

        {/* Status select */}
        <div
          className={`relative hidden sm:flex items-center gap-1.5 pl-2.5 pr-6 py-1.5 rounded-lg text-xs font-semibold shrink-0 ${cfg.bg} ${cfg.text}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
          <select
            value={ms.status}
            onChange={(e) => handleStatusChange(e.target.value as MilestoneStatus)}
            disabled={pending}
            className="bg-transparent appearance-none cursor-pointer focus:outline-none"
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_CONFIG[s].label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={10}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none"
          />
        </div>

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="ms-touch-icon -mr-3 -mt-2 sm:m-0 sm:min-h-0 sm:min-w-0 sm:p-1.5 text-gray-200 hover:text-milestone-red transition-colors shrink-0"
          title="Delete milestone"
          aria-label="Delete milestone"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="mt-3 ml-9 grid grid-cols-[1fr_auto] gap-2 sm:hidden">
        {ms.status !== "completed" ? (
          <button
            type="button"
            onClick={() => handleStatusChange("completed")}
            className="min-h-[44px] rounded-xl bg-milestone-blue px-4 text-sm font-semibold text-white active:bg-blue-600 transition-colors touch-manipulation"
          >
            <CheckCircle size={16} className="inline-block mr-1.5" />
            Mark done
          </button>
        ) : (
          <div className="min-h-[44px] rounded-xl bg-milestone-green-dim px-4 text-sm font-semibold text-milestone-green flex items-center justify-center">
            Completed
          </div>
        )}
        <div className={`relative flex min-h-[44px] items-center rounded-xl px-3 pr-8 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
          <select
            aria-label="Milestone status"
            value={ms.status}
            onChange={(e) => handleStatusChange(e.target.value as MilestoneStatus)}
            disabled={pending}
            className="bg-transparent appearance-none cursor-pointer focus:outline-none"
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_CONFIG[s].label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
}

function AddMilestoneForm({ goalId }: { goalId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full min-h-[44px] px-4 py-3 text-sm text-gray-400 hover:text-milestone-blue hover:bg-milestone-blue-dim transition-all border-t border-milestone-line touch-manipulation"
      >
        <Plus size={14} />
        <span className="font-medium">Add milestone</span>
      </button>
    );
  }

  return (
    <form
      action={async (fd) => {
        startTransition(async () => {
          await addMilestone(goalId, fd);
          setOpen(false);
        });
      }}
      className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2.5 border-t border-milestone-line bg-gray-50/50"
    >
      <input
        name="title"
        autoFocus
        required
        placeholder="Milestone title…"
        className="w-full sm:flex-1 min-h-[44px] px-3 py-2 text-sm border border-milestone-line rounded-lg focus:outline-none focus:ring-2 focus:ring-milestone-blue placeholder:text-gray-300 bg-white"
      />
      <button
        type="submit"
        disabled={pending}
        className="w-full sm:w-auto min-h-[44px] px-3.5 py-2 text-sm font-semibold bg-milestone-blue text-white rounded-lg hover:bg-blue-600 transition-colors shrink-0"
      >
        Add
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="w-full sm:w-auto min-h-[44px] px-3.5 py-2 text-sm font-semibold bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors shrink-0"
      >
        Cancel
      </button>
    </form>
  );
}

export default function MilestoneList({ goal }: { goal: GoalWithDetails }) {
  const milestones = goal.milestones ?? [];
  const currentMilestoneId = milestones.find((ms) => ms.status !== "completed")?.id;

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
        Milestones
        <span className="ml-2 font-semibold text-gray-300">{milestones.length}</span>
      </p>
      <div className="bg-white dark:bg-[#0B1929] rounded-xl shadow-card border border-milestone-line dark:border-white/[0.08] overflow-hidden">
        {milestones.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-gray-400">No milestones yet.</p>
          </div>
        ) : (
          milestones.map((ms, i) => (
            <MilestoneRow
              key={ms.id}
              ms={ms}
              goalId={goal.id}
              index={i}
              isCurrent={ms.id === currentMilestoneId}
            />
          ))
        )}
        <AddMilestoneForm goalId={goal.id} />
      </div>
    </div>
  );
}
