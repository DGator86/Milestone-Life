import { daysUntilDate } from "@/lib/dates";
import { getNextMilestone } from "@/lib/progress";
import type { GoalImportance, GoalWithDetails, Milestone } from "@/lib/types";

export type MilestoneBucket = "overdue" | "today" | "tomorrow" | "week" | "later" | "noDate";

export const MILESTONE_BUCKET_ORDER: MilestoneBucket[] = [
  "overdue",
  "today",
  "tomorrow",
  "week",
  "later",
  "noDate",
];

export const MILESTONE_BUCKET_LABELS: Record<MilestoneBucket, string> = {
  overdue: "Overdue",
  today: "Today",
  tomorrow: "Tomorrow",
  week: "This Week",
  later: "Later",
  noDate: "No Date",
};

const IMPORTANCE_RANK: Record<GoalImportance, number> = {
  critical: 0,
  important: 1,
  normal: 2,
};

export interface OpenMilestoneItem {
  goal: GoalWithDetails;
  milestone: Milestone;
  daysUntil: number | null;
  bucket: MilestoneBucket;
}

export function daysUntilDue(dueDate: string | null, today = new Date()): number | null {
  return daysUntilDate(dueDate, today);
}

export function milestoneBucket(daysUntil: number | null): MilestoneBucket {
  if (daysUntil === null) return "noDate";
  if (daysUntil < 0) return "overdue";
  if (daysUntil === 0) return "today";
  if (daysUntil === 1) return "tomorrow";
  if (daysUntil <= 7) return "week";
  return "later";
}

/** Next milestone per active goal, grouped by due-date bucket (kill list). */
export function groupOpenMilestones(
  goals: GoalWithDetails[],
  today = new Date(),
): Record<MilestoneBucket, OpenMilestoneItem[]> {
  const map: Record<MilestoneBucket, OpenMilestoneItem[]> = {
    overdue: [],
    today: [],
    tomorrow: [],
    week: [],
    later: [],
    noDate: [],
  };

  for (const goal of goals) {
    if (goal.status !== "active") continue;
    const milestone = getNextMilestone(goal.milestones ?? []);
    if (!milestone) continue;
    const daysUntil = daysUntilDue(milestone.due_date, today);
    const bucket = milestoneBucket(daysUntil);
    map[bucket].push({ goal, milestone, daysUntil, bucket });
  }

  for (const key of MILESTONE_BUCKET_ORDER) {
    map[key].sort((a, b) => {
      const imp = IMPORTANCE_RANK[a.goal.importance] - IMPORTANCE_RANK[b.goal.importance];
      if (imp !== 0) return imp;
      const da = a.daysUntil ?? 9999;
      const db = b.daysUntil ?? 9999;
      return da - db;
    });
  }

  return map;
}
