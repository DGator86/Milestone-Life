import { pgTable, uuid, text, integer, boolean, timestamp, date, jsonb, numeric, index, type AnyPgColumn } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

const id = uuid("id").primaryKey().default(sql`gen_random_uuid()`);
const ts = (col: string) => timestamp(col, { withTimezone: true, mode: "string" }).notNull().defaultNow();

// ─── Users ─────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id,
  email: text("email").notNull().unique(),
  password_hash: text("password_hash"), // nullable — OAuth users have no password
  name: text("name"),
  is_admin: boolean("is_admin").notNull().default(true),
  workspace_id: uuid("workspace_id").references((): AnyPgColumn => workspaces.id, { onDelete: "set null" }),
  stripe_customer_id: text("stripe_customer_id"),
  subscription_status: text("subscription_status").notNull().default("free"),
  created_at: ts("created_at"),
}, (t) => [index("users_workspace_id_idx").on(t.workspace_id)]);

// ─── Workspaces ──────────────────────────────────────────────────────────────────
// A shared container for a team. All of a workspace's data is stored under its
// owner_id, so every member resolves to the same owner id and sees one shared
// dataset. Each account starts in its own workspace; admins invite members in.
// owner_id is unique (one workspace per owner) so bootstrap is race-safe, and
// RESTRICT prevents deleting an owner out from under their members.
export const workspaces = pgTable("workspaces", {
  id,
  name: text("name").notNull().default("My Workspace"),
  owner_id: uuid("owner_id").notNull().unique().references(() => users.id, { onDelete: "restrict" }),
  created_at: ts("created_at"),
  updated_at: ts("updated_at"),
});

// ─── Workspace settings (per-workspace customization) ───────────────────────────
export const user_settings = pgTable("user_settings", {
  user_id: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  company_name: text("company_name"),
  brand_color: text("brand_color").notNull().default("#1769FF"),
  terminology: jsonb("terminology").$type<Record<string, string>>().notNull().default({}),
  preferences: jsonb("preferences").$type<Record<string, boolean>>().notNull().default({}),
  custom_fields: jsonb("custom_fields").$type<Record<string, unknown>>().notNull().default({}),
  customer_types: jsonb("customer_types").$type<string[]>().notNull().default([]),
  onboarding_completed_at: timestamp("onboarding_completed_at", { withTimezone: true, mode: "string" }),
  created_at: ts("created_at"),
  updated_at: ts("updated_at"),
});

// ─── Password Reset Tokens ─────────────────────────────────────────────────────
export const password_reset_tokens = pgTable("password_reset_tokens", {
  id,
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expires_at: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
  used_at: timestamp("used_at", { withTimezone: true, mode: "string" }),
  created_at: ts("created_at"),
});

// ─── Groups ────────────────────────────────────────────────────────────────────
export const groups = pgTable("groups", {
  id,
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color"),
  sort_order: integer("sort_order").notNull().default(0),
  created_at: ts("created_at"),
});

