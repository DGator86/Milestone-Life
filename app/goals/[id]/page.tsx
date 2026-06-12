import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { db } from "@/db";
import { goals, groups, activity_log } from "@/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import { ArrowLeft, Target, Briefcase, Home, Heart, Building2, Handshake, Repeat } from "lucide-react";
import { formatRecurrence } from "@/lib/recurrence";
import { calcProgress } from "@/lib/progress";
import type { GoalWithDetails, Group, ActivityLog, AppUser } from "@/lib/types";
import MilestoneList from "@/components/goals/MilestoneList";
import EditGoalPanel from "@/components/goals/EditGoalPanel";
import GoalStatusControls from "@/components/goals/GoalStatusControls";

export const dynamic = "force-dynamic";

const IMPORTANCE_CONFIG = {
  critical: { label: "Critical", bg: "bg-milestone-red-dim", text: "text-milestone-red" },
  important: { label: "Important", bg: "bg-milestone-amber-dim", text: "text-milestone-amber" },
  normal: { label: "Normal", bg: "bg-gray-100", text: "text-gray-500" },
};

const TYPE_LABELS: Record<string, string> = {
  concrete: "Concrete",
  touches: "Touches",
  deadline: "Deadline",
  maintenance: "Maintenance",
};

const GROUP_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Work: Briefcase,
  Home: Home,
  Health: Heart,
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatActivityAction(action: string, metadata: Record<string, unknown>): string {
  switch (action) {
    case "goal_created":
      return `Goal created`;
    case "milestone_completed":
      return "Milestone marked complete";
    case "milestone_status_changed":
      return `Milestone status → ${metadata.status}`;
    default:
      return action.replace(/_/g, " ");
  }
}

export default async function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = await getDataOwnerId();
  const user: AppUser = { id: session.user.id, email: session.user.email };

  const [goalRaw, groupsRaw, activityRaw] = await Promise.all([
    db.query.goals.findFirst({
      where: and(eq(goals.id, id), eq(goals.user_id, userId)),
      with: {
        groups: true,
        milestones: true,
        crm_customers: { columns: { id: true, name: true } },
        crm_opportunities: { columns: { id: true, title: true } },
      },
    }),
    db.query.groups.findMany({
      where: eq(groups.user_id, userId),
      orderBy: [asc(groups.sort_order)],
    }),
    db.query.activity_log.findMany({
      where: eq(activity_log.goal_id, id),
      orderBy: [desc(activity_log.created_at)],
    }),
  ]);

  if (!goalRaw) notFound();

  const goal = {
    ...goalRaw,
    groups: goalRaw.groups!,
    milestones: [...(goalRaw.milestones ?? [])].sort(
      (a, b) => a.position - b.position
    ),
  } as unknown as GoalWithDetails;

  const safeGroups: Group[] = groupsRaw as Group[];
  const activity: ActivityLog[] = activityRaw.slice(0, 10) as ActivityLog[];
  const progress = calcProgress(goal.milestones);
  const completedCount = goal.milestones.filter((m) => m.status === "completed").length;

  const imp = IMPORTANCE_CONFIG[goal.importance ?? "normal"] ?? IMPORTANCE_CONFIG.normal;
  const GroupIcon = GROUP_ICONS[goal.groups?.name] ?? Target;
  const isOverdue = goal.due_date && new Date(goal.due_date) < new Date();

  return (
    <AppShell user={user}>
      <div className="p-4 sm:p-6 max-w-3xl">
        <Link
          href="/goals"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60 mb-5 transition-colors"
        >
          <ArrowLeft size={14} />
          All Goals
        </Link>

        <div className="bg-white dark:bg-[#0B1929] rounded-xl shadow-card border border-milestone-line dark:border-white/[0.08] p-4 sm:p-6 mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:order-2 sm:shrink-0 sm:justify-end">
              <EditGoalPanel goal={goal} groups={safeGroups} />
              <GoalStatusControls goalId={goal.id} status={goal.status} />
            </div>

            <div className="min-w-0 w-full sm:flex-1 sm:order-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="flex items-center gap-1 text-xs font-semibold text-gray-400">
                  <GroupIcon size={12} />
                  {goal.groups?.name}
                </span>
                <span className="text-gray-200">·</span>
                <span className="text-xs text-gray-400 capitalize">
                  {TYPE_LABELS[goal.goal_type] ?? goal.goal_type}
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded capitalize ${imp.bg} ${imp.text}`}
                >
                  {imp.label}
                </span>
                {goal.status !== "active" && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded capitalize bg-gray-100 text-gray-500">
                    {goal.status}
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-snug break-words">
                {goal.title}
              </h1>
              {goal.due_date && (
                <p
                  className={`text-xs mt-1.5 font-medium ${
                    isOverdue ? "text-milestone-red" : "text-gray-400"
                  }`}
                >
                  {isOverdue ? "Overdue · " : "Due "}
                  {new Date(goal.due_date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}
              {goal.is_recurring && (
                <p className="flex items-center gap-1.5 text-xs mt-1.5 font-medium text-milestone-blue">
                  <Repeat size={12} />
                  {formatRecurrence(goal.recurrence_interval, goal.recurrence_unit)}
                  {goal.recurrence_end_date
                    ? ` until ${new Date(goal.recurrence_end_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}`
                    : " · no end date"}
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-milestone-line dark:border-white/[0.08]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 dark:text-white/40 uppercase tracking-wide">
                Progress
              </span>
              <span className="text-sm font-bold text-gray-700 dark:text-white tabular-nums">{progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-white/[0.08] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  backgroundColor:
                    progress === 100 ? "#36A852" : progress > 50 ? "#1769FF" : "#F8B400",
                }}
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-white/40 mt-1.5">
              {completedCount} of {goal.milestones.length} milestones completed
            </p>
          </div>
        </div>

        {(goalRaw.crm_customers || goalRaw.crm_opportunities) && (
          <div className="bg-white dark:bg-[#0B1929] rounded-xl shadow-card border border-milestone-line dark:border-white/[0.08] p-4 mb-6 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mr-1">Connected</span>
            {goalRaw.crm_customers && (
              <Link
                href={`/customers/${goalRaw.crm_customers.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-milestone-blue bg-milestone-blue-dim hover:bg-blue-100 rounded-lg px-2.5 py-1.5 transition-colors"
              >
                <Building2 size={13} />
                {goalRaw.crm_customers.name}
              </Link>
            )}
            {goalRaw.crm_opportunities && (
              <Link
                href={`/opportunities?highlight=${goalRaw.crm_opportunities.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-milestone-green bg-milestone-green-dim hover:bg-green-100 rounded-lg px-2.5 py-1.5 transition-colors"
              >
                <Handshake size={13} />
                {goalRaw.crm_opportunities.title}
              </Link>
            )}
          </div>
        )}

        <MilestoneList goal={goal} />

        {activity.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-3">
              Recent Activity
            </p>
            <div className="bg-white dark:bg-[#0B1929] rounded-xl shadow-card border border-milestone-line dark:border-white/[0.08] overflow-hidden divide-y divide-milestone-line dark:divide-white/[0.06]">
              {activity.map((log) => (
                <div key={log.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-white/20 shrink-0" />
                  <p className="text-xs text-gray-600 dark:text-white/60 flex-1">
                    {formatActivityAction(log.action, log.metadata)}
                  </p>
                  <span className="text-[11px] text-gray-400 dark:text-white/30 shrink-0 tabular-nums">
                    {formatRelativeTime(log.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
