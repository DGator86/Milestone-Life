export interface AppUser {
  id: string;
  email?: string | null;
}

export type MilestoneStatus = "upcoming" | "in_progress" | "waiting" | "completed" | "stuck";
export type GoalStatus = "active" | "archived" | "completed";
export type GoalType = "concrete" | "touches" | "deadline" | "maintenance";
export type GoalImportance = "normal" | "important" | "critical";
export type RecurrenceUnit = "day" | "week" | "month" | "year";
export type TouchType = "call" | "email" | "meeting" | "note";
export type ContactStatus = "active" | "archived";

export interface Group {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  sort_order: number;
  created_at: string;
}

export interface Contact {
  id: string;
  user_id: string;
  list_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  role: string | null;
  notes: string | null;
  touch_frequency_days: number | null;
  last_touched_at: string | null;
  status: ContactStatus;
  created_at: string;
  updated_at: string;
  groups?: Group;
}

export interface Touch {
  id: string;
  user_id: string;
  contact_id: string;
  deal_id: string | null;
  type: TouchType;
  notes: string | null;
  touched_at: string;
  created_at: string;
  contacts?: Contact;
}

export interface Goal {
  id: string;
  user_id: string;
  group_id: string;
  contact_id: string | null;
  customer_id: string | null;
  opportunity_id: string | null;
  title: string;
  goal_type: GoalType;
  importance: GoalImportance;
  status: GoalStatus;
  due_date: string | null;
  is_recurring: boolean;
  recurrence_interval: number | null;
  recurrence_unit: RecurrenceUnit | null;
  recurrence_end_date: string | null;
  pinned: boolean;
  created_at: string;
  updated_at: string;
  groups?: Group;
  milestones?: Milestone[];
  contacts?: Contact;
  crm_customers?: Pick<CrmCustomer, "id" | "name"> | null;
  crm_opportunities?: Pick<CrmOpportunity, "id" | "title"> | null;
}

export interface Milestone {
  id: string;
  goal_id: string;
  title: string;
  position: number;
  status: MilestoneStatus;
  due_date: string | null;
  touch_target: number | null;
  touch_period: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  goal_id: string;
  milestone_id: string | null;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface GoalWithDetails extends Goal {
  groups: Group;
  milestones: Milestone[];
}

// ─── CRM ───────────────────────────────────────────────────────────────────────

export type CustomerStatus = "prospect" | "active" | "inactive";
export type OpportunityStatus = "open" | "won" | "lost";

export interface CrmCustomer {
  id: string;
  user_id: string;
  name: string;
  customer_type: string | null;
  industry: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  status: CustomerStatus;
  notes: string | null;
  custom: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CrmContact {
  id: string;
  user_id: string;
  customer_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  notes: string | null;
  custom: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  crm_customers?: Pick<CrmCustomer, "id" | "name"> | null;
}

export interface CrmFlow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  stages: string[];
  created_at: string;
  updated_at: string;
}

export interface CrmOpportunity {
  id: string;
  user_id: string;
  customer_id: string | null;
  contact_id: string | null;
  flow_id: string | null;
  title: string;
  value: number | null;
  stage: string;
  status: OpportunityStatus;
  close_date: string | null;
  notes: string | null;
  custom: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  crm_customers?: Pick<CrmCustomer, "id" | "name"> | null;
  crm_contacts?: Pick<CrmContact, "id" | "first_name" | "last_name"> | null;
  crm_flows?: Pick<CrmFlow, "id" | "name" | "stages"> | null;
}

export interface ContactWithDetails extends Contact {
  groups?: Group;
  touches?: Touch[];
}

export interface CrmFlowInstance {
  id: string;
  user_id: string;
  flow_id: string;
  customer_id: string | null;
  current_stage_idx: number;
  run_count: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  crm_flows?: Pick<CrmFlow, "id" | "name" | "stages" | "color">;
  crm_customers?: Pick<CrmCustomer, "id" | "name"> | null;
}

export type TaskType = "call" | "email" | "meeting" | "task" | "document";
export type TaskPriority = "critical" | "high" | "medium" | "low";

export interface CrmTask {
  id: string;
  user_id: string;
  customer_id: string | null;
  contact_id: string | null;
  opportunity_id: string | null;
  title: string;
  type: TaskType;
  priority: TaskPriority;
  due_date: string | null;
  done: boolean;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  crm_customers?: Pick<CrmCustomer, "id" | "name"> | null;
  crm_contacts?: Pick<CrmContact, "id" | "first_name" | "last_name"> | null;
}
