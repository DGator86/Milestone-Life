"use client";

import { useRouter, usePathname } from "next/navigation";
import type { Group } from "@/lib/types";

export default function GroupTabs({
  groups,
  currentGroup,
  currentSort,
  currentStatus,
}: {
  groups: Group[];
  currentGroup: string;
  currentSort: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function selectGroup(groupId: string) {
    const params = new URLSearchParams();
    if (groupId) params.set("group", groupId);
    if (currentSort && currentSort !== "priority") params.set("sort", currentSort);
    if (currentStatus && currentStatus !== "active") params.set("status", currentStatus);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const tabs = [{ id: "", name: "All", color: "#1769FF" }, ...groups.map((g) => ({ ...g, color: g.color ?? "#1769FF" }))];

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 md:px-6 py-3 bg-white border-b border-milestone-line">
      {tabs.map((tab) => {
        const active = currentGroup === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => selectGroup(tab.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              active ? "text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
            style={active ? { backgroundColor: tab.color } : {}}
          >
            {tab.id !== "" && (
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: active ? "rgba(255,255,255,0.6)" : tab.color }}
              />
            )}
            {tab.name}
          </button>
        );
      })}
    </div>
  );
}
