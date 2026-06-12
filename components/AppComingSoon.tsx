import AppShell from "@/components/layout/AppShell";
import type { AppUser } from "@/lib/types";
import type { LucideIcon } from "lucide-react";

export default function AppComingSoon({
  user,
  title,
  subtitle,
  icon: Icon,
}: {
  user: AppUser;
  title: string;
  subtitle: string;
  icon: LucideIcon;
}) {
  return (
    <AppShell user={user}>
      <div className="p-6 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Icon size={20} className="text-milestone-blue" />
            {title}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        </div>
        <div className="ms-card p-12 text-center">
          <p className="text-sm font-medium text-gray-500">Coming soon</p>
          <p className="text-xs text-gray-400 mt-2 max-w-sm mx-auto">
            This area is on the roadmap. Use Dashboard, Kill List, and Goals for now.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
