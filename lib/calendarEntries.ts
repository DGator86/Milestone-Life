import { dayOfMonth, isSameLocalMonth, toDateKey } from "@/lib/dates";
import {
  collectScheduledMilestones,
  collectScheduledTasks,
  type AnchorSource,
} from "@/lib/scheduleAnchor";
import type { CrmTask, GoalWithDetails } from "@/lib/types";

export type CalendarEntryKind = "milestone" | "goal" | "task" | "priority";

export interface CalendarEntry {
  date: string;
  day: number;
  goalId?: string;
  taskId?: string;
  goalTitle: string;
  label: string;
  kind: CalendarEntryKind;
  anchorSource: AnchorSource;
}

function pushEntry(map: Map<number, CalendarEntry[]>, entry: CalendarEntry) {
  const dayList = map.get(entry.day) ?? [];
  dayList.push(entry);
  map.set(entry.day, dayList);
}

function calendarKind(source: AnchorSource): CalendarEntryKind {
  if (source === "goal") return "goal";
  if (source === "task") return "task";
  if (source === "priority") return "priority";
  return "milestone";
}

/** Build month calendar entries from scheduled goals, milestones, and CRM tasks. */
export function buildMonthCalendar(
  goals: GoalWithDetails[],
  tasks: CrmTask[],
  year: number,
  month: number,
  today = new Date(),
): { byDay: Map<number, CalendarEntry[]>; agenda: CalendarEntry[] } {
  const map = new Map<number, CalendarEntry[]>();
  const list: CalendarEntry[] = [];

  for (const goal of goals) {
    if (goal.status !== "active") continue;
    if (!goal.due_date || !isSameLocalMonth(goal.due_date, year, month)) continue;
    const day = dayOfMonth(goal.due_date);
    if (!day) continue;
    const entry: CalendarEntry = {
      date: toDateKey(goal.due_date)!,
      day,
      goalId: goal.id,
      goalTitle: goal.title,
      label: `Goal due: ${goal.title}`,
      kind: "goal",
      anchorSource: "goal",
    };
    pushEntry(map, entry);
    list.push(entry);
  }

  for (const { goal, milestone, anchor } of collectScheduledMilestones(goals, today)) {
    if (!isSameLocalMonth(anchor.dateKey, year, month)) continue;
    const day = dayOfMonth(anchor.dateKey);
    if (!day) continue;
    const entry: CalendarEntry = {
      date: anchor.dateKey,
      day,
      goalId: goal.id,
      goalTitle: goal.title,
      label: milestone.title,
      kind: calendarKind(anchor.source),
      anchorSource: anchor.source,
    };
    pushEntry(map, entry);
    list.push(entry);
  }

  for (const { task, anchor } of collectScheduledTasks(tasks, today)) {
    if (!isSameLocalMonth(anchor.dateKey, year, month)) continue;
    const day = dayOfMonth(anchor.dateKey);
    if (!day) continue;
    const entry: CalendarEntry = {
      date: anchor.dateKey,
      day,
      taskId: task.id,
      goalTitle: task.crm_customers?.name ?? "CRM",
      label: task.title,
      kind: calendarKind(anchor.source),
      anchorSource: anchor.source,
    };
    pushEntry(map, entry);
    list.push(entry);
  }

  list.sort((a, b) => a.date.localeCompare(b.date) || a.goalTitle.localeCompare(b.goalTitle));
  return { byDay: map, agenda: list };
}
