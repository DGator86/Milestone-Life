"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  Phone,
  Mail,
  Calendar,
  Users,
  FileText,
  Plus,
  X,
  Trash2,
  ListChecks,
  CheckCircle,
} from "lucide-react";
import { groupTasks } from "@/lib/tasks";
import { createTask, toggleTaskDone, deleteTask } from "@/app/dashboard/task-actions";
import { completeMilestone } from "@/app/dashboard/actions";
import {
  groupOpenMilestones,
  MILESTONE_BUCKET_ORDER,
  MILESTONE_BUCKET_LABELS,
  type MilestoneBucket,
  type OpenMilestoneItem,
} from "@/lib/milestoneBuckets";
import { buildMailtoLink, isEmailMilestone } from "@/lib/milestoneEmail";
import type { CrmTask, TaskType, TaskPriority, CrmCustomer } from "@/lib/types";
import type { GoalWithDetails } from "@/lib/types";

const TYPE_ICON: Record<TaskType, React.ComponentType<{ size?: number; className?: string }>> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  task: Users,
  document: FileText,
};

const NEUTRAL_BADGE = "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/70";

const TYPE_TINT: Record<TaskType, string> = {
  call: "bg-milestone-green-dim text-milestone-green",
  email: "bg-milestone-blue-dim text-milestone-blue",
  meeting: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300",
  task: "bg-milestone-amber-dim text-milestone-amber",
  document: NEUTRAL_BADGE,
};

const PRIORITY_META: Record<TaskPriority, string> = {
  critical: "text-milestone-red",
  high: "text-milestone-amber",
  medium: "text-gray-400",
  low: "text-gray-300",
};

const BUCKET_TONE: Record<MilestoneBucket, string> = {
  overdue: "bg-milestone-red-dim text-milestone-red",
  today: "bg-milestone-amber-dim text-milestone-amber",
  tomorrow: "bg-milestone-blue-dim text-milestone-blue",
  week: NEUTRAL_BADGE,
  later: NEUTRAL_BADGE,
  noDate: NEUTRAL_BADGE,
};

const IMPORTANCE_BADGE: Record<string, string> = {
  critical: "bg-milestone-red-dim text-milestone-red",
  important: "bg-milestone-amber-dim text-milestone-amber",
  normal: NEUTRAL_BADGE,
};

const INPUT = "ms-input";

function fmtMilestoneDate(daysUntil: number | null): { label: string; color: string } {
  if (daysUntil === null) return { label: "No date", color: "text-gray-300" };
  if (daysUntil < 0) return { label: `${Math.abs(daysUntil)}d overdue`, color: "text-milestone-red" };
  if (daysUntil === 0) return { label: "Today", color: "text-milestone-amber" };
  if (daysUntil === 1) return { label: "Tomorrow", color: "text-gray-400" };
  return { label: `${daysUntil}d left`, color: "text-gray-400" };
}

