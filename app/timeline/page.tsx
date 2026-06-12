import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { db } from "@/db";
import { goals } from "@/db/schema";
import { eq, and, inArray, asc } from "drizzle-orm";
import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import { Clock, CheckCircle, AlertCircle, Calendar, ArrowRight } from "lucide-react";
import type { GoalWithDetails, Milestone, AppUser } from "@/lib/types";
import { getNextMilestone } from "@/lib/progress";

export const dynamic = "force-dynamic";

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

interface MilestoneWithGoal extends Milestone {
  goal: GoalWithDetails;
}

function groupByTime(milestones: MilestoneWithGoal[]) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + 7);
  const endOfMonth = new Date(now);
  endOfMonth.setDate(now.getDate() + 30);

  const overdue: MilestoneWithGoal[] = [];
  const today: MilestoneWithGoal[] = [];
  const thisWeek: MilestoneWithGoal[] = [];
  const thisMonth: MilestoneWithGoal[] = [];
  const later: MilestoneWithGoal[] = [];
  const noDueDate: MilestoneWithGoal[] = [];
  const completed: MilestoneWithGoal[] = [];

  for (const ms of milestones) {
    if (ms.status === "completed") {
      completed.push(ms);
      continue;
    }
    if (!ms.due_date) {
      noDueDate.push(ms);
      continue;
    }
    const d = parseLocalDate(ms.due_date);
    if (d < now) overdue.push(ms);
    else if (d <= endOfToday) today.push(ms);
    else if (d <= endOfWeek) thisWeek.push(ms);
    else if (d <= endOfMonth) thisMonth.push(ms);
    else later.push(ms);
  }

  return { overdue, today, thisWeek, thisMonth, later, noDueDate, completed };
}

const STATUS_ICON: Record<
  string,
  { Icon: React.ComponentType<{ size?: number; className?: string }>; color: string }
> = {
  completed: { Icon: CheckCircle, color: "text-milestone-green" },
  stuck: { Icon: AlertCircle, color: "text-milestone-red" },
  in_progress: { Icon: Clock, color: "text-milestone-blue" },
  waiting: { Icon: Clock, color: "text-blue-400" },
  upcoming: { Icon: Clock, color: "text-gray-300" },
};

function MilestoneItem({ ms }: { ms: MilestoneWithGoal }) {
  const cfg = STATUS_ICON[ms.status] ?? STATUS_ICON.upcoming;
  const { Icon } = cfg;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const isOverdue =
    ms.due_date && ms.status !== "completed" && parseLocalDate(ms.due_date) < todayStart;

  return (
    <Link
      href={`/goals/${ms.goal.id}`}
      className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50/60 transition-colors border-b border-milestone-line last:border-0"
    >
      <Icon size={16} className={`shrink-0 ${cfg.color}`} />
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${
            ms.status === "completed" ? "text-gray-400 line-through" : "text-gray-800"
          }`}
        >
          {ms.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-gray-400">{ms.goal.groups?.name}</span>
          <ArrowRight size={10} className="text-gray-300 shrink-0" />
          <span className="text-xs text-gray-500 truncate">{ms.goal.title}</span>
        </div>
      </div>
      {ms.due_date && (
        <div
          className={`flex items-center gap-1 text-xs shrink-0 ${
            isOverdue ? "text-milestone-red font-semibold" : "text-gray-400"
          }`}
        >
          <Calendar size={11} />
          {parseLocalDate(ms.due_date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </div>
      )}
    </Link>
  );
}

function Section({
  title,
  items,
  accentClass,
}: {
  title: string;
  items: MilestoneWithGoal[];
  accentClass?: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-6">
      <p
        className={`text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2 ${
          accentClass ?? "text-gray-400"
        }`}
      >
        {title}
        <span className="font-semibold text-gray-300 normal-case tracking-normal">
          {items.length}
        </span>
      </p>
      <div className="ms-card">
        {items.map((ms) => (
          <MilestoneItem key={ms.id} ms={ms} />
        ))}
      </div>
    </div>
  );
}

export default async function TimelinePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = await getDataOwnerId();
  const user: AppUser = { id: session.user.id, email: session.user.email };

  const goalsRaw = await db.query.goals.findMany({
    where: and(
      eq(goals.user_id, userId),
      inArray(goals.status, ["active", "completed"])
    ),
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

  const nextPerGoal: MilestoneWithGoal[] = goalsList
    .filter((goal) => goal.status === "active")
    .map((goal) => {
      const next = getNextMilestone(goal.milestones ?? []);
      return next ? { ...next, goal } : null;
    })
    .filter((ms): ms is MilestoneWithGoal => ms !== null);

  const completedMilestones: MilestoneWithGoal[] = goalsList.flatMap((goal) =>
    (goal.milestones ?? [])
      .filter((ms) => ms.status === "completed")
      .map((ms) => ({ ...ms, goal }))
  );

  const sortByDueDate = (a: MilestoneWithGoal, b: MilestoneWithGoal) => {
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  };

  nextPerGoal.sort(sortByDueDate);
  completedMilestones.sort(
    (a, b) =>
      new Date(b.completed_at ?? b.updated_at ?? 0).getTime() -
      new Date(a.completed_at ?? a.updated_at ?? 0).getTime()
  );

  const grouped = groupByTime([...nextPerGoal, ...completedMilestones]);
  const pendingCount = nextPerGoal.length;
  const completedCount = completedMilestones.length;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Clock size={20} className="text-milestone-blue" />
            Timeline
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {pendingCount} pending · {completedCount} completed
          </p>
        </div>

        {nextPerGoal.length === 0 && completedMilestones.length === 0 ? (
          <div className="ms-card p-14 text-center">
            <Clock size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-400">No milestones yet.</p>
            <p className="text-xs text-gray-300 mt-1">
              Create a goal on the dashboard to get started.
            </p>
          </div>
        ) : (
          <>
            <Section title="Overdue" items={grouped.overdue} accentClass="text-milestone-red" />
            <Section title="Today" items={grouped.today} accentClass="text-milestone-amber" />
            <Section title="This Week" items={grouped.thisWeek} />
            <Section title="This Month" items={grouped.thisMonth} />
            <Section title="Later" items={grouped.later} />
            <Section title="No Due Date" items={grouped.noDueDate} />
            <Section title="Completed" items={grouped.completed.slice(0, 30)} />
          </>
        )}
      </div>
    </AppShell>
  );
}
