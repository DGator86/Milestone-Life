"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Star, Trophy, Check, Plus, Briefcase } from "lucide-react";
import { calcProgress, getGoalHealth, type GoalHealth } from "@/lib/progress";
import { toggleGoalPinned } from "@/app/dashboard/task-actions";
import { buildMailtoLink, isEmailMilestone } from "@/lib/milestoneEmail";
import type { GoalWithDetails, Milestone } from "@/lib/types";

const HEALTH_META: Record<GoalHealth, { label: string; cls: string }> = {
  on_track: { label: "On Track", cls: "text-milestone-green" },
  at_risk: { label: "At Risk", cls: "text-milestone-amber" },
  waiting: { label: "Waiting", cls: "text-milestone-blue" },
};

function fmtDate(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function dotState(ms: Milestone, milestones: Milestone[]) {
  if (ms.status === "completed") return "done" as const;
  if (ms.status === "stuck") return "stuck" as const;
  const firstOpen = milestones.find((m) => m.status !== "completed");
  if (firstOpen && firstOpen.id === ms.id) return "current" as const;
  return "upcoming" as const;
}

function Journey({ goal, milestones }: { goal: GoalWithDetails; milestones: Milestone[] }) {
  if (milestones.length === 0) {
    return <p className="text-xs text-gray-300 mt-4">No milestones yet.</p>;
  }

  return (
    <div className="mt-5 -mx-1 overflow-x-auto no-scrollbar md:mx-0 md:overflow-visible">
    <div className="flex items-start gap-1 min-w-max md:min-w-0 md:w-full pr-2 md:pr-0">
      {/* START */}
      <div className="flex flex-col items-center shrink-0 pt-1">
        <span className="text-[10px] font-medium text-gray-400">
          Start
        </span>
        <div className="h-5 w-px" />
      </div>

      {/* Track */}
      <div className="relative flex-1 min-w-0">
        <div className="flex items-start justify-between">
          {milestones.map((ms, i) => {
            const state = dotState(ms, milestones);
            const isLast = i === milestones.length - 1;
            const nextDone =
              !isLast && ms.status === "completed" && milestones[i + 1].status === "completed";

            return (
              <div
                key={ms.id}
                className={`relative flex flex-col items-center text-center shrink-0 ${milestones.length > 4 ? "w-[72px]" : ""}`}
                style={milestones.length > 4 ? undefined : { width: `${100 / milestones.length}%`, minWidth: 0 }}
              >
                {/* connector to next */}
                {!isLast && (
                  <span
                    className="absolute top-[14px] left-1/2 h-0.5"
                    style={{
                      width: "100%",
                      backgroundColor: nextDone ? "#36A852" : "var(--ms-line)",
                      zIndex: 0,
                    }}
                  />
                )}
                {/* dot */}
                <div
                  className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 ${
                    state === "done"
                      ? "bg-milestone-green border-milestone-green text-white"
                      : state === "current"
                      ? "bg-milestone-blue border-milestone-blue text-white ring-4 ring-milestone-blue/15"
                      : state === "stuck"
                      ? "bg-milestone-red border-milestone-red text-white"
                      : "bg-white dark:bg-white/12 border-gray-200 dark:border-white/25 text-gray-500 dark:text-white/75"
                  }`}
                >
                  {state === "done" ? <Check size={13} strokeWidth={3} /> : i + 1}
                </div>
                {/* label */}
                {(() => {
                  const mailto = isEmailMilestone(ms.title)
                    ? buildMailtoLink(ms.title, { goal })
                    : null;
                  const cls = `mt-1.5 text-[11px] leading-tight px-0.5 line-clamp-2 block ${
                    state === "current"
                      ? "font-semibold text-gray-900 dark:text-white"
                      : state === "done"
                      ? "text-gray-500 dark:text-white/40"
                      : "text-gray-500 dark:text-white/55"
                  } ${mailto ? "text-milestone-blue hover:underline" : "hover:text-milestone-blue"}`;
                  if (mailto) {
                    return (
                      <a href={mailto} className={cls} onClick={(e) => e.stopPropagation()}>
                        {ms.title}
                      </a>
                    );
                  }
                  return (
                    <Link href={`/goals/${goal.id}`} className={cls}>
                      {ms.title}
                    </Link>
                  );
                })()}
                {ms.due_date && (
                  <span className="text-[10px] text-gray-400 mt-0.5">{fmtDate(ms.due_date)}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* DESTINATION */}
      <div className="flex flex-col items-center shrink-0 pl-1">
        <div className="w-7 h-7 rounded-full bg-milestone-amber-dim flex items-center justify-center">
          <Trophy size={14} className="text-milestone-amber" />
        </div>
        <span className="mt-1.5 text-[10px] font-medium text-gray-400">
          Goal
        </span>
      </div>
    </div>
    </div>
  );
}

function GoalCard({ goal }: { goal: GoalWithDetails }) {
  const [isPending, startTransition] = useTransition();
  const milestones = goal.milestones ?? [];
  const progress = calcProgress(milestones);
  const health = HEALTH_META[getGoalHealth(goal)];
  const accent =
    health.label === "At Risk" ? "#F8B400" : health.label === "Waiting" ? "#1769FF" : "#36A852";

  function toggleStar() {
    startTransition(() => toggleGoalPinned(goal.id, !goal.pinned));
  }

  return (
    <div
      className="ms-card-app p-4 border-l-[3px]"
      style={{ borderLeftColor: accent, opacity: isPending ? 0.6 : 1 }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${accent}1A` }}
          >
            <Briefcase size={16} style={{ color: accent }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/goals/${goal.id}`}
                className="font-semibold text-gray-900 dark:text-white hover:text-milestone-blue transition-colors truncate text-[15px] sm:text-sm"
              >
                {goal.title}
              </Link>
              <button
                onClick={toggleStar}
                className="ms-touch-icon shrink-0 -mr-2"
                aria-label={goal.pinned ? "Unpin goal" : "Pin goal"}
              >
                <Star
                  size={16}
                  className={goal.pinned ? "text-milestone-amber" : "text-gray-300"}
                  fill={goal.pinned ? "#F8B400" : "none"}
                />
              </button>
            </div>
            {goal.groups?.name && (
              <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">{goal.groups.name}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6 sm:gap-5 shrink-0 pl-12 sm:pl-0">
          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Progress</p>
            <p className="text-milestone-blue font-bold text-base sm:text-sm">{progress}%</p>
          </div>
          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Health</p>
            <p className={`font-bold text-base sm:text-sm ${health.cls}`}>{health.label}</p>
          </div>
        </div>
      </div>

      <Journey goal={goal} milestones={milestones} />
    </div>
  );
}

export default function CriticalPaths({
  goals,
  onNewGoal,
}: {
  goals: GoalWithDetails[];
  onNewGoal?: () => void;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">Active goals</h2>
          <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5 hidden sm:block">Track progress on what you&apos;re closing</p>
        </div>
        <button
          onClick={onNewGoal}
          className="ms-btn-primary shrink-0 min-h-[44px] touch-manipulation"
        >
          <Plus size={14} strokeWidth={2.5} />
          New
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="ms-empty">
          <Trophy size={28} className="mx-auto mb-2 text-gray-200" />
          <p className="text-sm text-gray-500">No active goals yet.</p>
          <p className="text-xs text-gray-400 mt-1">Create a goal to map its path.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
          <Link
            href="/goals"
            className="block text-center text-sm font-medium text-milestone-blue hover:underline pt-1"
          >
            View all goals →
          </Link>
        </div>
      )}
    </section>
  );
}
