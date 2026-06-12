"use client";

import { useTransition } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle } from "lucide-react";
import { buildMailtoLink, isEmailMilestone } from "@/lib/milestoneEmail";
import { getTopFocus } from "@/lib/progress";
import { completeMilestone } from "@/app/dashboard/actions";
import type { GoalWithDetails } from "@/lib/types";

function urgencyBadge(dateStr: string | null): { text: string; cls: string } | null {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const t0 = new Date();
  t0.setHours(0, 0, 0, 0);
  const days = Math.round((date.getTime() - t0.getTime()) / 86400000);
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, cls: "bg-milestone-red/15 text-milestone-red" };
  if (days === 0) return { text: "Due today", cls: "bg-milestone-amber/15 text-milestone-amber" };
  if (days <= 2) return { text: `${days}d left`, cls: "bg-milestone-amber/15 text-milestone-amber" };
  return null;
}

interface Props {
  goals: GoalWithDetails[];
  onNewGoal?: () => void;
}

export default function FocusToday({ goals, onNewGoal }: Props) {
  const [isPending, startTransition] = useTransition();
  const items = getTopFocus(goals, 3);

  function handleComplete(milestoneId: string, goalId: string) {
    startTransition(() => completeMilestone(milestoneId, goalId));
  }

  if (items.length === 0) {
    return (
      <section className="ms-card-app px-5 py-10 text-center">
        <p className="text-gray-400 dark:text-white/40 text-sm mb-4">No active goals yet.</p>
        <button
          onClick={onNewGoal}
          className="ms-btn-primary w-full sm:w-auto justify-center min-h-[44px] px-5"
        >
          Create your first goal <ArrowRight size={13} />
        </button>
      </section>
    );
  }

  const [first, ...rest] = items;
  const badge = urgencyBadge(first.milestone.due_date);

  return (
    <section className="ms-card-app overflow-hidden" style={{ opacity: isPending ? 0.75 : 1 }}>
      {/* ── Hero: #1 ranked action ── */}
      <div className="px-4 py-5 sm:py-4 border-b border-milestone-line dark:border-white/[0.06] bg-gradient-to-r from-milestone-navy to-[#0d2040]">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-2">
          Up next
        </p>
        <p className="text-xs text-white/50 mb-1.5 truncate">
          {first.goal.title}
        </p>
        {(() => {
          const mailto = isEmailMilestone(first.milestone.title)
            ? buildMailtoLink(first.milestone.title, { goal: first.goal })
            : null;
          if (mailto) {
            return (
              <a
                href={mailto}
                className="text-[17px] sm:text-lg font-semibold text-white leading-snug mb-4 block hover:underline"
              >
                {first.milestone.title}
              </a>
            );
          }
          return (
            <Link
              href={`/goals/${first.goal.id}`}
              className="text-[17px] sm:text-lg font-semibold text-white leading-snug mb-4 block hover:underline"
            >
              {first.milestone.title}
            </Link>
          );
        })()}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {badge ? (
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md ${badge.cls}`}>
                {badge.text}
              </span>
            ) : (
              <span className="text-[11px] text-white/35">No deadline</span>
            )}
          </div>
          <button
            onClick={() => handleComplete(first.milestone.id, first.goal.id)}
            className="ms-btn-on-dark flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2.5 sm:py-1.5 rounded-xl sm:rounded-md text-sm font-semibold transition-colors shrink-0 min-h-[44px] sm:min-h-0 touch-manipulation"
          >
            Mark done <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* ── Rows: #2 and #3 ── */}
      {rest.length > 0 && (
        <div className="divide-y divide-milestone-line/70 dark:divide-white/[0.06]">
          {rest.map(({ goal, milestone }, i) => {
            const rowBadge = urgencyBadge(milestone.due_date);
            return (
              <div
                key={milestone.id}
                className="group flex items-center gap-3 px-4 py-3.5 sm:py-2.5 active:bg-gray-50/80 dark:active:bg-white/[0.03] transition-colors"
              >
                <span className="text-xs font-medium text-gray-400 dark:text-white/50 w-4 shrink-0 tabular-nums select-none">
                  {i + 2}
                </span>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/goals/${goal.id}`}
                    className="text-[11px] text-gray-400 dark:text-white/40 truncate block hover:text-milestone-blue"
                  >
                    {goal.title}
                  </Link>
                  {(() => {
                    const mailto = isEmailMilestone(milestone.title)
                      ? buildMailtoLink(milestone.title, { goal })
                      : null;
                    if (mailto) {
                      return (
                        <a
                          href={mailto}
                          className="text-sm font-medium text-milestone-blue leading-snug truncate block hover:underline"
                        >
                          {milestone.title}
                        </a>
                      );
                    }
                    return (
                      <Link
                        href={`/goals/${goal.id}`}
                        className="text-sm font-medium text-gray-800 dark:text-white leading-snug truncate block hover:text-milestone-blue"
                      >
                        {milestone.title}
                      </Link>
                    );
                  })()}
                  {rowBadge && (
                    <span className={`text-[10px] font-medium ${rowBadge.cls.split(" ")[1]}`}>
                      {rowBadge.text}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleComplete(milestone.id, goal.id)}
                  className="ms-touch-icon shrink-0 text-gray-300 dark:text-white/25 active:text-milestone-green transition-colors"
                  aria-label="Mark done"
                >
                  <CheckCircle size={20} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
