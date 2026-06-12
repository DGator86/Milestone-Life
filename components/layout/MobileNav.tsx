"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Target, Workflow, LayoutTemplate } from "lucide-react";

const items = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Goals", href: "/goals", icon: Target },
  { label: "Flows", href: "/flows", icon: Workflow },
  { label: "Templates", href: "/templates", icon: LayoutTemplate },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-milestone-line dark:border-white/[0.07] bg-white/95 dark:bg-[#0B1929]/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      aria-label="Main navigation"
    >
      <ul className="flex items-stretch justify-around h-14">
        {items.map(({ label, href, icon: Icon }) => {
          const active =
            pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex flex-col items-center justify-center gap-0.5 h-full text-[10px] font-semibold transition-colors ${
                  active ? "text-milestone-blue" : "text-gray-400 dark:text-white/30"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.25 : 2} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