// ─── Goals ─────────────────────────────────────────────────────────────────────
export const goals = pgTable("goals", {
  id,
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  group_id: uuid("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  contact_id: uuid("contact_id"),
  customer_id: uuid("customer_id"),
  opportunity_id: uuid("opportunity_id"),
  title: text("title").notNull(),
  goal_type: text("goal_type").notNull().default("concrete"),
  importance: text("importance").notNull().default("normal"),
  status: text("status").notNull().default("active"),
  due_date: date("due_date"),
  is_recurring: boolean("is_recurring").notNull().default(false),
  recurrence_interval: integer("recurrence_interval"),
  recurrence_unit: text("recurrence_unit"),
  recurrence_end_date: date("recurrence_end_date"),
  pinned: boolean("pinned").notNull().default(false),
  created_at: ts("created_at"),
  updated_at: ts("updated_at"),
});

// ─── Milestones ────────────────────────────────────────────────────────────────
export const milestones = pgTable("milestones", {
  id,
  goal_id: uuid("goal_id").notNull().references(() => goals.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  position: integer("position").notNull().default(0),
  status: text("status").notNull().default("upcoming"),
  due_date: date("due_date"),
  touch_target: integer("touch_target"),
  touch_period: text("touch_period"),
  completed_at: timestamp("completed_at", { withTimezone: true, mode: "string" }),
  created_at: ts("created_at"),
  updated_at: ts("updated_at"),
});

// ─── Activity Log ───────────────────────────────────────────────────────────────
export const activity_log = pgTable("activity_log", {
  id,
  goal_id: uuid("goal_id").notNull().references(() => goals.id, { onDelete: "cascade" }),
  milestone_id: uuid("milestone_id").references(() => milestones.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  created_at: ts("created_at"),
});

// ─── Personal Contacts (follow-up system) ──────────────────────────────────────
export const contacts = pgTable("contacts", {
  id,
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  list_id: uuid("list_id").references(() => groups.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  role: text("role"),
  notes: text("notes"),
  touch_frequency_days: integer("touch_frequency_days"),
  last_touched_at: timestamp("last_touched_at", { withTimezone: true, mode: "string" }),
  status: text("status").notNull().default("active"),
  created_at: ts("created_at"),
  updated_at: ts("updated_at"),
});

// ─── Touches ───────────────────────────────────────────────────────────────────
export const touches = pgTable("touches", {
  id,
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  contact_id: uuid("contact_id").notNull().references(() => contacts.id, { onDelete: "cascade" }),
  deal_id: uuid("deal_id"),
  type: text("type").notNull(),
  notes: text("notes"),
  touched_at: timestamp("touched_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  created_at: ts("created_at"),
});

// ─── CRM Customers ─────────────────────────────────────────────────────────────
export const crm_customers = pgTable("crm_customers", {
  id,
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  customer_type: text("customer_type"),
  industry: text("industry"),
  website: text("website"),
  phone: text("phone"),
  email: text("email"),
  status: text("status").notNull().default("prospect"),
  notes: text("notes"),
  custom: jsonb("custom").$type<Record<string, unknown>>().notNull().default({}),
  created_at: ts("created_at"),
  updated_at: ts("updated_at"),
});

// ─── CRM Contacts ──────────────────────────────────────────────────────────────
export const crm_contacts = pgTable("crm_contacts", {
  id,
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  customer_id: uuid("customer_id").references(() => crm_customers.id, { onDelete: "set null" }),
  first_name: text("first_name").notNull(),
  last_name: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  title: text("title"),
  notes: text("notes"),
  custom: jsonb("custom").$type<Record<string, unknown>>().notNull().default({}),
  created_at: ts("created_at"),
  updated_at: ts("updated_at"),
});

// ─── CRM Flows ─────────────────────────────────────────────────────────────────
export const crm_flows = pgTable("crm_flows", {
  id,
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").notNull().default("#1769FF"),
  stages: jsonb("stages").$type<string[]>().notNull().default(["Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"]),
  created_at: ts("created_at"),
  updated_at: ts("updated_at"),
});

// ─── CRM Opportunities ─────────────────────────────────────────────────────────
export const crm_opportunities = pgTable("crm_opportunities", {
  id,
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  customer_id: uuid("customer_id").references(() => crm_customers.id, { onDelete: "set null" }),
  contact_id: uuid("contact_id").references(() => crm_contacts.id, { onDelete: "set null" }),
  flow_id: uuid("flow_id").references(() => crm_flows.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  value: numeric("value", { precision: 12, scale: 2 }),
  stage: text("stage").notNull().default("Lead"),
  status: text("status").notNull().default("open"),
  close_date: date("close_date"),
  notes: text("notes"),
  custom: jsonb("custom").$type<Record<string, unknown>>().notNull().default({}),
  created_at: ts("created_at"),
  updated_at: ts("updated_at"),
});

// ─── CRM Tasks ─────────────────────────────────────────────────────────────────
export const crm_tasks = pgTable("crm_tasks", {
  id,
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  customer_id: uuid("customer_id").references(() => crm_customers.id, { onDelete: "set null" }),
  contact_id: uuid("contact_id").references(() => crm_contacts.id, { onDelete: "set null" }),
  opportunity_id: uuid("opportunity_id").references(() => crm_opportunities.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  type: text("type").notNull().default("task"),
  priority: text("priority").notNull().default("medium"),
  due_date: date("due_date"),
  done: boolean("done").notNull().default(false),
  completed_at: timestamp("completed_at", { withTimezone: true, mode: "string" }),
  notes: text("notes"),
  created_at: ts("created_at"),
  updated_at: ts("updated_at"),
});

// ─── CRM Flow Instances ────────────────────────────────────────────────────────
export const crm_flow_instances = pgTable("crm_flow_instances", {
  id,
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  flow_id: uuid("flow_id").notNull().references(() => crm_flows.id, { onDelete: "cascade" }),
  customer_id: uuid("customer_id").references(() => crm_customers.id, { onDelete: "set null" }),
  current_stage_idx: integer("current_stage_idx").notNull().default(0),
  run_count: integer("run_count").notNull().default(1),
  status: text("status").notNull().default("active"),
  notes: text("notes"),
  created_at: ts("created_at"),
  updated_at: ts("updated_at"),
}, (t) => [
  index("crm_flow_instances_user_id_idx").on(t.user_id),
  index("crm_flow_instances_flow_id_idx").on(t.flow_id),
  index("crm_flow_instances_customer_id_idx").on(t.customer_id),
]);

// ─── Relations ─────────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [users.workspace_id], references: [workspaces.id], relationName: "membership" }),
  groups: many(groups),
  goals: many(goals),
  contacts: many(contacts),
  crm_customers: many(crm_customers),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, { fields: [workspaces.owner_id], references: [users.id] }),
  members: many(users, { relationName: "membership" }),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  user: one(users, { fields: [groups.user_id], references: [users.id] }),
  goals: many(goals),
}));

export const goalsRelations = relations(goals, ({ one, many }) => ({
  groups: one(groups, { fields: [goals.group_id], references: [groups.id] }),
  contacts: one(contacts, { fields: [goals.contact_id], references: [contacts.id] }),
  crm_customers: one(crm_customers, { fields: [goals.customer_id], references: [crm_customers.id] }),
  crm_opportunities: one(crm_opportunities, { fields: [goals.opportunity_id], references: [crm_opportunities.id] }),
  milestones: many(milestones),
  activity_log: many(activity_log),
}));

export const milestonesRelations = relations(milestones, ({ one }) => ({
  goal: one(goals, { fields: [milestones.goal_id], references: [goals.id] }),
}));

export const activityLogRelations = relations(activity_log, ({ one }) => ({
  goal: one(goals, { fields: [activity_log.goal_id], references: [goals.id] }),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  user: one(users, { fields: [contacts.user_id], references: [users.id] }),
  groups: one(groups, { fields: [contacts.list_id], references: [groups.id] }),
  touches: many(touches),
}));

export const touchesRelations = relations(touches, ({ one }) => ({
  contact: one(contacts, { fields: [touches.contact_id], references: [contacts.id] }),
}));

export const crmCustomersRelations = relations(crm_customers, ({ one, many }) => ({
  user: one(users, { fields: [crm_customers.user_id], references: [users.id] }),
  crm_contacts: many(crm_contacts),
  crm_opportunities: many(crm_opportunities),
  crm_tasks: many(crm_tasks),
  goals: many(goals),
}));

export const crmContactsRelations = relations(crm_contacts, ({ one }) => ({
  crm_customers: one(crm_customers, { fields: [crm_contacts.customer_id], references: [crm_customers.id] }),
}));

export const crmOpportunitiesRelations = relations(crm_opportunities, ({ one, many }) => ({
  crm_customers: one(crm_customers, { fields: [crm_opportunities.customer_id], references: [crm_customers.id] }),
  crm_contacts: one(crm_contacts, { fields: [crm_opportunities.contact_id], references: [crm_contacts.id] }),
  crm_flows: one(crm_flows, { fields: [crm_opportunities.flow_id], references: [crm_flows.id] }),
  goals: many(goals),
}));

export const crmTasksRelations = relations(crm_tasks, ({ one }) => ({
  crm_customers: one(crm_customers, { fields: [crm_tasks.customer_id], references: [crm_customers.id] }),
  crm_contacts: one(crm_contacts, { fields: [crm_tasks.contact_id], references: [crm_contacts.id] }),
}));

export const crmFlowsRelations = relations(crm_flows, ({ one, many }) => ({
  user: one(users, { fields: [crm_flows.user_id], references: [users.id] }),
  instances: many(crm_flow_instances),
}));

export const crmFlowInstancesRelations = relations(crm_flow_instances, ({ one }) => ({
  crm_flows: one(crm_flows, { fields: [crm_flow_instances.flow_id], references: [crm_flows.id] }),
  crm_customers: one(crm_customers, { fields: [crm_flow_instances.customer_id], references: [crm_customers.id] }),
}));
