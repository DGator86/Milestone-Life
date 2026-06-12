"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Handshake,
  Target,
  Zap,
  CheckSquare,
  ChevronRight,
  UserRound,
  Plus,
  Trash2,
  CheckCircle,
  X,
} from "lucide-react";
import { completeMilestone } from "@/app/dashboard/actions";
import { createTask, deleteTask, toggleTaskDone } from "@/app/dashboard/task-actions";
import { createOpportunity, deleteOpportunity } from "@/app/opportunities/actions";
import { deleteGoal, deleteMilestone } from "@/app/goals/actions";
import { confirmDestructive } from "@/lib/confirmDestructive";
import type { GoalWithDetails, Milestone } from "@/lib/types";

export type CrmEntityContext = {
  contactId?: string;
  customerId?: string | null;
};

export function DetailSection({
  title,
  count,
  icon: Icon,
  onAdd,
  addLabel = "Add",
  children,
}: {
  title: string;
  count?: number;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  onAdd?: () => void;
  addLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="ms-card">
      <div className="ms-card-header">
        {Icon && <Icon size={14} className="text-milestone-blue shrink-0" />}
        <h2 className="text-xs font-semibold text-gray-500 dark:text-white/55 flex-1">{title}</h2>
        {count != null && (
          <span className="text-[10px] font-bold text-gray-300 dark:text-white/35 tabular-nums">{count}</span>
        )}
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-milestone-blue hover:underline shrink-0"
          >
            <Plus size={12} />
            {addLabel}
          </button>
        )}
      </div>
      <div className="ms-card-body">{children}</div>
    </section>
  );
}

