import { db } from "@/db";
import {
  goals,
  crm_contacts,
  crm_customers,
  crm_opportunities,
  crm_tasks,
} from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { getNextMilestone, getTopFocus } from "@/lib/progress";
import type { GoalWithDetails } from "@/lib/types";

export interface AssistantSuggestions {
  subtitle: string;
  prompts: string[];
}

interface Candidate {
  text: string;
  score: number;
}

function quote(s: string) {
  return `“${s}”`;
}

function fmtValue(value: string | null | undefined): string | null {
  if (!value) return null;
  const n = parseFloat(value);
  if (Number.isNaN(n)) return null;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${n.toLocaleString()}`;
}

function daysUntil(dateStr: string, today: string): number {
  return Math.ceil((new Date(dateStr).getTime() - new Date(today).getTime()) / 86_400_000);
}

function pickTop(candidates: Candidate[], limit = 4): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of candidates.sort((a, b) => b.score - a.score)) {
    const key = c.text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c.text);
    if (out.length >= limit) break;
  }
  return out;
}

const FALLBACK_PROMPTS = [
  "Help me turn a vague idea into a goal with milestones",
  "What should I work on next?",
  "Walk me through setting up my first company and contact",
  "Show me how to use the kill list",
];

const FALLBACK_SUBTITLE =
  "I can create goals, plan milestones, work your kill list, and manage your CRM.";

export async function getAssistantSuggestions(userId: string): Promise<AssistantSuggestions> {
  const today = new Date().toISOString().slice(0, 10);

  const [goalRows, recentContacts, openOpps, recentCustomers, openTasks] = await Promise.all([
    db.query.goals.findMany({
      where: eq(goals.user_id, userId),
      with: { milestones: true, groups: true },
      orderBy: [desc(goals.updated_at)],
      limit: 30,
    }),
    db.query.crm_contacts.findMany({
      where: eq(crm_contacts.user_id, userId),
      with: { crm_customers: true },
      orderBy: [desc(crm_contacts.updated_at)],
      limit: 8,
    }),
    db.query.crm_opportunities.findMany({
      where: and(eq(crm_opportunities.user_id, userId), eq(crm_opportunities.status, "open")),
      with: { crm_customers: true },
      orderBy: [desc(crm_opportunities.updated_at)],
      limit: 8,
    }),
    db.query.crm_customers.findMany({
      where: eq(crm_customers.user_id, userId),
      orderBy: [desc(crm_customers.updated_at)],
      limit: 5,
    }),
    db.query.crm_tasks.findMany({
      where: and(eq(crm_tasks.user_id, userId), eq(crm_tasks.done, false)),
      orderBy: [desc(crm_tasks.updated_at)],
      limit: 10,
    }),
  ]);

  const activeGoals = goalRows.filter((g) => g.status === "active") as GoalWithDetails[];
  const candidates: Candidate[] = [];

  const focus = getTopFocus(activeGoals, 2);
  for (const [i, item] of focus.entries()) {
    const { goal, milestone } = item;
    candidates.push({
      text: `What's my best next move on ${quote(goal.title)}? I'm on ${quote(milestone.title)}.`,
      score: 90 - i * 5,
    });
  }

  const killItems = activeGoals
    .map((g) => {
      const ms = (g.milestones ?? []).slice().sort((a, b) => a.position - b.position);
      const done = ms.filter((m) => m.status === "completed").length;
      const stuck = ms.find((m) => m.status === "stuck" || m.status === "waiting");
      const reasons: string[] = [];
      if (g.due_date && g.due_date < today) reasons.push("overdue");
      if (stuck) reasons.push(`${stuck.status}`);
      if (ms.length && done === 0) reasons.push("not started");
      if (g.importance === "critical" && done === 0) reasons.push("critical");
      return { goal: g, reasons, next: getNextMilestone(ms) };
    })
    .filter((g) => g.reasons.length > 0);

  if (killItems.length > 0) {
    candidates.push({
      text:
        killItems.length === 1
          ? `Review ${quote(killItems[0].goal.title)} on my kill list — what should I do?`
          : `I have ${killItems.length} goals needing attention — help me triage my kill list`,
      score: 85,
    });
    const overdue = killItems.find((k) => k.reasons.includes("overdue"));
    if (overdue?.next) {
      candidates.push({
        text: `${quote(overdue.goal.title)} is overdue — help me get unstuck on ${quote(overdue.next.title)}`,
        score: 88,
      });
    }
  }

  for (const [i, opp] of openOpps.slice(0, 3).entries()) {
    const company = opp.crm_customers?.name;
    const value = fmtValue(opp.value);
    const closeSoon = opp.close_date && daysUntil(opp.close_date, today) <= 14 && daysUntil(opp.close_date, today) >= 0;
    const label = company ? `${quote(opp.title)} with ${company}` : quote(opp.title);
    candidates.push({
      text: closeSoon
        ? `My ${label} deal closes soon — what should I do this week?`
        : `What's the next step for my ${label} deal${value ? ` (${value})` : ""}?`,
      score: 78 - i * 4 + (closeSoon ? 8 : 0),
    });
  }

  const unlinked = recentContacts.filter((c) => !c.customer_id);
  if (unlinked[0]) {
    const name = `${unlinked[0].first_name} ${unlinked[0].last_name}`.trim();
    candidates.push({
      text: `Help me link ${name} to a company and plan a follow-up`,
      score: 72,
    });
  }

  const linked = recentContacts.find((c) => c.crm_customers?.name);
  if (linked) {
    const name = `${linked.first_name} ${linked.last_name}`.trim();
    candidates.push({
      text: `Draft a follow-up for ${name} at ${linked.crm_customers!.name}`,
      score: 70,
    });
  }

  if (recentCustomers[0] && openOpps.length === 0) {
    candidates.push({
      text: `Help me plan outreach for ${recentCustomers[0].name}`,
      score: 65,
    });
  }

  const overdueTasks = openTasks.filter((t) => t.due_date && t.due_date < today);
  if (overdueTasks.length > 0) {
    candidates.push({
      text:
        overdueTasks.length === 1
          ? `I have an overdue task — ${quote(overdueTasks[0].title)}. What should I prioritize?`
          : `I have ${overdueTasks.length} overdue tasks — help me prioritize`,
      score: 80,
    });
  }

  const dueSoonTasks = openTasks.filter(
    (t) => t.due_date && t.due_date >= today && daysUntil(t.due_date, today) <= 3,
  );
  if (dueSoonTasks[0] && overdueTasks.length === 0) {
    candidates.push({
      text: `Remind me what to do for ${quote(dueSoonTasks[0].title)} due ${dueSoonTasks[0].due_date}`,
      score: 68,
    });
  }

  const stalled = activeGoals.find((g) => {
    const ms = g.milestones ?? [];
    const done = ms.filter((m) => m.status === "completed").length;
    return ms.length > 0 && done === 0 && g.updated_at < new Date(Date.now() - 7 * 86_400_000).toISOString();
  });
  if (stalled) {
    candidates.push({
      text: `Break ${quote(stalled.title)} into smaller milestones so I can get moving`,
      score: 66,
    });
  }

  const prompts = pickTop(candidates);
  while (prompts.length < 4) {
    const fallback = FALLBACK_PROMPTS.find((p) => !prompts.includes(p));
    if (!fallback) break;
    prompts.push(fallback);
  }

  const subtitle = buildSubtitle({
    activeGoalCount: activeGoals.length,
    killCount: killItems.length,
    openDealCount: openOpps.length,
    contactCount: recentContacts.length,
    companyCount: recentCustomers.length,
    focusGoal: focus[0]?.goal.title,
    focusStep: focus[0]?.milestone.title,
  });

  return { subtitle, prompts };
}

function buildSubtitle(ctx: {
  activeGoalCount: number;
  killCount: number;
  openDealCount: number;
  contactCount: number;
  companyCount: number;
  focusGoal?: string;
  focusStep?: string;
}): string {
  const parts: string[] = [];
  if (ctx.activeGoalCount > 0) parts.push(`${ctx.activeGoalCount} active goal${ctx.activeGoalCount === 1 ? "" : "s"}`);
  if (ctx.openDealCount > 0) parts.push(`${ctx.openDealCount} open deal${ctx.openDealCount === 1 ? "" : "s"}`);
  if (ctx.killCount > 0) parts.push(`${ctx.killCount} need${ctx.killCount === 1 ? "s" : ""} attention`);

  if (ctx.focusGoal && ctx.focusStep) {
    return `Top of your queue: ${quote(ctx.focusStep)} on ${quote(ctx.focusGoal)}.`;
  }
  if (parts.length > 0) {
    return `Based on your workspace — ${parts.join(", ")}.`;
  }
  if (ctx.contactCount > 0 || ctx.companyCount > 0) {
    return "Your CRM has recent activity — I can help you plan follow-ups and deals.";
  }
  return FALLBACK_SUBTITLE;
}
