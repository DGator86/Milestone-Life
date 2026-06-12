"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, ChevronDown } from "lucide-react";
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
}: {
  ms: Milestone;
  goalId: string;
  index: number;
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
      className={`flex items-center gap-3 px-4 py-3.5 border-b border-milestone-line dark:border-white/[0.06] last:border-0 hover:bg-gray-50/40 dark:hover:bg-white/[0.03] transition-colors ${
        pending || deleting ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      {/* Position badge */}
      <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/[0.07] flex items-center justify-center shrink-0">
        <span className="text-[11px] font-bold text-gray-400 dark:text-white/40 tabular-nums">{index + 1}</span>
      </div>

      {/* Title */}
      <p
        className={`flex-1 text-sm font-medium leading-snug ${
          ms.status === "completed" ? "text-gray-400 dark:text-white/30 line-through" : "text-gray-800 dark:text-white"
        }`}
      >
        {ms.title}
      </p>

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
        className={`relative flex items-center gap-1.5 pl-2.5 pr-6 py-1.5 rounded-lg text-xs font-semibold shrink-0 ${cfg.bg} ${cfg.text}`}
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
        className="text-gray-200 hover:text-milestone-red transition-colors shrink-0"
        title="Delete milestone"
      >
        <Trash2 size={14} />
      </button>
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
        className="flex items-center gap-2 w-full px-4 py-3 text-sm text-gray-400 hover:text-milestone-blue hover:bg-milestone-blue-dim transition-all border-t border-milestone-line"
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
      className="px-4 py-3 flex items-center gap-2.5 border-t border-milestone-line bg-gray-50/50"
    >
      <input
        name="title"
        autoFocus
        required
        placeholder="Milestone title…"
        className="flex-1 px-3 py-2 text-sm border border-milestone-line rounded-lg focus:outline-none focus:ring-2 focus:ring-milestone-blue placeholder:text-gray-300 bg-white"
      />
      <button
        type="submit"
        disabled={pending}
        className="px-3.5 py-2 text-sm font-semibold bg-milestone-blue text-white rounded-lg hover:bg-blue-600 transition-colors shrink-0"
      >
        Add
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="px-3.5 py-2 text-sm font-semibold bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors shrink-0"
      >
        Cancel
      </button>
    </form>
  );
}

export default function MilestoneList({ goal }: { goal: GoalWithDetails }) {
  const milestones = goal.milestones ?? [];

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
            <MilestoneRow key={ms.id} ms={ms} goalId={goal.id} index={i} />
          ))
        )}
        <AddMilestoneForm goalId={goal.id} />
      </div>
    </div>
  );
}
