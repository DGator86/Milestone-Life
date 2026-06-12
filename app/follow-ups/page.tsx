import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { db } from "@/db";
import { contacts } from "@/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import AppShell from "@/components/layout/AppShell";
import { Bell, ChevronRight, AlertCircle, Clock } from "lucide-react";
import Link from "next/link";
import type { Contact, AppUser } from "@/lib/types";

export const dynamic = "force-dynamic";

interface FollowUpItem {
  contact: Contact;
  daysSince: number | null;
  daysOverdue: number;
  lastTouched: string | null;
}

function getFollowUps(contactList: Contact[]): FollowUpItem[] {
  const items: FollowUpItem[] = [];
  const now = Date.now();

  for (const contact of contactList) {
    if (!contact.touch_frequency_days) continue;
    const freq = contact.touch_frequency_days;
    const last = contact.last_touched_at ? new Date(contact.last_touched_at).getTime() : null;
    const daysSince = last ? Math.floor((now - last) / 86400000) : null;
    const daysOverdue = daysSince !== null ? daysSince - freq : freq;

    if (daysSince === null || daysSince >= freq) {
      items.push({ contact, daysSince, daysOverdue, lastTouched: contact.last_touched_at });
    }
  }

  return items.sort((a, b) => b.daysOverdue - a.daysOverdue);
}

function avatarColor(name: string): string {
  const colors = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500", "bg-pink-500", "bg-teal-500"];
  return colors[name.charCodeAt(0) % colors.length];
}

export default async function FollowUpsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = await getDataOwnerId();
  const user: AppUser = { id: session.user.id, email: session.user.email };

  const contactsRaw = await db.query.contacts.findMany({
    where: and(
      eq(contacts.user_id, userId),
      eq(contacts.status, "active"),
      isNotNull(contacts.touch_frequency_days)
    ),
  });

  const contactList: Contact[] = contactsRaw as unknown as Contact[];
  const followUps = getFollowUps(contactList);

  return (
    <AppShell user={user}>
      <div className="p-4 md:p-6 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Bell size={20} className="text-milestone-red" />
            Follow-ups
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Contacts overdue for a touch · sorted by most overdue
          </p>
        </div>

        {followUps.length === 0 ? (
          <div className="ms-card p-14 text-center">
            <Bell size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-semibold text-gray-400">{"You're all caught up!"}</p>
            <p className="text-xs text-gray-300 mt-1">
              No contacts are overdue for a touch right now.
            </p>
            <Link
              href="/contacts"
              className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-milestone-blue hover:underline"
            >
              View all contacts →
            </Link>
          </div>
        ) : (
          <div className="ms-card">
            {followUps.map(({ contact, daysSince, daysOverdue }, index) => {
              const initials = contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
              const color = avatarColor(contact.name);
              const neverTouched = daysSince === null;

              return (
                <Link
                  key={contact.id}
                  href={`/follow-ups/${contact.id}`}
                  className="flex items-center gap-4 px-5 py-4 border-b border-milestone-line last:border-0 hover:bg-gray-50/60 transition-colors group"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    index === 0 ? "bg-milestone-red-dim" : "bg-gray-100"
                  }`}>
                    {index === 0 ? (
                      <AlertCircle size={16} className="text-milestone-red" />
                    ) : (
                      <span className="text-sm font-bold tabular-nums text-gray-400">{index + 1}</span>
                    )}
                  </div>

                  <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center shrink-0`}>
                    <span className="text-white text-xs font-bold">{initials}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm leading-snug">{contact.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {contact.company ? `${contact.company} · ` : ""}
                      Every {contact.touch_frequency_days}d
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="text-xs font-bold text-milestone-red bg-milestone-red-dim px-2 py-0.5 rounded-full">
                      {neverTouched ? "Never touched" : `${daysOverdue}d overdue`}
                    </span>
                    {contact.last_touched_at && (
                      <div className="flex items-center gap-1 justify-end mt-1">
                        <Clock size={10} className="text-gray-300" />
                        <span className="text-[11px] text-gray-400">
                          {daysSince}d ago
                        </span>
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
    </AppShell>
  );
}
