import { db } from "@/db";
import {
  goals,
  milestones,
  groups,
  activity_log,
  crm_customers,
  crm_contacts,
  crm_opportunities,
  crm_tasks,
} from "@/db/schema";
import { and, eq, asc, desc, ilike, ne, or } from "drizzle-orm";

/**
 * Agent tool registry. Every handler is scoped to a single user id so the
 * assistant can only ever read or mutate the signed-in user's own data.
 *
 * Each tool returns a short human-readable `summary` (surfaced in the UI as an
 * activity line) plus an arbitrary `data` payload the model can reason over.
 */

export interface ToolContext {
  userId: string;
}

export interface ToolResult {
  summary?: string;
  data?: unknown;
  error?: string;
}

export interface AgentTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  /** True when the tool changes data (used to trigger a UI refresh). */
  mutates?: boolean;
  handler: (ctx: ToolContext, input: Record<string, unknown>) => Promise<ToolResult>;
}

// ─── helpers ────────────────────────────────────────────────────────────────

const GROUP_COLORS = ["#1769FF", "#36A852", "#F8B400", "#EA4335", "#8B5CF6", "#0EA5E9"];

async function resolveGroup(userId: string, groupName?: string, groupId?: string) {
  if (groupId) {
    const g = await db.query.groups.findFirst({
      where: and(eq(groups.id, groupId), eq(groups.user_id, userId)),
    });
    if (g) return g;
  }
  const all = await db.query.groups.findMany({ where: eq(groups.user_id, userId), orderBy: [asc(groups.sort_order)] });
  if (groupName) {
    const match = all.find((g) => g.name.toLowerCase() === groupName.toLowerCase());
    if (match) return match;
    const [created] = await db
      .insert(groups)
      .values({ user_id: userId, name: groupName, color: GROUP_COLORS[all.length % GROUP_COLORS.length], sort_order: all.length })
      .returning();
    return created;
  }
  if (all[0]) return all[0];
  const [created] = await db
    .insert(groups)
    .values({ user_id: userId, name: "General", color: GROUP_COLORS[0], sort_order: 0 })
    .returning();
  return created;
}

async function findGoal(userId: string, goalId?: string, goalTitle?: string) {
  if (goalId) {
    return db.query.goals.findFirst({ where: and(eq(goals.id, goalId), eq(goals.user_id, userId)) });
  }
  if (goalTitle) {
    const matches = await db.query.goals.findMany({
      where: and(eq(goals.user_id, userId), ilike(goals.title, `%${goalTitle}%`)),
      orderBy: [desc(goals.updated_at)],
    });
    return matches[0];
  }
  return undefined;
}

async function findCustomer(userId: string, name?: string, id?: string) {
  if (id) return db.query.crm_customers.findFirst({ where: and(eq(crm_customers.id, id), eq(crm_customers.user_id, userId)) });
  if (name) {
    const matches = await db.query.crm_customers.findMany({
      where: and(eq(crm_customers.user_id, userId), ilike(crm_customers.name, `%${name}%`)),
    });
    return matches[0];
  }
  return undefined;
}

