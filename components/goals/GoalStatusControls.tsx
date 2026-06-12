"use client";

import { useTransition } from "react";
import { Archive, CheckCircle, RotateCcw } from "lucide-react";
import { setGoalStatus } from "@/app/goals/actions";
import type { GoalStatus } from "@/lib/types";

export default function GoalStatusControls({
  goalId,
  status,
}: {
  goalId: string;
  status: GoalStatus;
}) {
  const [pending, startTransition] = useTransition();

  function handleStatus(newStatus: GoalStatus) {
    startTransition(async () => {
      await setGoalStatus(goalId, newStatus);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {status === "active" && (
        <>
          <button
            onClick={() => handleStatus("completed")}
            disabled={pending}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-milestone-green bg-milestone-green-dim rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors disabled:opacity-60"
          >
            <CheckCircle size={12} />
            Complete
          </button>
          <button
            onClick={() => handleStatus("archived")}
            disabled={pending}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-500 dark:text-white/50 bg-gray-100 dark:bg-white/[0.07] rounded-lg hover:bg-gray-200 dark:hover:bg-white/[0.12] transition-colors disabled:opacity-60"
          >
            <Archive size={12} />
            Archive
          </button>
        </>
      )}
      {status !== "active" && (
        <button
          onClick={() => handleStatus("active")}
          disabled={pending}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-milestone-blue bg-milestone-blue-dim rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-60"
        >
          <RotateCcw size={12} />
          Reactivate
        </button>
      )}
    </div>
  );
}
