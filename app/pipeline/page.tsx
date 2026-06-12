import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { db } from "@/db";
import { goals } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import AppShell from "@/components/layout/AppShell";
import { TrendingUp, Target } from "lucide-react";
import Link from "next/link";
import type { GoalWithDetails, Milestone, AppUser } from "@/lib/types";

export const dynamic = "force-dynamic";

const STAGES = [
  { key: "active",    label: "In Progress", color: "text-milestone-blue bg-milestone-blue-dim",   bar: "#1769FF" },
  { key: "completed", label: "Completed",   color: "text-milestone-green bg-milestone-green-dim", bar: "#36A852" },
  { key: "archived",  label: "Archived",    color: "text-gray-400 bg-gray-100",                   bar: "#9CA3AF" },
];

function dotColor(ms: Milestone, index: number, all: Milestone[]): string {
  if (ms.status === "completed")  return "#36A852";
  if (ms.status === "stuck")      return "#EA4335";
  if (ms.status === "in_progress" || ms.status === "waiting") return "#1769FF";
  const firstActive = all.findIndex((m) => m.status !== "completed");
  if (index === firstActive)      return "#1769FF";
  return "#E2E8F0";
}

function MilestoneTrack({ milestones }: { milestones: Milestone[] }) {
  if (milestones.length === 0) return null;

  return (
    <div className="relative w-full mt-3 pb-1">
      <div className="absolute top-[10px] left-0 right-0 flex" style={{ zIndex: 0 }}>
        {milestones.slice(0, -1).map((ms, i) => {
          const next = milestones[i + 1];
          const filled = ms.status === "completed" && next.status === "completed";
          return (
            <div
              key={ms.id}
              className="flex-1 h-0.5"
              style={{ backgroundColor: filled ? "#36A852" : "#E2E8F0" }}
            />
          );
        })}
      </div>

      <div className="relative flex justify-between" style={{ zIndex: 1 }}>
        {milestones.map((ms, i) => {
          const color = dotColor(ms, i, milestones);
          const isCompleted = ms.status === "completed";
          const isStuck = ms.status === "stuck";

          return (
            <div
              key={ms.id}
              className="flex flex-col items-center gap-1.5"
              style={{ width: `${100 / milestones.length}%`, minWidth: 0 }}
            >
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                style={{
                  borderColor: color,
                  backgroundColor: isCompleted ? color : "var(--ms-dot-bg)",
                }}
              >
                {isCompleted && (
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M1.5 4.5l2.2 2.2 3.8-3.8" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {isStuck && (
                  <span style={{ color: "#EA4335", fontSize: 9, fontWeight: 700, lineHeight: 1 }}>!</span>
                )}
                {(ms.status === "in_progress" || ms.status === "waiting") && (
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                )}
              </div>

              <span
                className="text-[10px] text-center leading-tight w-full px-0.5 truncate"
                style={{
                  color: isCompleted ? "#36A852" : isStuck ? "#EA4335" : color === "#1769FF" ? "#111" : "#9CA3AF",
                  fontWeight: color === "#1769FF" || isStuck ? 600 : 400,
                }}
              >
                {ms.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default async function PipelinePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = await getDataOwnerId();
  const user: AppUser = { id: session.user.id, email: session.user.email };

  const goalsRaw = await db.query.goals.findMany({
    where: eq(goals.user_id, userId),
    with: { groups: true, milestones: true, contacts: true },
    orderBy: [desc(goals.created_at)],
  });

  const goalsList = goalsRaw.map((g) => ({
    ...g,
    groups: g.groups!,
    milestones: [...(g.milestones ?? [])].sort(
      (a, b) => a.position - b.position
    ),
  })) as unknown as GoalWithDetails[];

  return (
    <AppShell user={user}>
      <div className="p-4 md:p-6 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <TrendingUp size={20} className="text-milestone-blue" />
            Pipeline
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Goals and their milestone steps</p>
        </div>

        {goalsList.length === 0 ? (
          <div className="ms-card p-14 text-center">
            <TrendingUp size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-400">No goals yet.</p>
            <p className="text-xs text-gray-300 mt-1">Create a goal on the dashboard to get started.</p>
          </div>
        ) : (
          STAGES.map(({ key, label, color, bar }) => {
            const stageGoals = goalsList.filter((g) => g.status === key);
            if (stageGoals.length === 0) return null;

            return (
              <div key={key} className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${color}`}>
                    {label}
                  </span>
                  <span className="text-xs text-gray-400">({stageGoals.length})</span>
                </div>

                <div className="ms-card">
                  {stageGoals.map((goal) => {
                    const milestones = goal.milestones ?? [];
                    const contact = (goal as GoalWithDetails & { contacts?: { name: string } }).contacts;

                    return (
                      <div
                        key={goal.id}
                        className="px-5 py-4 border-b border-milestone-line last:border-0"
                        style={{ borderLeftWidth: 3, borderLeftColor: bar }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">
                                {goal.groups?.name}
                              </span>
                              {contact && (
                                <>
                                  <span className="text-gray-200 text-xs">·</span>
                                  <span className="text-[11px] text-gray-500 font-medium">{contact.name}</span>
                                </>
                              )}
                            </div>
                            <p className="font-semibold text-gray-900 text-sm leading-snug">{goal.title}</p>
                          </div>
                          {goal.due_date && (
                            <span className="text-[11px] text-gray-400 shrink-0 pt-0.5">
                              {new Date(goal.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          )}
                        </div>

                        <MilestoneTrack milestones={milestones} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        {goalsList.length > 0 && (
          <div className="mt-2">
            <Link
              href="/dashboard#create-goal"
              className="flex items-center gap-3 bg-white border-2 border-dashed border-milestone-line rounded-xl px-6 py-4 text-sm text-gray-400 hover:border-milestone-blue hover:text-milestone-blue hover:bg-milestone-blue-dim transition-all w-full group"
            >
              <div className="w-7 h-7 rounded-lg border-2 border-dashed border-current flex items-center justify-center group-hover:bg-milestone-blue group-hover:border-milestone-blue group-hover:text-white transition-all">
                <Target size={15} />
              </div>
              <span className="font-medium">Add a new goal</span>
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
