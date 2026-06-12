import Link from "next/link";
import { AlertCircle, AlertTriangle, Clock, CheckCircle, ChevronRight } from "lucide-react";
import { getTaskHealth } from "@/lib/progress";
import type { GoalWithDetails } from "@/lib/types";

export default function TaskHealth({ goals }: { goals: GoalWithDetails[] }) {
  const { stuck, needsAttention, waiting, onTrack } = getTaskHealth(goals);
  const total = stuck.length + needsAttention.length + waiting.length + onTrack.length;
  const healthScore = total > 0 ? Math.round((onTrack.length / total) * 100) : 100;

  const rows = [
    {
      icon: <AlertCircle size={18} className="text-milestone-red shrink-0" />,
      count: stuck.length,
      label: "Stuck",
      color: "text-milestone-red",
      bg: "bg-milestone-red-dim",
      bar: "#EA4335",
      href: "/kill-list?filter=stuck",
    },
    {
      icon: <AlertTriangle size={18} className="text-milestone-amber shrink-0" />,
      count: needsAttention.length,
      label: "Needs Attention",
      color: "text-milestone-amber",
      bg: "bg-milestone-amber-dim",
      bar: "#F8B400",
      href: "/kill-list?filter=attention",
    },
    {
      icon: <Clock size={18} className="text-milestone-blue shrink-0" />,
      count: waiting.length,
      label: "Waiting",
      color: "text-milestone-blue",
      bg: "bg-milestone-blue-dim",
      bar: "#1769FF",
      href: "/kill-list?filter=waiting",
    },
    {
      icon: <CheckCircle size={18} className="text-milestone-green shrink-0" />,
      count: onTrack.length,
      label: "On Track",
      color: "text-milestone-green",
      bg: "bg-milestone-green-dim",
      bar: "#36A852",
      href: "/kill-list",
    },
  ];

  return (
    <div className="ms-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[13px] font-semibold text-gray-500 dark:text-white/50">
            Task Health
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">{total} active goals</p>
        </div>
        <div className="text-right">
          <p
            className={`text-2xl font-bold tabular-nums ${
              healthScore >= 75
                ? "text-milestone-green"
                : healthScore >= 50
                ? "text-milestone-amber"
                : "text-milestone-red"
            }`}
          >
            {healthScore}%
          </p>
          <p className="text-[11px] text-gray-400">on track</p>
        </div>
      </div>

      {total > 0 && (
        <div className="flex h-2 rounded-full overflow-hidden mb-4 gap-px">
          {rows.map(({ bar, count, label }) =>
            count > 0 ? (
              <div
                key={label}
                title={`${label}: ${count}`}
                className="transition-all duration-500"
                style={{ width: `${(count / total) * 100}%`, backgroundColor: bar }}
              />
            ) : null
          )}
        </div>
      )}

      <div className="space-y-1.5">
        {rows.map(({ icon, count, label, color, bg, href }) => {
          const cls = `flex items-center gap-3 py-2 px-3 rounded-lg transition-colors group ${
            count > 0 ? "hover:bg-gray-50" : "cursor-default opacity-60"
          }`;
          const content = (
            <>
              {icon}
              <span className={`text-xl font-bold tabular-nums w-7 shrink-0 ${color}`}>
                {count}
              </span>
              <span className="text-sm font-semibold text-gray-700 flex-1">{label}</span>
              {count > 0 && (
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${bg} ${color}`}>
                  {count}
                </span>
              )}
              <ChevronRight
                size={14}
                className={`shrink-0 transition-colors ${
                  count > 0 ? "text-gray-300 dark:text-white/20 group-hover:text-gray-400 dark:group-hover:text-white/40" : "text-gray-200 dark:text-white/10"
                }`}
              />
            </>
          );
          return count > 0 ? (
            <Link key={label} href={href} className={cls}>{content}</Link>
          ) : (
            <div key={label} className={cls} aria-disabled="true">{content}</div>
          );
        })}
      </div>
    </div>
  );
}