function MilestoneGoalRow({
  item,
  onComplete,
}: {
  item: OpenMilestoneItem;
  onComplete: (milestoneId: string, goalId: string) => void;
}) {
  const { label, color } = fmtMilestoneDate(item.daysUntil);
  const mailto =
    isEmailMilestone(item.milestone.title)
      ? buildMailtoLink(item.milestone.title, { goal: item.goal })
      : null;

  const titleEl = mailto ? (
    <a
      href={mailto}
      className="text-sm font-semibold leading-snug truncate text-milestone-blue hover:underline block"
      onClick={(e) => e.stopPropagation()}
    >
      {item.milestone.title}
    </a>
  ) : (
    <Link
      href={`/goals/${item.goal.id}`}
      className="text-sm font-semibold leading-snug truncate text-gray-900 dark:text-white hover:text-milestone-blue block"
    >
      {item.milestone.title}
    </Link>
  );

  return (
    <div className="group flex items-center gap-3 px-4 py-3.5 active:bg-gray-50/60 dark:active:bg-white/[0.03] transition-colors">
      <div className="flex-1 min-w-0">
        {titleEl}
        <Link
          href={`/goals/${item.goal.id}`}
          className="text-xs text-gray-400 dark:text-white/40 truncate hover:text-milestone-blue block"
        >
          {item.goal.title}
        </Link>
      </div>
      <span
        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${
          IMPORTANCE_BADGE[item.goal.importance] ?? IMPORTANCE_BADGE.normal
        }`}
      >
        {item.goal.importance}
      </span>
      <div className="text-right shrink-0">
        <p className={`text-[11px] font-semibold ${color}`}>{label}</p>
      </div>
      <button
        onClick={() => onComplete(item.milestone.id, item.goal.id)}
        className="ms-touch-icon ms-row-complete text-gray-300 dark:text-white/25 active:text-milestone-green shrink-0"
        aria-label="Complete milestone"
      >
        <CheckCircle size={20} />
      </button>
    </div>
  );
}

function fmtDue(d: string | null) {
  if (!d) return "—";
  const [y, m, day] = d.split("-").map(Number);
  const date = new Date(y, m - 1, day);
  const today = new Date();
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const d0 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.round((d0.getTime() - t0.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: CrmTask;
  onToggle: (id: string, done: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const Icon = TYPE_ICON[task.type];
  const titleEl =
    task.type === "email" ? (
      <a
        href={buildMailtoLink(task.title) ?? `mailto:?subject=${encodeURIComponent(task.title)}`}
        className={`text-sm font-semibold leading-snug truncate block hover:underline ${
          task.done ? "text-gray-300 line-through" : "text-milestone-blue"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {task.title}
      </a>
    ) : (
      <p
        className={`text-sm font-semibold leading-snug truncate ${
          task.done ? "text-gray-300 dark:text-white/20 line-through" : "text-gray-900 dark:text-white"
        }`}
      >
        {task.title}
      </p>
    );

  return (
    <div className="group flex items-center gap-3 px-4 py-3.5 active:bg-gray-50/60 dark:active:bg-white/[0.03] transition-colors">
      <button
        onClick={() => onToggle(task.id, !task.done)}
        className={`w-6 h-6 rounded-lg border-2 shrink-0 flex items-center justify-center transition-colors touch-manipulation ${
          task.done
            ? "bg-milestone-blue border-milestone-blue"
            : "border-gray-300 active:border-milestone-blue"
        }`}
        aria-label="Toggle done"
      >
        {task.done && (
          <svg width="11" height="11" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 5l2.2 2.2L8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${TYPE_TINT[task.type]}`}>
        <Icon size={15} />
      </div>

      <div className="flex-1 min-w-0">
        {titleEl}
        {(task.notes || task.crm_customers?.name) && (
          <p className="text-xs text-gray-400 truncate">
            {[task.notes, task.crm_customers?.name].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      <div className="text-right shrink-0">
        <p className="text-[11px] text-gray-400">{fmtDue(task.due_date)}</p>
        <p className={`text-[11px] font-bold capitalize ${PRIORITY_META[task.priority]}`}>
          {task.priority}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onDelete(task.id)}
        className="ms-touch-icon ms-row-complete text-gray-300 dark:text-white/25 active:text-milestone-red shrink-0"
        aria-label="Delete task"
        title="Delete task"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function TaskGroup({
  label,
  tone,
  tasks,
  onToggle,
  onDelete,
}: {
  label: string;
  tone: string;
  tasks: CrmTask[];
  onToggle: (id: string, done: boolean) => void;
  onDelete: (id: string) => void;
}) {
  if (tasks.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <span className="text-[11px] font-medium text-gray-500">{label}</span>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${tone}`}>
          {tasks.length}
        </span>
      </div>
      <div className="divide-y divide-milestone-line/70">
        {tasks.map((t) => (
          <TaskRow key={t.id} task={t} onToggle={onToggle} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

function MilestoneGroup({
  bucket,
  items,
  onComplete,
}: {
  bucket: MilestoneBucket;
  items: OpenMilestoneItem[];
  onComplete: (milestoneId: string, goalId: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <span className="text-[11px] font-medium text-gray-500">{MILESTONE_BUCKET_LABELS[bucket]}</span>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${BUCKET_TONE[bucket]}`}>
          {items.length}
        </span>
      </div>
      <div className="divide-y divide-milestone-line/70">
        {items.map((item) => (
          <MilestoneGoalRow key={item.milestone.id} item={item} onComplete={onComplete} />
        ))}
      </div>
    </div>
  );
}

interface Props {
  tasks: CrmTask[];
  customers: Pick<CrmCustomer, "id" | "name">[];
  goals: GoalWithDetails[];
}

export default function KillList({ tasks, customers, goals }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const groups = useMemo(() => groupTasks(tasks), [tasks]);
  const milestoneGroups = useMemo(() => groupOpenMilestones(goals), [goals]);
  const milestoneCount = MILESTONE_BUCKET_ORDER.reduce((n, k) => n + milestoneGroups[k].length, 0);
  const openCount = tasks.filter((t) => !t.done).length;

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      await createTask(formData);
      form.reset();
      setShowForm(false);
    });
  }

  function handleToggle(id: string, done: boolean) {
    startTransition(() => toggleTaskDone(id, done));
  }

  function handleDelete(id: string) {
    const task = tasks.find((t) => t.id === id);
    const label = task?.title ?? "this task";
    if (!window.confirm(`Delete "${label}"?`)) return;
    startTransition(() => deleteTask(id));
  }

  function handleComplete(milestoneId: string, goalId: string) {
    startTransition(() => completeMilestone(milestoneId, goalId));
  }

  return (
    <section className="ms-card-app overflow-hidden flex flex-col" style={{ opacity: isPending ? 0.7 : 1 }}>
      <div className="flex items-start justify-between px-4 pt-4 pb-3 border-b border-milestone-line dark:border-white/[0.06]">
        <div>
          <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">Kill list</h2>
          <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5">
            {openCount + milestoneCount} open actions
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="ms-btn-ghost text-milestone-blue hover:bg-milestone-blue-dim min-h-[44px] min-w-[44px] justify-center touch-manipulation"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? "Cancel" : "Add"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="p-4 space-y-3 border-b border-milestone-line bg-gray-50/50 animate-fade-up">
          <input name="title" required autoFocus placeholder="What needs doing?" className={INPUT} />
          <div className="grid grid-cols-2 gap-2">
            <select name="type" className={INPUT} defaultValue="call">
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="meeting">Meeting</option>
              <option value="task">Task</option>
              <option value="document">Document</option>
            </select>
            <select name="priority" className={INPUT} defaultValue="medium">
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input name="due_date" type="date" className={INPUT} />
            <select name="customer_id" className={INPUT} defaultValue="">
              <option value="">No company</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-milestone-blue text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            Add to Kill List
          </button>
        </form>
      )}

      <div className="flex-1 md:overflow-y-auto md:max-h-[calc(100vh-220px)]">
        {milestoneCount > 0 && (
          <div>
            <div className="flex items-center gap-2 px-4 pt-3 pb-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Goal milestones</span>
            </div>
            {MILESTONE_BUCKET_ORDER.map((bucket) => (
              <MilestoneGroup
                key={bucket}
                bucket={bucket}
                items={milestoneGroups[bucket]}
                onComplete={handleComplete}
              />
            ))}
          </div>
        )}

        {milestoneCount > 0 && openCount > 0 && (
          <div className="mx-4 my-2 border-t border-milestone-line/50" />
        )}

        {openCount === 0 && milestoneCount === 0 ? (
          <div className="p-8 text-center">
            <ListChecks size={28} className="mx-auto mb-2 text-gray-200" />
            <p className="text-sm font-medium text-gray-400 dark:text-white/30">Nothing on the list.</p>
            <p className="text-xs text-gray-300 dark:text-white/20 mt-1">You&apos;re all caught up.</p>
          </div>
        ) : openCount > 0 ? (
          <>
            <div className="flex items-center gap-2 px-4 pt-3 pb-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">CRM tasks</span>
            </div>
            <TaskGroup label="Overdue" tone="bg-milestone-red-dim text-milestone-red" tasks={groups.overdue} onToggle={handleToggle} onDelete={handleDelete} />
            <TaskGroup label="Today" tone="bg-milestone-blue-dim text-milestone-blue" tasks={groups.today} onToggle={handleToggle} onDelete={handleDelete} />
            <TaskGroup label="Upcoming This Week" tone={NEUTRAL_BADGE} tasks={groups.upcoming} onToggle={handleToggle} onDelete={handleDelete} />
            <TaskGroup label="Later" tone={NEUTRAL_BADGE} tasks={groups.later} onToggle={handleToggle} onDelete={handleDelete} />
          </>
        ) : null}
      </div>
    </section>
  );
}
