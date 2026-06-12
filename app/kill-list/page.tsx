import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { db } from "@/db";
import { goals } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import AppShell from "@/components/layout/AppShell";
import { getKillList, getTaskHealth } from "@/lib/progress";
import { Crosshair, AlertCircle, Clock, ArrowRight, X } from "lucide-react";
import Link from "next/link";
import type { GoalWithDetails, AppUser } from "@/lib/types";

export const dynamic = "force-dynamic";

function isOverdue(date: string | null) {
  if (!date) return false;
  return new Date(date) < new Date();
}

const FILTER_META: Record<string, { label: string; color: string; description: string }> = {
  stuck: {
    label: "Stuck",
    color: "text-milestone-red bg-milestone-red-dim",
    description: "Goals with a stuck milestone or overdue due date",
  },
  attention: {
    label: "Needs Attention",
    color: "text-milestone-amber bg-milestone-amber-dim",
    description: "Goals whose next milestone is overdue",
  },
  waiting: {
    label: "Waiting",
    color: "text-milestone-blue bg-milestone-blue-dim",
    description: "Goals with a milestone blocked on something external",
  },
};

export default async function KillListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = await getDataOwnerId();
  const user: AppUser = { id: session.user.id, email: session.user.email };

  const goalsRaw = await db.query.goals.findMany({
    where: and(eq(goals.user_id, userId), eq(goals.status, "active")),
    with: { groups: true, milestones: true },
    orderBy: [asc(goals.created_at)],
  });

  const goalsList = goalsRaw.map((g) => ({
    ...g,
    groups: g.groups!,
    milestones: [...(g.milestones ?? [])].sort(
      (a, b) => a.position - b.position
    ),
  })) as unknown as GoalWithDetails[];

  const params = await searchParams;
  const filter = params.filter ?? "";

  const { stuck, needsAttention, waiting } = getTaskHealth(goalsList);

  let filteredGoals = goalsList;
  if (filter === "stuck") filteredGoals = stuck;
  else if (filter === "attention") filteredGoals = needsAttention;
  else if (filter === "waiting") filteredGoals = waiting;

  const killList = getKillList(filteredGoals);
  const meta = filter ? FILTER_META[filter] : null;

  return (
    <AppShell user={user}>
      <div className="p-4 md:p-6 max-w-3xl">
        <div className="mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Crosshair size={20} className="text-milestone-red" />
              Kill List
            </h1>
            {meta && (
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${meta.color}`}>
                {meta.label}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {meta ? meta.description : "One next action per active goal · tackle these to keep momentum"}
          </p>
          {meta && (
            <Link
              href="/kill-list"
              className="inline-flex items-center gap-1 text-xs text-milestone-blue hover:underline mt-1.5"
            >
              <X size={10} />
              Clear filter · show all
            </Link>
          )}
        </div>

        {killList.length === 0 ? (
          <div className="ms-card p-14 text-center">
            <Crosshair size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-400">
              {meta ? `No ${meta.label.toLowerCase()} goals right now.` : "No pending milestones on active goals."}
            </p>
            <p className="text-xs text-gray-300 mt-1">
              {meta ? (
                <Link href="/kill-list" className="text-milestone-blue hover:underline">View all goals</Link>
              ) : "You're all caught up!"}
            </p>
          </div>
        ) : (
          <div className="ms-card">
            {killList.map(({ goal, milestone }, index) => {
              const overdueGoal = isOverdue(goal.due_date);
              const overdueMilestone = isOverdue(milestone.due_date);
              const overdue = overdueGoal || overdueMilestone;
              const isStuck = milestone.status === "stuck";
              const urgent = isStuck || overdue;

              return (
                <Link
                  key={goal.id}
                  href={`/goals/${goal.id}`}
                  className={`flex items-center gap-4 px-5 py-4 border-b border-milestone-line last:border-0 hover:bg-gray-50/60 transition-colors ${
                    urgent ? "border-l-[3px]" : ""
                  } ${
                    isStuck
                      ? "border-l-milestone-red"
                      : overdue
                      ? "border-l-milestone-amber"
                      : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                      isStuck
                        ? "bg-milestone-red-dim text-milestone-red"
                        : overdue
                        ? "bg-milestone-amber-dim text-milestone-amber"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {isStuck ? (
                      <AlertCircle size={16} />
                    ) : (
                      <span className="tabular-nums">{index + 1}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">
                        {goal.groups?.name ?? ""}
                      </span>
                      {urgent && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            isStuck
                              ? "bg-milestone-red-dim text-milestone-red"
                              : "bg-milestone-amber-dim text-milestone-amber"
                          }`}
                        >
                          {isStuck ? "Stuck" : "Overdue"}
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-gray-900 text-sm leading-snug">
                      {goal.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <ArrowRight size={12} className="text-gray-300 shrink-0" />
                      <p className="text-xs font-medium text-gray-500">{milestone.title}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {goal.due_date && (
                      <div
                        className={`flex items-center gap-1 text-xs ${
                          overdueGoal
                            ? "text-milestone-red font-semibold"
                            : "text-gray-400"
                        }`}
                      >
                        <Clock size={12} />
                        {new Date(goal.due_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