async function findContact(userId: string, name?: string, id?: string) {
  if (id) {
    return db.query.crm_contacts.findFirst({
      where: and(eq(crm_contacts.id, id), eq(crm_contacts.user_id, userId)),
    });
  }
  if (name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const first = parts[0];
    const last = parts.length > 1 ? parts.slice(1).join(" ") : null;
    const matches = await db.query.crm_contacts.findMany({
      where: and(
        eq(crm_contacts.user_id, userId),
        last
          ? and(ilike(crm_contacts.first_name, `%${first}%`), ilike(crm_contacts.last_name, `%${last}%`))
          : or(
              ilike(crm_contacts.first_name, `%${first}%`),
              ilike(crm_contacts.last_name, `%${first}%`),
            ),
      ),
    });
    return matches[0];
  }
  return undefined;
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

// ─── tools ──────────────────────────────────────────────────────────────────

export const TOOLS: AgentTool[] = [
  {
    name: "list_groups",
    description: "List the user's goal groups (work contexts / categories). Use this before creating a goal so you can place it in the right group.",
    input_schema: { type: "object", properties: {} },
    handler: async ({ userId }) => {
      const rows = await db.query.groups.findMany({ where: eq(groups.user_id, userId), orderBy: [asc(groups.sort_order)] });
      return { data: rows.map((g) => ({ id: g.id, name: g.name })) };
    },
  },
  {
    name: "create_goal",
    description:
      "Create a new goal and break it into ordered milestones. Always include 3-6 concrete, sequential milestones unless the user asks otherwise. The first milestone is automatically set in-progress.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "The goal title" },
        group_name: { type: "string", description: "Name of the group/category to file it under. Created if it doesn't exist. Defaults to the user's first group." },
        goal_type: { type: "string", enum: ["concrete", "deadline", "maintenance", "touches"], description: "concrete=project with a finish line, deadline=must be done by a date, maintenance=ongoing, touches=recurring habit" },
        importance: { type: "string", enum: ["normal", "important", "critical"] },
        due_date: { type: "string", description: "ISO date YYYY-MM-DD, optional" },
        milestones: { type: "array", items: { type: "string" }, description: "Ordered milestone titles" },
      },
      required: ["title", "milestones"],
    },
    mutates: true,
    handler: async ({ userId }, input) => {
      const title = str(input.title);
      if (!title) return { error: "title is required" };
      const group = await resolveGroup(userId, str(input.group_name));
      const [goal] = await db
        .insert(goals)
        .values({
          user_id: userId,
          group_id: group.id,
          title,
          goal_type: (str(input.goal_type) as string) || "concrete",
          importance: (str(input.importance) as string) || "normal",
          status: "active",
          due_date: str(input.due_date) || null,
        })
        .returning();
      const titles = Array.isArray(input.milestones) ? (input.milestones as unknown[]).map(str).filter(Boolean) as string[] : [];
      if (titles.length) {
        await db.insert(milestones).values(
          titles.map((t, i) => ({ goal_id: goal.id, title: t, position: i, status: i === 0 ? "in_progress" : "upcoming" }))
        );
      }
      await db.insert(activity_log).values({ goal_id: goal.id, action: "goal_created", metadata: { title, via: "ai" } });
      return {
        summary: `Created goal “${title}” in ${group.name} with ${titles.length} milestone${titles.length === 1 ? "" : "s"}`,
        data: { goal_id: goal.id, group: group.name, milestones: titles },
      };
    },
  },
  {
    name: "add_milestones",
    description: "Append one or more milestones to an existing goal (identified by id or fuzzy title match).",
    input_schema: {
      type: "object",
      properties: {
        goal_id: { type: "string" },
        goal_title: { type: "string", description: "Fuzzy title to find the goal if id is unknown" },
        titles: { type: "array", items: { type: "string" } },
      },
      required: ["titles"],
    },
    mutates: true,
    handler: async ({ userId }, input) => {
      const goal = await findGoal(userId, str(input.goal_id), str(input.goal_title));
      if (!goal) return { error: "Goal not found" };
      const titles = Array.isArray(input.titles) ? (input.titles as unknown[]).map(str).filter(Boolean) as string[] : [];
      if (!titles.length) return { error: "No milestone titles provided" };
      const existing = await db.query.milestones.findMany({ where: eq(milestones.goal_id, goal.id), orderBy: [desc(milestones.position)] });
      let pos = (existing[0]?.position ?? -1) + 1;
      const hasActive = existing.some((m) => m.status === "in_progress" || m.status !== "completed");
      await db.insert(milestones).values(
        titles.map((t, i) => ({ goal_id: goal.id, title: t, position: pos + i, status: !hasActive && i === 0 ? "in_progress" : "upcoming" }))
      );
      return { summary: `Added ${titles.length} milestone${titles.length === 1 ? "" : "s"} to “${goal.title}”`, data: { goal_id: goal.id } };
    },
  },
  {
    name: "complete_next_milestone",
    description: "Mark the current (in-progress or earliest unfinished) milestone of a goal as completed and advance to the next one. Use this when the user says they finished a step / killed the next item.",
    input_schema: {
      type: "object",
      properties: { goal_id: { type: "string" }, goal_title: { type: "string" } },
    },
    mutates: true,
    handler: async ({ userId }, input) => {
      const goal = await findGoal(userId, str(input.goal_id), str(input.goal_title));
      if (!goal) return { error: "Goal not found" };
      const open = await db.query.milestones.findMany({
        where: and(eq(milestones.goal_id, goal.id), ne(milestones.status, "completed")),
        orderBy: [asc(milestones.position)],
      });
      if (!open.length) return { error: `“${goal.title}” has no open milestones` };
      const current = open.find((m) => m.status === "in_progress") ?? open[0];
      await db.update(milestones).set({ status: "completed", completed_at: new Date().toISOString() }).where(eq(milestones.id, current.id));
      await db.insert(activity_log).values({ goal_id: goal.id, milestone_id: current.id, action: "milestone_completed", metadata: { via: "ai" } });
      const rest = open.filter((m) => m.id !== current.id);
      if (rest.length) {
        await db.update(milestones).set({ status: "in_progress" }).where(eq(milestones.id, rest[0].id));
      } else {
        await db.update(goals).set({ status: "completed" }).where(eq(goals.id, goal.id));
      }
      return {
        summary: `Completed “${current.title}” on goal “${goal.title}”`,
        data: { goal_id: goal.id, completed: current.title, next: rest[0]?.title ?? null, goal_completed: rest.length === 0 },
      };
    },
  },
  {
    name: "list_goals",
    description: "List the user's goals with progress, next step, and due date. Optionally filter by status.",
    input_schema: {
      type: "object",
      properties: { status: { type: "string", enum: ["active", "completed", "archived", "all"] } },
    },
    handler: async ({ userId }, input) => {
      const status = str(input.status) ?? "active";
      const where = status === "all" ? eq(goals.user_id, userId) : and(eq(goals.user_id, userId), eq(goals.status, status));
      const rows = await db.query.goals.findMany({ where, with: { milestones: true, groups: true }, orderBy: [desc(goals.updated_at)] });
      return {
        data: rows.map((g) => {
          const ms = (g.milestones ?? []).slice().sort((a, b) => a.position - b.position);
          const done = ms.filter((m) => m.status === "completed").length;
          const next = ms.find((m) => m.status !== "completed");
          return {
            id: g.id,
            title: g.title,
            group: g.groups?.name,
            importance: g.importance,
            status: g.status,
            due_date: g.due_date,
            progress: ms.length ? Math.round((done / ms.length) * 100) : 0,
            next_step: next?.title ?? null,
          };
        }),
      };
    },
  },
  {
    name: "get_kill_list",
    description:
      "Return the user's 'kill list': active goals that need attention right now — overdue, stalled (no progress), or with a stuck milestone. Each item includes a reason. Use this to help the user triage and decide what to push, archive, or kill.",
    input_schema: { type: "object", properties: {} },
    handler: async ({ userId }) => {
      const rows = await db.query.goals.findMany({
        where: and(eq(goals.user_id, userId), eq(goals.status, "active")),
        with: { milestones: true },
      });
      const today = new Date().toISOString().slice(0, 10);
      const items = rows
        .map((g) => {
          const ms = (g.milestones ?? []).slice().sort((a, b) => a.position - b.position);
          const done = ms.filter((m) => m.status === "completed").length;
          const stuck = ms.find((m) => m.status === "stuck" || m.status === "waiting");
          const reasons: string[] = [];
          if (g.due_date && g.due_date < today) reasons.push("overdue");
          if (stuck) reasons.push(`milestone "${stuck.title}" is ${stuck.status}`);
          if (ms.length && done === 0) reasons.push("no progress yet");
          if (g.importance === "critical" && done === 0) reasons.push("critical & not started");
          return { id: g.id, title: g.title, importance: g.importance, due_date: g.due_date, progress: ms.length ? Math.round((done / ms.length) * 100) : 0, next_step: ms.find((m) => m.status !== "completed")?.title ?? null, reasons };
        })
        .filter((g) => g.reasons.length > 0)
        .sort((a, b) => b.reasons.length - a.reasons.length);
      return { data: { count: items.length, items } };
    },
  },
  {
    name: "update_goal_status",
    description: "Change a goal's status. Use 'archived' to kill/shelve a goal, 'completed' to mark it done, 'active' to revive it.",
    input_schema: {
      type: "object",
      properties: {
        goal_id: { type: "string" },
        goal_title: { type: "string" },
        status: { type: "string", enum: ["active", "completed", "archived"] },
      },
      required: ["status"],
    },
    mutates: true,
    handler: async ({ userId }, input) => {
      const goal = await findGoal(userId, str(input.goal_id), str(input.goal_title));
      if (!goal) return { error: "Goal not found" };
      const status = str(input.status);
      if (!status) return { error: "status required" };
      await db.update(goals).set({ status }).where(and(eq(goals.id, goal.id), eq(goals.user_id, userId)));
      const verb = status === "archived" ? "Archived" : status === "completed" ? "Completed" : "Reactivated";
      return { summary: `${verb} goal “${goal.title}”`, data: { goal_id: goal.id, status } };
    },
  },
  {
    name: "create_customer",
    description: "Create a CRM company/customer record.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        industry: { type: "string" },
        website: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        status: { type: "string", enum: ["prospect", "active", "inactive"] },
        notes: { type: "string" },
      },
      required: ["name"],
    },
    mutates: true,
    handler: async ({ userId }, input) => {
      const name = str(input.name);
      if (!name) return { error: "name required" };
      const [row] = await db
        .insert(crm_customers)
        .values({
          user_id: userId,
          name,
          industry: str(input.industry) ?? null,
          website: str(input.website) ?? null,
          email: str(input.email) ?? null,
          phone: str(input.phone) ?? null,
          status: (str(input.status) as string) || "prospect",
          notes: str(input.notes) ?? null,
        })
        .returning();
      return { summary: `Added company “${name}”`, data: { customer_id: row.id } };
    },
  },
  {
    name: "create_contact",
    description: "Create a CRM contact (a person), optionally linked to a company by name.",
    input_schema: {
      type: "object",
      properties: {
        first_name: { type: "string" },
        last_name: { type: "string" },
        company_name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        title: { type: "string" },
      },
      required: ["first_name", "last_name"],
    },
    mutates: true,
    handler: async ({ userId }, input) => {
      const first = str(input.first_name);
      const last = str(input.last_name);
      if (!first || !last) return { error: "first_name and last_name required" };
      const customer = await findCustomer(userId, str(input.company_name));
      const [row] = await db
        .insert(crm_contacts)
        .values({
          user_id: userId,
          customer_id: customer?.id ?? null,
          first_name: first,
          last_name: last,
          email: str(input.email) ?? null,
          phone: str(input.phone) ?? null,
          title: str(input.title) ?? null,
        })
        .returning();
      return { summary: `Added contact ${first} ${last}${customer ? ` at ${customer.name}` : ""}`, data: { contact_id: row.id } };
    },
  },
  {
    name: "create_opportunity",
    description: "Create a CRM deal/opportunity, optionally linked to a company by name.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        company_name: { type: "string" },
        value: { type: "number" },
        stage: { type: "string" },
        close_date: { type: "string", description: "ISO date YYYY-MM-DD" },
        notes: { type: "string" },
      },
      required: ["title"],
    },
    mutates: true,
    handler: async ({ userId }, input) => {
      const title = str(input.title);
      if (!title) return { error: "title required" };
      const customer = await findCustomer(userId, str(input.company_name));
      const value = typeof input.value === "number" ? String(input.value) : null;
      const [row] = await db
        .insert(crm_opportunities)
        .values({
          user_id: userId,
          customer_id: customer?.id ?? null,
          title,
          value,
          stage: (str(input.stage) as string) || "Lead",
          status: "open",
          close_date: str(input.close_date) || null,
          notes: str(input.notes) ?? null,
        })
        .returning();
      return { summary: `Created deal “${title}”${customer ? ` for ${customer.name}` : ""}`, data: { opportunity_id: row.id } };
    },
  },
  {
    name: "link_goal_to_crm",
    description:
      "Connect a goal to a CRM company and/or deal so progress is tracked against the account. Identify the goal by id or title, and the company/deal by name.",
    input_schema: {
      type: "object",
      properties: {
        goal_id: { type: "string" },
        goal_title: { type: "string" },
        company_name: { type: "string" },
        opportunity_title: { type: "string" },
      },
    },
    mutates: true,
    handler: async ({ userId }, input) => {
      const goal = await findGoal(userId, str(input.goal_id), str(input.goal_title));
      if (!goal) return { error: "Goal not found" };
      const customer = await findCustomer(userId, str(input.company_name));
      let opp;
      const oppTitle = str(input.opportunity_title);
      if (oppTitle) {
        const matches = await db.query.crm_opportunities.findMany({
          where: and(eq(crm_opportunities.user_id, userId), ilike(crm_opportunities.title, `%${oppTitle}%`)),
        });
        opp = matches[0];
      }
      if (!customer && !opp) return { error: "No matching company or deal found to link" };
      await db
        .update(goals)
        .set({ ...(customer ? { customer_id: customer.id } : {}), ...(opp ? { opportunity_id: opp.id } : {}) })
        .where(and(eq(goals.id, goal.id), eq(goals.user_id, userId)));
      const parts = [customer ? `company ${customer.name}` : null, opp ? `deal ${opp.title}` : null].filter(Boolean);
      return { summary: `Linked “${goal.title}” to ${parts.join(" and ")}`, data: { goal_id: goal.id } };
    },
  },
  {
    name: "list_customers",
    description: "List CRM companies/customers with their status.",
    input_schema: { type: "object", properties: {} },
    handler: async ({ userId }) => {
      const rows = await db.query.crm_customers.findMany({ where: eq(crm_customers.user_id, userId), orderBy: [desc(crm_customers.updated_at)] });
      return { data: rows.map((c) => ({ id: c.id, name: c.name, status: c.status, industry: c.industry })) };
    },
  },
  {
    name: "update_goal",
    description: "Edit an existing goal's title, importance, due date, or type. Identify it by id or fuzzy title match. Only set the fields you want to change.",
    input_schema: {
      type: "object",
      properties: {
        goal_id: { type: "string" },
        goal_title: { type: "string", description: "Fuzzy title to find the goal if id is unknown" },
        new_title: { type: "string", description: "New title for the goal" },
        importance: { type: "string", enum: ["normal", "important", "critical"] },
        due_date: { type: "string", description: "ISO date YYYY-MM-DD, or empty string to clear" },
        goal_type: { type: "string", enum: ["concrete", "deadline", "maintenance", "touches"] },
      },
    },
    mutates: true,
    handler: async ({ userId }, input) => {
      const goal = await findGoal(userId, str(input.goal_id), str(input.goal_title));
      if (!goal) return { error: "Goal not found" };
      const updates: Record<string, unknown> = {};
      const newTitle = str(input.new_title);
      if (newTitle) updates.title = newTitle;
      const importance = str(input.importance);
      if (importance) updates.importance = importance;
      if (typeof input.due_date === "string") updates.due_date = input.due_date.trim() || null;
      const goalType = str(input.goal_type);
      if (goalType) updates.goal_type = goalType;
      if (Object.keys(updates).length === 0) return { error: "No fields to update" };
      await db.update(goals).set(updates).where(and(eq(goals.id, goal.id), eq(goals.user_id, userId)));
      const displayTitle = newTitle ?? goal.title;
      return { summary: `Updated goal "${displayTitle}"`, data: { goal_id: goal.id, updated: Object.keys(updates) } };
    },
  },
  {
    name: "update_milestone",
    description: "Edit an existing milestone's title, status, or due date. Identify the goal by id or fuzzy title, then the milestone by id or fuzzy title within that goal.",
    input_schema: {
      type: "object",
      properties: {
        goal_id: { type: "string" },
        goal_title: { type: "string", description: "Fuzzy goal title if id is unknown" },
        milestone_id: { type: "string" },
        milestone_title: { type: "string", description: "Fuzzy milestone title to find it within the goal" },
        new_title: { type: "string", description: "New title for the milestone" },
        status: { type: "string", enum: ["upcoming", "in_progress", "waiting", "stuck", "completed"] },
        due_date: { type: "string", description: "ISO date YYYY-MM-DD, or empty string to clear" },
      },
    },
    mutates: true,
    handler: async ({ userId }, input) => {
      const goal = await findGoal(userId, str(input.goal_id), str(input.goal_title));
      if (!goal) return { error: "Goal not found" };
      const msId = str(input.milestone_id);
      const msTitle = str(input.milestone_title);
      let milestone;
      if (msId) {
        milestone = await db.query.milestones.findFirst({ where: and(eq(milestones.id, msId), eq(milestones.goal_id, goal.id)) });
      } else if (msTitle) {
        const all = await db.query.milestones.findMany({ where: eq(milestones.goal_id, goal.id) });
        milestone = all.find((m) => m.title.toLowerCase().includes(msTitle.toLowerCase()));
      }
      if (!milestone) return { error: "Milestone not found" };
      const updates: Record<string, unknown> = {};
      const newTitle = str(input.new_title);
      if (newTitle) updates.title = newTitle;
      const status = str(input.status);
      if (status) {
        updates.status = status;
        if (status === "completed") updates.completed_at = new Date().toISOString();
      }
      if (typeof input.due_date === "string") updates.due_date = input.due_date.trim() || null;
      if (Object.keys(updates).length === 0) return { error: "No fields to update" };
      await db.update(milestones).set(updates).where(eq(milestones.id, milestone.id));
      if (status === "completed") {
        await db.insert(activity_log).values({ goal_id: goal.id, milestone_id: milestone.id, action: "milestone_completed", metadata: { via: "ai" } });
      } else if (status) {
        await db.insert(activity_log).values({ goal_id: goal.id, milestone_id: milestone.id, action: "milestone_status_changed", metadata: { status, via: "ai" } });
      }
      const displayTitle = newTitle ?? milestone.title;
      return {
        summary: `Updated milestone "${displayTitle}" on goal "${goal.title}"`,
        data: { goal_id: goal.id, milestone_id: milestone.id, updated: Object.keys(updates) },
      };
    },
  },
  {
    name: "create_task",
    description:
      "Create a CRM follow-up task (call, email, meeting, lunch, etc.), optionally linked to a company or contact by name. Use type 'meeting' for lunches and in-person meetings. Put time and location in notes (due_date is date-only).",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        company_name: { type: "string" },
        contact_name: { type: "string", description: "Fuzzy match to link a CRM contact (e.g. 'Patrick Dore')" },
        type: { type: "string", enum: ["call", "email", "meeting", "task", "document"] },
        priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
        due_date: { type: "string", description: "ISO date YYYY-MM-DD" },
        notes: { type: "string", description: "Time, location, agenda, or other details (e.g. '11:30 AM at Yard House, Palm Beach Gardens')" },
      },
      required: ["title"],
    },
    mutates: true,
    handler: async ({ userId }, input) => {
      const title = str(input.title);
      if (!title) return { error: "title required" };
      const customer = await findCustomer(userId, str(input.company_name));
      const contact = await findContact(userId, str(input.contact_name));
      const [row] = await db
        .insert(crm_tasks)
        .values({
          user_id: userId,
          customer_id: customer?.id ?? contact?.customer_id ?? null,
          contact_id: contact?.id ?? null,
          title,
          type: (str(input.type) as string) || "task",
          priority: (str(input.priority) as string) || "medium",
          due_date: str(input.due_date) || null,
          notes: str(input.notes) ?? null,
        })
        .returning();
      const who = contact
        ? `${contact.first_name} ${contact.last_name}`.trim()
        : customer?.name;
      return {
        summary: `Created task “${title}”${who ? ` with ${who}` : ""}`,
        data: { task_id: row.id, notes: row.notes },
      };
    },
  },
];

export const TOOLS_BY_NAME = new Map(TOOLS.map((t) => [t.name, t]));
