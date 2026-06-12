import { db } from "@/db";
import { goals, crm_opportunities, crm_tasks } from "@/db/schema";
import { eq, and, or, inArray, desc } from "drizzle-orm";
import { getKillList } from "@/lib/progress";
import type { GoalWithDetails } from "@/lib/types";

function asGoalWithDetails(
  rows: Awaited<ReturnType<typeof fetchGoalsWithMilestones>>
): GoalWithDetails[] {
  return rows.map((g) => ({
    ...g,
    groups: g.groups!,
    milestones: [...(g.milestones ?? [])].sort((a, b) => a.position - b.position),
  })) as GoalWithDetails[];
}

async function fetchGoalsWithMilestones(
  userId: string,
  whereExtra: ReturnType<typeof eq> | ReturnType<typeof or>
) {
  return db.query.goals.findMany({
    where: and(eq(goals.user_id, userId), eq(goals.status, "active"), whereExtra),
    with: {
      milestones: true,
      groups: true,
      crm_customers: { columns: { id: true, name: true } },
      crm_opportunities: { columns: { id: true, title: true } },
    },
    orderBy: [desc(goals.updated_at)],
  });
}

export async function getRelatedGoalsForCustomer(userId: string, customerId: string) {
  const rows = await fetchGoalsWithMilestones(userId, eq(goals.customer_id, customerId));
  const goalList = asGoalWithDetails(rows);
  return { goals: goalList, killList: getKillList(goalList) };
}

export async function getRelatedGoalsForContact(
  userId: string,
  contactId: string,
  customerId: string | null
) {
  const oppRows = await db
    .select({ id: crm_opportunities.id })
    .from(crm_opportunities)
    .where(and(eq(crm_opportunities.user_id, userId), eq(crm_opportunities.contact_id, contactId)));

  const oppIds = oppRows.map((o) => o.id);
  const linkFilter =
    customerId && oppIds.length
      ? or(eq(goals.customer_id, customerId), inArray(goals.opportunity_id, oppIds))
      : customerId
        ? eq(goals.customer_id, customerId)
        : oppIds.length
          ? inArray(goals.opportunity_id, oppIds)
          : null;

  if (!linkFilter) return { goals: [] as GoalWithDetails[], killList: [] };

  const rows = await fetchGoalsWithMilestones(userId, linkFilter);
  const goalList = asGoalWithDetails(rows);
  return { goals: goalList, killList: getKillList(goalList) };
}

export async function getOpenOpportunitiesForContact(userId: string, contactId: string) {
  return db.query.crm_opportunities.findMany({
    where: and(
      eq(crm_opportunities.user_id, userId),
      eq(crm_opportunities.contact_id, contactId),
      eq(crm_opportunities.status, "open")
    ),
    with: { crm_customers: { columns: { id: true, name: true } } },
    orderBy: [desc(crm_opportunities.updated_at)],
  });
}

export async function getOpenOpportunitiesForCustomer(userId: string, customerId: string) {
  return db.query.crm_opportunities.findMany({
    where: and(
      eq(crm_opportunities.user_id, userId),
      eq(crm_opportunities.customer_id, customerId),
      eq(crm_opportunities.status, "open")
    ),
    with: { crm_contacts: { columns: { id: true, first_name: true, last_name: true } } },
    orderBy: [desc(crm_opportunities.updated_at)],
  });
}

export async function getOpenTasksForContact(userId: string, contactId: string) {
  return db.query.crm_tasks.findMany({
    where: and(
      eq(crm_tasks.user_id, userId),
      eq(crm_tasks.contact_id, contactId),
      eq(crm_tasks.done, false)
    ),
    orderBy: [desc(crm_tasks.created_at)],
  });
}

export async function getOpenTasksForCustomer(userId: string, customerId: string) {
  return db.query.crm_tasks.findMany({
    where: and(
      eq(crm_tasks.user_id, userId),
      eq(crm_tasks.customer_id, customerId),
      eq(crm_tasks.done, false)
    ),
    orderBy: [desc(crm_tasks.created_at)],
  });
}
