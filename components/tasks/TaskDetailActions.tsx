"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Trash2 } from "lucide-react";
import { toggleTaskDone, deleteTask } from "@/app/dashboard/task-actions";

export default function TaskDetailActions({
  taskId,
  done,
}: {
  taskId: string;
  done: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      {!done && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await toggleTaskDone(taskId, true);
              router.refresh();
            })
          }
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-milestone-green-dim text-milestone-green hover:bg-milestone-green/20 transition-colors disabled:opacity-50"
        >
          <CheckCircle size={14} />
          Mark done
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("Delete this task? This cannot be undone.")) return;
          startTransition(async () => {
            await deleteTask(taskId);
            router.push("/dashboard");
            router.refresh();
          });
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-milestone-red hover:bg-milestone-red-dim transition-colors disabled:opacity-50"
      >
        <Trash2 size={14} />
        Delete
      </button>
    </div>
  );
}
