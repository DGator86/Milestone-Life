"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronRight, Phone, Mail, Clock } from "lucide-react";
import type { Contact } from "@/lib/types";

function touchHealthInfo(contact: Contact): { label: string; color: string; dotColor: string } {
  if (!contact.touch_frequency_days) {
    return { label: "No cadence", color: "text-gray-400", dotColor: "bg-gray-300" };
  }
  const now = Date.now();
  const last = contact.last_touched_at ? new Date(contact.last_touched_at).getTime() : 0;
  const daysSince = Math.floor((now - last) / 86400000);
  const freq = contact.touch_frequency_days;

  if (!contact.last_touched_at || daysSince >= freq) {
    const overdueDays = contact.last_touched_at ? daysSince - freq : null;
    return {
      label: overdueDays !== null ? `${overdueDays}d overdue` : "Never touched",
      color: "text-milestone-red",
      dotColor: "bg-milestone-red",
    };
  }
  if (daysSince >= freq * 0.75) {
    return {
      label: `Due in ${freq - daysSince}d`,
      color: "text-milestone-amber",
      dotColor: "bg-milestone-amber",
    };
  }
  return {
    label: `${daysSince}d ago`,
    color: "text-milestone-green",
    dotColor: "bg-milestone-green",
  };
}

function avatarColor(name: string): string {
  const colors = [
    "bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500",
    "bg-pink-500", "bg-teal-500", "bg-indigo-500", "bg-rose-500",
  ];
  return colors[name.charCodeAt(0) % colors.length];
}

function formatLastTouched(date: string | null): string {
  if (!date) return "Never";
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export default function ContactList({ contacts }: { contacts: Contact[] }) {
  const [search, setSearch] = useState("");

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.company ?? "").toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, company, or email…"
          className="w-full pl-9 pr-4 py-2.5 border border-milestone-line rounded-xl text-sm font-medium placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-milestone-blue focus:border-transparent bg-white transition-all"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="ms-card p-12 text-center">
          <p className="text-sm font-medium text-gray-400">
            {search ? "No contacts match your search." : "No contacts yet."}
          </p>
          {!search && (
            <p className="text-xs text-gray-300 mt-1">Add your first contact below.</p>
          )}
        </div>
      ) : (
        <div className="ms-card">
          {filtered.map((contact) => {
            const health = touchHealthInfo(contact);
            const initials = contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
            const color = avatarColor(contact.name);

            return (
              <Link
                key={contact.id}
                href={`/follow-ups/${contact.id}`}
                className="flex items-center gap-4 px-5 py-4 border-b border-milestone-line last:border-0 hover:bg-gray-50/60 transition-colors group"
              >
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center shrink-0`}>
                  <span className="text-white text-xs font-bold">{initials}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm leading-snug truncate">{contact.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {contact.company && (
                      <span className="text-xs text-gray-400 truncate">{contact.company}</span>
                    )}
                    {contact.company && (contact.email || contact.phone) && (
                      <span className="text-gray-200 text-xs">·</span>
                    )}
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-milestone-blue transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Mail size={10} />
                        {contact.email}
                      </a>
                    )}
                    {!contact.email && contact.phone && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Phone size={10} />
                        {contact.phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Touch health */}
                <div className="shrink-0 text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className={`w-2 h-2 rounded-full ${health.dotColor}`} />
                    <span className={`text-xs font-semibold ${health.color}`}>{health.label}</span>
                  </div>
                  {contact.last_touched_at && (
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      <Clock size={10} className="text-gray-300" />
                      <span className="text-[11px] text-gray-400">{formatLastTouched(contact.last_touched_at)}</span>
                    </div>
                  )}
                </div>

                <ChevronRight size={14} className="text-gray-200 group-hover:text-gray-400 transition-colors shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
