"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  Search,
  Bell,
  ChevronDown,
  Settings,
  LogOut,
  Bot,
  Workflow,
  CheckCircle2,
  Users,
  Menu,
  X,
  Upload,
} from "lucide-react";
import type { AppUser } from "@/lib/types";
import { DEFAULT_TERMS, type Terms } from "@/lib/terms";
import { signOutAction } from "@/app/auth-actions";
import ThemeToggle from "./ThemeToggle";

export default function TopNav({
  user,
  terms = DEFAULT_TERMS,
  companyName = null,
  brandColor = "#1769FF",
  isAdmin = true,
}: {
  user: AppUser;
  terms?: Terms;
  companyName?: string | null;
  brandColor?: string;
  isAdmin?: boolean;
}) {
  const NAV_ITEMS = [
    { label: "Home", href: "/dashboard" },
    { label: terms.customers, href: "/customers" },
    { label: terms.contacts, href: "/contacts" },
    { label: terms.opportunities, href: "/opportunities" },
    { label: terms.goals, href: "/goals" },
    { label: "Reports", href: "/reports" },
  ];
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const username = user.email?.split("@")[0] ?? "User";
  const displayName = username.charAt(0).toUpperCase() + username.slice(1);
  const initial = username[0]?.toUpperCase() ?? "U";

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  function isActive(href: string) {
    return pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
  }

  return (
    <header
      className="sticky top-0 z-40 bg-white/95 dark:bg-[#0B1929]/95 backdrop-blur-sm border-b border-milestone-line dark:border-white/[0.06]"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center h-14 px-3 sm:px-4 md:px-5 gap-1 sm:gap-2">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0 mr-1">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${brandColor}, ${brandColor}cc)` }}
          >
            <span className="text-white font-semibold text-sm leading-none">
              {(companyName ?? "Milestone").charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="font-semibold text-[15px] text-gray-900 dark:text-white tracking-tight hidden sm:block truncate max-w-[200px]">
            {companyName ?? "Milestone CRM"}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5 ml-3">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-2.5 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
                  active
                    ? "text-milestone-blue bg-milestone-blue-dim/60 dark:bg-milestone-blue/10"
                    : "text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-0.5 ml-auto">
          <ThemeToggle />
          <button
            className="hidden sm:flex ms-touch-icon rounded-xl text-gray-400 dark:text-white/40 active:text-gray-700 dark:active:text-white/80 active:bg-gray-50 dark:active:bg-white/[0.05] transition-colors"
            aria-label="Search"
          >
            <Search size={17} />
          </button>
          <Link
            href="/follow-ups"
            className="relative p-1.5 rounded-md text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/80 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors"
            aria-label="Notifications"
          >
            <Bell size={17} />
          </Link>

          {/* Avatar menu */}
          <div className="relative ml-0.5" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="flex items-center gap-1.5 pl-1 pr-1 sm:pr-1.5 py-1 rounded-md active:bg-gray-50 dark:active:bg-white/[0.04] transition-colors touch-manipulation"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-milestone-blue flex items-center justify-center shrink-0 ring-1 ring-black/5">
                <span className="text-white text-[10px] font-semibold">{initial}</span>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-white/80 hidden lg:block">
                {displayName}
              </span>
              <ChevronDown size={14} className="text-gray-400 hidden lg:block" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-[#0B1929] rounded-lg shadow-card-lg border border-milestone-line dark:border-white/[0.08] p-1 z-50">
                <div className="px-2.5 py-2 border-b border-milestone-line dark:border-white/[0.08] mb-0.5">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{displayName}</p>
                  <p className="text-xs text-gray-400 dark:text-white/40 truncate">{user.email}</p>
                </div>
                {isAdmin && (
                  <Link
                    href="/flows"
                    className="flex items-center gap-2 px-2.5 py-1.5 text-sm text-gray-600 dark:text-white/60 rounded-md hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors"
                  >
                    <Workflow size={14} className="text-gray-400 dark:text-white/30" />
                    Flows
                  </Link>
                )}
                <Link
                  href="/completed"
                  className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <CheckCircle2 size={15} className="text-gray-400" />
                  Completed
                </Link>
                <Link
                  href="/ai"
                  className="flex items-center gap-2 px-2.5 py-1.5 text-sm text-gray-600 dark:text-white/60 rounded-md hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors"
                >
                  <Bot size={14} className="text-gray-400 dark:text-white/30" />
                  AI Assistant
                </Link>
                <Link
                  href="/import"
                  className="flex items-center gap-2 px-2.5 py-1.5 text-sm text-gray-600 dark:text-white/60 rounded-md hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors"
                >
                  <Upload size={14} className="text-gray-400 dark:text-white/30" />
                  Import CSV
                </Link>
                {isAdmin && (
                  <Link
                    href="/team"
                    className="flex items-center gap-2 px-2.5 py-1.5 text-sm text-gray-600 dark:text-white/60 rounded-md hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors"
                  >
                    <Users size={14} className="text-gray-400 dark:text-white/30" />
                    Team
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-2.5 py-1.5 text-sm text-gray-600 dark:text-white/60 rounded-md hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors"
                  >
                    <Settings size={14} className="text-gray-400 dark:text-white/30" />
                    Settings
                  </Link>
                )}
                <form action={signOutAction} className="border-t border-milestone-line dark:border-white/[0.08] mt-0.5 pt-0.5">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 px-2.5 py-1.5 text-sm text-milestone-red rounded-md hover:bg-milestone-red-dim dark:hover:bg-milestone-red/10 transition-colors"
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden ms-touch-icon rounded-xl text-gray-500 dark:text-white/50 active:bg-gray-50 dark:active:bg-white/[0.05] transition-colors"
            aria-label="Menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-milestone-line dark:border-white/[0.06] px-2 py-1.5 space-y-0.5 bg-white dark:bg-[#0B1929]">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-2.5 py-2 text-sm font-medium rounded-md transition-colors ${
                  active
                    ? "bg-milestone-blue-dim dark:bg-milestone-blue/15 text-milestone-blue"
                    : "text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