export function EntityChip({
  href,
  label,
  icon: Icon,
  variant = "blue",
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  variant?: "blue" | "green" | "gray";
}) {
  const styles = {
    blue: "text-milestone-blue bg-milestone-blue-dim hover:bg-blue-100 dark:hover:bg-white/10",
    green: "text-milestone-green bg-milestone-green-dim hover:bg-green-100 dark:hover:bg-white/10",
    gray: "text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/15",
  };
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-2.5 py-1.5 transition-colors ${styles[variant]}`}
    >
      <Icon size={13} />
      {label}
    </Link>
  );
}

export function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-400 dark:text-white/40 text-center py-4">{children}</p>;
}

function ItemRow({
  href,
  children,
  onComplete,
  onDelete,
  completeLabel = "Mark done",
  deleteLabel = "Delete",
  pending,
}: {
  href: string;
  children: React.ReactNode;
  onComplete?: () => void;
  onDelete?: () => void;
  completeLabel?: string;
  deleteLabel?: string;
  pending?: boolean;
}) {
  return (
    <div
      className={`flex items-stretch gap-1 rounded-xl border border-milestone-line dark:border-white/[0.08] hover:bg-gray-50/80 dark:hover:bg-white/[0.03] transition-colors group ${pending ? "opacity-60" : ""}`}
    >
      <Link href={href} className="flex flex-1 items-center gap-3 px-3.5 py-3 min-w-0">
        {children}
      </Link>
      {(onComplete || onDelete) && (
        <div className="flex flex-col justify-center gap-1 pr-2 shrink-0">
          {onComplete && (
            <button
              type="button"
              onClick={onComplete}
              className="p-1.5 rounded-lg text-gray-300 dark:text-white/30 hover:text-milestone-green hover:bg-milestone-green-dim transition-colors"
              aria-label={completeLabel}
              title={completeLabel}
            >
              <CheckCircle size={15} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 rounded-lg text-gray-300 dark:text-white/30 hover:text-milestone-red hover:bg-milestone-red-dim transition-colors"
              aria-label={deleteLabel}
              title={deleteLabel}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function QuickAddForm({
  placeholder,
  onSubmit,
  onCancel,
  pending,
}: {
  placeholder: string;
  onSubmit: (title: string) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [title, setTitle] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setTitle("");
  }

  return (
    <form onSubmit={handleSubmit} className="mb-3 flex items-center gap-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={placeholder}
        className="ms-input flex-1 py-1.5 text-sm"
        autoFocus
        disabled={pending}
      />
      <button
        type="submit"
        disabled={pending || !title.trim()}
        className="px-3 py-1.5 text-xs font-semibold bg-milestone-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
      >
        Save
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="p-1.5 text-gray-400 hover:text-gray-600"
        aria-label="Cancel"
      >
        <X size={16} />
      </button>
    </form>
  );
}

function openGoalWizard() {
  try {
    sessionStorage.setItem("goal_prefill", JSON.stringify({}));
  } catch {}
  window.location.href = "/dashboard";
}

export function KillListItems({
  items,
  context,
}: {
  items: Array<{ goal: GoalWithDetails; milestone: Milestone }>;
  context?: CrmEntityContext;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function refresh() {
    router.refresh();
    if (context?.contactId) router.refresh();
  }

  function handleComplete(milestoneId: string, goalId: string) {
    startTransition(async () => {
      await completeMilestone(milestoneId, goalId);
      refresh();
    });
  }

  function handleDelete(milestone: Milestone, goal: GoalWithDetails) {
    if (!confirmDestructive(`Delete milestone "${milestone.title}" from "${goal.title}"?`)) return;
    startTransition(async () => {
      await deleteMilestone(milestone.id, goal.id);
      refresh();
    });
  }

  if (!items.length) {
    return <EmptyHint>No active milestones to work right now.</EmptyHint>;
  }

  return (
    <div className="space-y-2">
      {items.map(({ goal, milestone }) => (
        <ItemRow
          key={`${goal.id}-${milestone.id}`}
          href={`/goals/${goal.id}`}
          pending={pending}
          onComplete={() => handleComplete(milestone.id, goal.id)}
          onDelete={() => handleDelete(milestone, goal)}
          completeLabel={`Mark "${milestone.title}" done`}
          deleteLabel={`Delete milestone "${milestone.title}"`}
        >
          <div className="w-6 h-6 rounded-full border-2 border-milestone-blue flex items-center justify-center shrink-0">
            <Zap size={11} className="text-milestone-blue" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug group-hover:text-milestone-blue transition-colors">
              {milestone.title}
            </p>
            <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5 truncate">{goal.title}</p>
          </div>
          <ChevronRight size={14} className="text-gray-300 dark:text-white/25 shrink-0 group-hover:text-milestone-blue" />
        </ItemRow>
      ))}
    </div>
  );
}

export function GoalListItems({
  goals,
}: {
  goals: GoalWithDetails[];
  context?: CrmEntityContext;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function refresh() {
    router.refresh();
  }

  function handleDelete(goal: GoalWithDetails) {
    if (
      !confirmDestructive(
        `Delete "${goal.title}"? This removes the goal and all its milestones permanently.`
      )
    ) {
      return;
    }
    startTransition(async () => {
      await deleteGoal(goal.id);
      refresh();
    });
  }

  if (!goals.length) {
    return <EmptyHint>No active goals linked yet.</EmptyHint>;
  }

  return (
    <div className="space-y-2">
      {goals.map((goal) => {
        const completed = goal.milestones.filter((m) => m.status === "completed").length;
        const total = goal.milestones.length;
        const pct = total ? Math.round((completed / total) * 100) : 0;
        return (
          <ItemRow
            key={goal.id}
            href={`/goals/${goal.id}`}
            pending={pending}
            onDelete={() => handleDelete(goal)}
            deleteLabel={`Delete goal "${goal.title}"`}
          >
            <div className="w-8 h-8 rounded-lg bg-milestone-blue-dim flex items-center justify-center shrink-0">
              <Target size={14} className="text-milestone-blue" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-milestone-blue transition-colors">
                {goal.title}
              </p>
              <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">
                {completed}/{total} milestones · {pct}%
              </p>
            </div>
            <ChevronRight size={14} className="text-gray-300 dark:text-white/25 shrink-0 group-hover:text-milestone-blue" />
          </ItemRow>
        );
      })}
    </div>
  );
}

export function OpportunityListItems({
  opportunities,
  showContact = false,
  showCompany = false,
  context,
  adding = false,
  onAddingChange,
}: {
  opportunities: Array<{
    id: string;
    title: string;
    stage: string;
    value: string | null;
    crm_customers?: { id: string; name: string } | null;
    crm_contacts?: { id: string; first_name: string; last_name: string } | null;
  }>;
  showContact?: boolean;
  showCompany?: boolean;
  context?: CrmEntityContext;
  adding?: boolean;
  onAddingChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function refresh() {
    router.refresh();
  }

  function handleDelete(opp: { id: string; title: string }) {
    if (!confirmDestructive(`Delete "${opp.title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteOpportunity(opp.id);
      refresh();
    });
  }

  function handleCreate(title: string) {
    const formData = new FormData();
    formData.set("title", title);
    formData.set("stage", "Lead");
    if (context?.contactId) formData.set("contact_id", context.contactId);
    if (context?.customerId) formData.set("customer_id", context.customerId);
    startTransition(async () => {
      await createOpportunity(formData);
      onAddingChange?.(false);
      refresh();
    });
  }

  return (
    <>
      {adding && (
        <QuickAddForm
          placeholder="Opportunity title"
          pending={pending}
          onCancel={() => onAddingChange?.(false)}
          onSubmit={handleCreate}
        />
      )}
      {!opportunities.length ? (
        <EmptyHint>No open opportunities.</EmptyHint>
      ) : (
        <div className="space-y-2">
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              className={`rounded-xl border border-milestone-line dark:border-white/[0.08] hover:bg-gray-50/80 dark:hover:bg-white/[0.03] transition-colors ${pending ? "opacity-60" : ""}`}
            >
              <div className="flex items-stretch gap-1">
                <Link
                  href={`/opportunities?highlight=${opp.id}`}
                  className="flex flex-1 items-center gap-3 px-3.5 py-3 min-w-0 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-milestone-green-dim flex items-center justify-center shrink-0">
                    <Handshake size={14} className="text-milestone-green" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-milestone-blue transition-colors">
                      {opp.title}
                    </p>
                    <span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/60 mt-0.5">
                      {opp.stage}
                    </span>
                  </div>
                  {opp.value != null && (
                    <span className="text-xs font-bold text-milestone-blue shrink-0 tabular-nums">
                      ${parseFloat(opp.value).toLocaleString()}
                    </span>
                  )}
                  <ChevronRight size={14} className="text-gray-300 dark:text-white/25 shrink-0 group-hover:text-milestone-blue" />
                </Link>
                <div className="flex flex-col justify-center gap-1 pr-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDelete(opp)}
                    className="p-1.5 rounded-lg text-gray-300 dark:text-white/30 hover:text-milestone-red hover:bg-milestone-red-dim transition-colors"
                    aria-label={`Delete opportunity "${opp.title}"`}
                    title={`Delete opportunity "${opp.title}"`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              {(showCompany && opp.crm_customers) || (showContact && opp.crm_contacts) ? (
                <div className="flex flex-wrap items-center gap-3 px-3.5 pb-2.5 pl-[3.25rem]">
                  {showCompany && opp.crm_customers && (
                    <Link
                      href={`/customers/${opp.crm_customers.id}`}
                      className="text-[10px] text-milestone-blue flex items-center gap-0.5 hover:underline"
                    >
                      <Building2 size={10} />
                      {opp.crm_customers.name}
                    </Link>
                  )}
                  {showContact && opp.crm_contacts && (
                    <Link
                      href={`/contacts/${opp.crm_contacts.id}`}
                      className="text-[10px] text-gray-500 dark:text-white/50 flex items-center gap-0.5 hover:text-milestone-blue hover:underline"
                    >
                      <UserRound size={10} />
                      {opp.crm_contacts.first_name} {opp.crm_contacts.last_name}
                    </Link>
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export function TaskListItems({
  tasks,
  context,
  adding = false,
  onAddingChange,
}: {
  tasks: Array<{ id: string; title: string; priority: string; due_date: string | null }>;
  context?: CrmEntityContext;
  adding?: boolean;
  onAddingChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function refresh() {
    router.refresh();
  }

  function handleComplete(task: { id: string; title: string }) {
    startTransition(async () => {
      await toggleTaskDone(task.id, true);
      refresh();
    });
  }

  function handleDelete(task: { id: string; title: string }) {
    if (!confirmDestructive(`Delete task "${task.title}"?`)) return;
    startTransition(async () => {
      await deleteTask(task.id);
      refresh();
    });
  }

  function handleCreate(title: string) {
    const formData = new FormData();
    formData.set("title", title);
    formData.set("type", "task");
    formData.set("priority", "medium");
    if (context?.contactId) formData.set("contact_id", context.contactId);
    if (context?.customerId) formData.set("customer_id", context.customerId);
    startTransition(async () => {
      await createTask(formData);
      onAddingChange?.(false);
      refresh();
    });
  }

  return (
    <>
      {adding && (
        <QuickAddForm
          placeholder="Task title"
          pending={pending}
          onCancel={() => onAddingChange?.(false)}
          onSubmit={handleCreate}
        />
      )}
      {!tasks.length ? (
        <EmptyHint>No open tasks.</EmptyHint>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <ItemRow
              key={task.id}
              href={`/tasks/${task.id}`}
              pending={pending}
              onComplete={() => handleComplete(task)}
              onDelete={() => handleDelete(task)}
              completeLabel={`Mark "${task.title}" done`}
              deleteLabel={`Delete task "${task.title}"`}
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                <CheckSquare size={14} className="text-gray-500 dark:text-white/60" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-milestone-blue transition-colors">
                  {task.title}
                </p>
                <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5 capitalize">
                  {task.priority} priority
                  {task.due_date &&
                    ` · Due ${new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                </p>
              </div>
              <ChevronRight size={14} className="text-gray-300 dark:text-white/25 shrink-0 group-hover:text-milestone-blue" />
            </ItemRow>
          ))}
        </div>
      )}
    </>
  );
}

export function ContactListItems({
  contacts,
}: {
  contacts: Array<{ id: string; first_name: string; last_name: string; title: string | null }>;
}) {
  if (!contacts.length) {
    return <EmptyHint>No contacts linked.</EmptyHint>;
  }
  return (
    <div className="space-y-2">
      {contacts.map((ct) => {
        const initials = `${ct.first_name[0]}${ct.last_name[0]}`.toUpperCase();
        return (
          <Link
            key={ct.id}
            href={`/contacts/${ct.id}`}
            className="flex items-center gap-3 rounded-xl border border-milestone-line dark:border-white/[0.08] px-3.5 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-milestone-blue flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-milestone-blue transition-colors">
                {ct.first_name} {ct.last_name}
              </p>
              {ct.title && <p className="text-xs text-gray-400 dark:text-white/40 truncate">{ct.title}</p>}
            </div>
            <ChevronRight size={14} className="text-gray-300 dark:text-white/25 shrink-0 group-hover:text-milestone-blue" />
          </Link>
        );
      })}
    </div>
  );
}

/** All related CRM sections with add buttons and row actions. */
export function CrmRelatedSections({
  killList,
  goals,
  opportunities,
  tasks,
  context,
  showCompany = false,
  showContact = false,
}: {
  killList: Array<{ goal: GoalWithDetails; milestone: Milestone }>;
  goals: GoalWithDetails[];
  opportunities: Array<{
    id: string;
    title: string;
    stage: string;
    value: string | null;
    crm_customers?: { id: string; name: string } | null;
    crm_contacts?: { id: string; first_name: string; last_name: string } | null;
  }>;
  tasks: Array<{ id: string; title: string; priority: string; due_date: string | null }>;
  context: CrmEntityContext;
  showCompany?: boolean;
  showContact?: boolean;
}) {
  const [addOpp, setAddOpp] = useState(false);
  const [addTask, setAddTask] = useState(false);

  return (
    <>
      <DetailSection title="Milestones to Kill" count={killList.length} icon={Zap}>
        <KillListItems items={killList} context={context} />
      </DetailSection>

      <DetailSection
        title="Active Goals"
        count={goals.length}
        icon={Target}
        onAdd={openGoalWizard}
        addLabel="New goal"
      >
        <GoalListItems goals={goals} context={context} />
      </DetailSection>

      <DetailSection
        title="Open Opportunities"
        count={opportunities.length}
        icon={Handshake}
        onAdd={() => setAddOpp(true)}
        addLabel="Add"
      >
        <OpportunityListItems
          opportunities={opportunities}
          showCompany={showCompany}
          showContact={showContact}
          context={context}
          adding={addOpp}
          onAddingChange={setAddOpp}
        />
      </DetailSection>

      <DetailSection
        title="Open Tasks"
        count={tasks.length}
        icon={CheckSquare}
        onAdd={() => setAddTask(true)}
        addLabel="Add"
      >
        <TaskListItems
          tasks={tasks}
          context={context}
          adding={addTask}
          onAddingChange={setAddTask}
        />
      </DetailSection>
    </>
  );
}
