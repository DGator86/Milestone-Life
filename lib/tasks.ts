import { parseDateParts, startOfLocalDay } from "@/lib/dates";
import type { CrmTask, TaskPriority } from "./types";

export interface TaskGroups {
  overdue: CrmTask[];
  today: CrmTask[];
  upcoming: CrmTask[];
  later: CrmTask[];
}

const PRIORITY_RANK: Record<TaskPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function parseDateStr(s: string): Date {
  const parts = parseDateParts(s);
  if (!parts) return new Date(NaN);
  return new Date(parts.y, parts.m - 1, parts.d);
}

/**
 * Buckets open (not-done) tasks into Overdue / Today / Upcoming-this-week / Later.
 * Tasks with no due date fall into "later". Each bucket is sorted by priority
 * then due date so the most urgent action sits on top.
 */
export function groupTasks(tasks: CrmTask[]): TaskGroups {
  const now = new Date();
  const todayStart = startOfLocalDay(now).getTime();
  const weekEnd = todayStart + 7 * 86400000;

  const groups: TaskGroups = { overdue: [], today: [], upcoming: [], later: [] };

  for (const task of tasks) {
    if (task.done) continue;
    if (!task.due_date) {
      groups.later.push(task);
      continue;
    }
    const due = startOfLocalDay(parseDateStr(task.due_date)).getTime();
    if (due < todayStart) groups.overdue.push(task);
    else if (due === todayStart) groups.today.push(task);
    else if (due <= weekEnd) groups.upcoming.push(task);
    else groups.later.push(task);
  }

  const sorter = (a: CrmTask, b: CrmTask) => {
    const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (p !== 0) return p;
    const ad = a.due_date ? parseDateStr(a.due_date).getTime() : Infinity;
    const bd = b.due_date ? parseDateStr(b.due_date).getTime() : Infinity;
    return ad - bd;
  };

  groups.overdue.sort(sorter);
  groups.today.sort(sorter);
  groups.upcoming.sort(sorter);
  groups.later.sort(sorter);

  return groups;
}
