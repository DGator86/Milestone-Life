import {
  bucketForAnchor,
  collectScheduledMilestones,
  collectScheduledTasks,
  type ScheduledMilestone,
  type ScheduledTask,
} from "@/lib/scheduleAnchor";
import type { MilestoneBucket } from "@/lib/milestoneBuckets";
import type { CrmTask, GoalWithDetails } from "@/lib/types";

export type AgendaBucket = MilestoneBucket;

export const AGENDA_BUCKET_ORDER: AgendaBucket[] = ["overdue", "today", "tomorrow", "week", "later"];

export type AgendaMilestoneEntry = { kind: "milestone"; item: ScheduledMilestone };
export type AgendaTaskEntry = { kind: "task"; item: ScheduledTask };
export type AgendaEntry = AgendaMilestoneEntry | AgendaTaskEntry;

/** Unified agenda buckets for all open milestones and CRM tasks with date or priority anchors. */
export function buildAgendaBuckets(
  goals: GoalWithDetails[],
  tasks: CrmTask[],
  today = new Date(),
): Record<AgendaBucket, AgendaEntry[]> {
  const map: Record<AgendaBucket, AgendaEntry[]> = {
    overdue: [],
    today: [],
    tomorrow: [],
    week: [],
    later: [],
    noDate: [],
  };

  for (const item of collectScheduledMilestones(goals, today)) {
    const bucket = bucketForAnchor(item.daysUntil);
    if (AGENDA_BUCKET_ORDER.includes(bucket)) {
      map[bucket].push({ kind: "milestone", item });
    }
  }

  for (const item of collectScheduledTasks(tasks, today)) {
    const bucket = bucketForAnchor(item.daysUntil);
    if (AGENDA_BUCKET_ORDER.includes(bucket)) {
      map[bucket].push({ kind: "task", item });
    }
  }

  return map;
}

export function hasAgendaItems(buckets: Record<AgendaBucket, AgendaEntry[]>): boolean {
  return AGENDA_BUCKET_ORDER.some((key) => buckets[key].length > 0);
}
