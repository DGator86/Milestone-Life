import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { db } from "@/db";
import { crm_tasks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import AppShell from "@/components/layout/AppShell";
import TaskDetailActions from "@/components/tasks/TaskDetailActions";
import { EntityChip } from "@/components/crm/CrmDetailSections";
import {
  ArrowLeft,
  Calendar,
  CheckSquare,
  Building2,
  UserRound,
  StickyNote,
} from "lucide-react";
import type { AppUser, TaskType } from "@/lib/types";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<TaskType, string> = {
  call: "Call",
  email: "Email",
  meeting: "Meeting",
  task: "Task",
  document: "Document",
};

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = await getDataOwnerId();
  const user: AppUser = { id: session.user.id, email: session.user.email };

  const task = await db.query.crm_tasks.findFirst({
    where: and(eq(crm_tasks.id, id), eq(crm_tasks.user_id, userId)),
    with: {
      crm_customers: true,
      crm_contacts: true,
    },
  });

  if (!task) notFound();

  const type = (task.type as TaskType) || "task";
  const dueLabel = task.due_date
    ? new Date(task.due_date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <AppShell user={user}>
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft size={14} />
          Dashboard
        </Link>

        <div className="ms-card p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                <CheckSquare size={20} className="text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                  {TYPE_LABEL[type] ?? "Task"}
                  {task.done && " · Completed"}
                </p>
                <h1 className="text-xl font-bold text-gray-900 leading-tight">{task.title}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-gray-500">
                  <span className="capitalize">{task.priority} priority</span>
                  {dueLabel && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={12} />
                      {dueLabel}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {task.crm_customers && (
                    <EntityChip
                      href={`/customers/${task.crm_customers.id}`}
                      label={task.crm_customers.name}
                      icon={Building2}
                    />
                  )}
                  {task.crm_contacts && (
                    <EntityChip
                      href={`/contacts/${task.crm_contacts.id}`}
                      label={`${task.crm_contacts.first_name} ${task.crm_contacts.last_name}`}
                      icon={UserRound}
                    />
                  )}
                </div>
              </div>
            </div>
            <TaskDetailActions taskId={task.id} done={task.done} />
          </div>

          {task.notes && (
            <div className="mt-5 pt-5 border-t border-milestone-line">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5">
                <StickyNote size={12} /> Details
              </p>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{task.notes}</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
