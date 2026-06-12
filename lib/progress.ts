import type { Milestone, GoalWithDetails, GoalImportance } from "./types";

/**
 * Product rule: action lists (agenda, kill list, focus, timeline, etc.) show
 * only the next open milestone per goal. Full milestone lists belong on goal
 * detail and progress views, not in "what to do" surfaces.
 */

export function calcProgress(milestones: Milestone[]): number {
  if (!milestones.length) return 0;
  const completed = milestones.filter((m) => m.status === "completed").length;
  return Math.round((completed / milestones.length) * 100);
}

export function getNextMilestone(milestones: Milestone[]): Milestone | null {
  const sorted = [...milestones].sort((a, b) => a.position - b.position);
  return sorted.find((m) => m.status !== "completed") ?? null;
}

export function getKillList(goals: GoalWithDetails[]): Array<{
  goal: GoalWithDetails;
  milestone: Milestone;
}> {
  const items: Array<{ goal: GoalWithDetails; milestone: Milestone }> = [];
  for (const goal of goals) {
    if (goal.status !== "active") continue;
    const next = getNextMilestone(goal.milestones ?? []);
    if (next) items.push({ goal, milestone: next });
  }
  return items;
}

export type GoalHealth = "on_track" | "at_risk" | "waiting";

export function getGoalHealth(goal: GoalWithDetails): GoalHealth {
  const ms = goal.milestones ?? [];
  const hasStuck = ms.some((m) => m.status === "stuck");
  const goalOverdue = goal.due_date && new Date(goal.due_date) < new Date();
  if (hasStuck || goalOverdue) return "at_risk";

  const next = getNextMilestone(ms);
  if (next?.due_date && new Date(next.due_date) < new Date()) return "at_risk";
  if (ms.some((m) => m.status === "waiting")) return "waiting";
  return "on_track";
}

// ── Focus Queue ────────────────────────────────────────────────────────────────

export interface FocusItem {
  goal: GoalWithDetails;
  milestone: Milestone;
  score: number;
}

// ── Tunable weights (keep these obvious and editable) ──────────────────────
const IMPORTANCE_WEIGHT: Record<GoalImportance, number> = {
  critical: 3,
  important: 2,
  normal: 1,
};

function daysUntil(dateStr: string | null, now: Date): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - now.getTime()) / 86_400_000);
}

function urgencyScore(dueDate: string | null, now: Date): number {
  const d = daysUntil(dueDate, now);
  if (d === null) return 1;
  if (d < 0) return 5;   // overdue
  if (d === 0) return 4; // due today
  if (d <= 2) return 3;
  if (d <= 7) return 2;
  return 1;
}

// Staleness floats neglected goals UP the queue. This is a ranking input,
// NOT a guilt/decay mechanic — we never punish, we just resurface.
function stalenessScore(lastActivityAt: string | null, now: Date): number {
  if (!lastActivityAt) return 2;
  const days = Math.floor((now.getTime() - new Date(lastActivityAt).getTime()) / 86_400_000);
  if (days >= 14) return 3;
  if (days >= 7) return 2;
  if (days >= 3) return 1.5;
  return 1;
}

/**
 * Ranked "what to do next." Higher score = more urgent.
 * score = importance × max(goal urgency, next-milestone urgency) × staleness,
 * with a boost for pinned goals.
 */
export function getFocusQueue(goals: GoalWithDetails[], now: Date = new Date()): FocusItem[] {
  const items: FocusItem[] = [];

  for (const goal of goals) {
    if (goal.status !== "active") continue;
    const milestone = getNextMilestone(goal.milestones ?? []);
    if (!milestone) continue;

    const importance = IMPORTANCE_WEIGHT[goal.importance] ?? 1;
    const urgency = Math.max(
      urgencyScore(goal.due_date, now),
      urgencyScore(milestone.due_date, now),
    );
    // TODO: replace goal.updated_at with MAX(activity_log.created_at) per goal
    // for true "last meaningful action" — pass via Map<goalId, lastActivityAt>
    const staleness = stalenessScore(goal.updated_at, now);
    const pinBoost = goal.pinned ? 1.25 : 1;

    items.push({ goal, milestone, score: importance * urgency * staleness * pinBoost });
  }

  return items.sort((a, b) => b.score - a.score);
}

export function getTopFocus(goals: GoalWithDetails[], n = 3, now: Date = new Date()): FocusItem[] {
  return getFocusQueue(goals, now).slice(0, n);
}

export function getTaskHealth(goals: GoalWithDetails[]) {
  const stuck: GoalWithDetails[] = [];
  const needsAttention: GoalWithDetails[] = [];
  const waiting: GoalWithDetails[] = [];
  const onTrack: GoalWithDetails[] = [];

  for (const goal of goals) {
    if (goal.status !== "active") continue;
    const ms = goal.milestones ?? [];
    const hasStuck = ms.some((m) => m.status === "stuck");
    const hasOverdue =
      goal.due_date && new Date(goal.due_date) < new Date();
    const hasWaiting = ms.some((m) => m.status === "waiting");

    if (hasStuck || hasOverdue) {
      stuck.push(goal);
    } else if (hasWaiting) {
      waiting.push(goal);
    } else {
      const next = getNextMilestone(ms);
      if (next?.due_date && new Date(next.due_date) < new Date()) {
        needsAttention.push(goal);
      } else {
        onTrack.push(goal);
      }
    }
  }

  return { stuck, needsAttention, waiting, onTrack };
}
