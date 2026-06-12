"use client";

import { useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, RotateCcw, Trophy, Flag } from "lucide-react";
import { reactivateGoal, updateMilestoneStatus } from "@/app/goals/actions";

type CompletedGoal = { id: string; title: string; updated_at: string | null };
type CompletedMilestone = {
  id: string;
  title: string;
  completed_at: string | null;
  goal_id: string;
  goal_title: string;
};

function fmtDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function CompletedView({
  goals,
  milestones,
  goalLabelPlural = "Goals",
  goalLabelSingular = "Goal",
  milestoneLabelPlural = "Milestones",
  milestoneLabelSingular = "Milestone",
}: {
  goals: CompletedGoal[];
  milestones: CompletedMilestone[];
  goalLabelPlural?: string;
  goalLabelSingular?: string;
  milestoneLabelPlural?: string;
  milestoneLabelSingular?: string;
}) {
  const [isPending, startTransition] = useTransition();

  function undoGoal(id: string) {
    startTransition(async () => {
      await reactivateGoal(id);
    });
  }

  function undoMilestone(id: string, goalId: string) {
    startTransition(async () => {
      await updateMilestoneStatus(id, "upcoming", goalId);
    });
  }

  return (
    <div className="p-6 max-w-4xl" style={{ opacity: isPending ? 0.7 : 1 }}>
      <div className="mb-6">
        <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <CheckCircle2 size={20} className="text-milestone-green" />
          Completed
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Finished {goalLabelPlural.toLowerCase()} and {milestoneLabelPlural.toLowerCase()} — restore any of them with one tap.
        </p>
      </div>

      {/* Completed goals */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Trophy size={13} /> {goalLabelPlural}
          <span className="text-gray-300">({goals.length})</span>
        </h2>
        {goals.length === 0 ? (
          <div className="bg-white rounded-xl shadow-card border border-milestone-line p-10 text-center">
            <Trophy size={32} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-400">No completed {goalLabelPlural.toLowerCase()} yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-card border border-milestone-line overflow-hidden divide-y divide-milestone-line">
            {goals.map((g) => (
              <div key={g.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <Link href={`/goals/${g.id}`} className="font-semibold text-gray-900 hover:text-milestone-blue transition-colors truncate block">
                    {g.title}
                  </Link>
                  {fmtDate(g.updated_at) && (
                    <p className="text-xs text-gray-400 mt-0.5">Completed {fmtDate(g.updated_at)}</p>
                  )}
                </div>
                <button
                  onClick={() => undoGoal(g.id)}
                  disabled={isPending}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-milestone-line text-gray-600 hover:text-milestone-blue hover:border-milestone-blue/40 transition-colors shrink-0 disabled:opacity-50"
                  title={`Restore this ${goalLabelSingular.toLowerCase()} to active`}
                >
                  <RotateCcw size={13} /> Undo
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Completed milestones */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Flag size={13} /> {milestoneLabelPlural}
          <span className="text-gray-300">({milestones.length})</span>
        </h2>
        {milestones.length === 0 ? (
          <div className="bg-white rounded-xl shadow-card border border-milestone-line p-10 text-center">
            <Flag size={32} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-400">No completed {milestoneLabelPlural.toLowerCase()} yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-card border border-milestone-line overflow-hidden divide-y divide-milestone-line">
            {milestones.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-milestone-green shrink-0" />
                    <p className="font-medium text-gray-900 truncate">{m.title}</p>
                  </div>
                  <Link
                    href={`/goals/${m.goal_id}`}
                    className="text-xs text-gray-400 hover:text-milestone-blue transition-colors ml-[23px] block truncate"
                  >
                    {m.goal_title}
                    {fmtDate(m.completed_at) && <span> · {fmtDate(m.completed_at)}</span>}
                  </Link>
                </div>
                <button
                  onClick={() => undoMilestone(m.id, m.goal_id)}
                  disabled={isPending}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-milestone-line text-gray-600 hover:text-milestone-blue hover:border-milestone-blue/40 transition-colors shrink-0 disabled:opacity-50"
                  title={`Restore this ${milestoneLabelSingular.toLowerCase()}`}
                >
                  <RotateCcw size={13} /> Undo
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
