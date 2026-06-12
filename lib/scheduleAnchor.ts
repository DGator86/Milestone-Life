import { daysUntilDate, localDateKey, toDateKey } from "@/lib/dates";
import { milestoneBucket } from "@/lib/milestoneBuckets";
import { getNextMilestone } from "@/lib/progress";
import type {
  CrmTask,
  GoalImportance,
  GoalWithDetails,
  Milestone,
  TaskPriority,
} from "@/lib/types";

export type AnchorSource = "milestone" | "goal" | "priority" | "task";

export interface ScheduleAnchor {
  dateKey: string;
  source: AnchorSource;
}

export interface ScheduledMilestone {
  goal: GoalWithDetails;
  milestone: Milestone;
  anchor: ScheduleAnchor;
  daysUntil: number;
}

export interface ScheduledTask {
  task: CrmTask;
  anchor: ScheduleAnchor;
  daysUntil: number;
}

const GOAL_PRIORITY_OFFSET: Record<GoalImportance, number> = {
  critical: 0,
  important: 0,
  normal: 0,
};

const TASK_PRIORITY_OFFSET: Record<TaskPriority, number> = {
  critical: 0,
  high: 0,
  medium: 0,
  low: 0,
};

function anchorFromOffset(today: Date, offset: number, source: AnchorSource): ScheduleAnchor {
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
  return { dateKey: localDateKey(date), source };
}

/** Resolve when an open milestone belongs on the schedule. */
export function resolveMilestoneAnchor(
  goal: GoalWithDetails,
  milestone: Milestone,
  today = new Date(),
): ScheduleAnchor | null {
  if (milestone.status === "completed") return null;

  const milestoneDate = toDateKey(milestone.due_date);
  if (milestoneDate) return { dateKey: milestoneDate, source: "milestone" };

  const goalDate = toDateKey(goal.due_date);
  if (goalDate) return { dateKey: goalDate, source: "goal" };

  const offset = goal.pinned ? 0 : GOAL_PRIORITY_OFFSET[goal.importance] ?? 0;
  return anchorFromOffset(today, offset, "priority");
}

/** Resolve when an open CRM task belongs on the schedule. */
export function resolveTaskAnchor(task: CrmTask, today = new Date()): ScheduleAnchor | null {
  if (task.done) return null;

  const taskDate = toDateKey(task.due_date);
  if (taskDate) return { dateKey: taskDate, source: "task" };

  const offset = TASK_PRIORITY_OFFSET[task.priority] ?? 0;
  return anchorFromOffset(today, offset, "priority");
}

export function collectScheduledMilestones(
  goals: GoalWithDetails[],
  today = new Date(),
): ScheduledMilestone[] {
  const items: ScheduledMilestone[] = [];

  for (const goal of goals) {
    if (goal.status !== "active") continue;
    const milestone = getNextMilestone(goal.milestones ?? []);
    if (!milestone) continue;
    const anchor = resolveMilestoneAnchor(goal, milestone, today);
    if (!anchor) continue;
    const daysUntil = daysUntilDate(anchor.dateKey, today);
    if (daysUntil === null) continue;
    items.push({ goal, milestone, anchor, daysUntil });
  }

  return items.sort((a, b) => {
    if (a.daysUntil !== b.daysUntil) return a.daysUntil - b.daysUntil;
    if (a.milestone.position !== b.milestone.position) {
      return a.milestone.position - b.milestone.position;
    }
    return a.goal.title.localeCompare(b.goal.title);
  });
}

export function collectScheduledTasks(tasks: CrmTask[], today = new Date()): ScheduledTask[] {
  const items: ScheduledTask[] = [];

  for (const task of tasks) {
    const anchor = resolveTaskAnchor(task, today);
    if (!anchor) continue;
    const daysUntil = daysUntilDate(anchor.dateKey, today);
    if (daysUntil === null) continue;
    items.push({ task, anchor, daysUntil });
  }

  const priorityRank: Record<TaskPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return items.sort((a, b) => {
    if (a.daysUntil !== b.daysUntil) return a.daysUntil - b.daysUntil;
    return priorityRank[a.task.priority] - priorityRank[b.task.priority];
  });
}

export function bucketForAnchor(daysUntil: number) {
  return milestoneBucket(daysUntil);
}
