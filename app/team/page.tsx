import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AppShell from "@/components/layout/AppShell";
import { Users, ShieldCheck, UserPlus, Trash2, Shield, Building2 } from "lucide-react";
import { getIsAdmin, listMembers } from "@/lib/admin";
import { getWorkspace } from "@/lib/workspace";
import { inviteMember, setMemberRole, removeMember, renameWorkspace } from "./actions";
import type { AppUser } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user: AppUser = { id: session.user.id, email: session.user.email };
  if (!(await getIsAdmin(user.id))) redirect("/dashboard");

  const { ok, error } = await searchParams;
  const [workspace, members] = await Promise.all([getWorkspace(), listMembers()]);
  const adminCount = members.filter((m) => m.is_admin).length;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Users size={20} className="text-milestone-blue" />
            Team
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage who can sign in and who has admin access. Admins can reach Settings and Flows.
          </p>
        </div>

        {ok && (
          <div className="mb-4 px-4 py-2.5 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
            {ok}
          </div>
        )}
        {error && (
          <div className="mb-4 px-4 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Workspace */}
        <div className="ms-card mb-4">
          <div className="px-5 py-3.5 border-b border-milestone-line bg-gray-50/60">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
              <Building2 size={12} />
              Workspace
            </p>
          </div>
          <form action={renameWorkspace} className="p-5 flex items-end gap-3">
            <label className="block flex-1">
              <span className="text-xs font-semibold text-gray-500">Name</span>
              <input
                type="text"
                name="name"
                required
                maxLength={60}
                defaultValue={workspace.name}
                className="mt-1 w-full rounded-lg border border-milestone-line px-3 py-2 text-sm focus:border-milestone-blue focus:ring-1 focus:ring-milestone-blue outline-none"
              />
            </label>
            <button
              type="submit"
              className="bg-milestone-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 active:opacity-80 transition-opacity"
            >
              Save
            </button>
          </form>
          <p className="px-5 pb-4 -mt-2 text-xs text-gray-400">
            Everyone in this workspace shares the same customers, contacts, opportunities, flows, and goals.
          </p>
        </div>

        {/* Members list */}
        <div className="ms-card mb-4">
          <div className="px-5 py-3.5 border-b border-milestone-line bg-gray-50/60 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
              <Users size={12} />
              Members
            </p>
            <span className="text-xs text-gray-400">
              {members.length} {members.length === 1 ? "member" : "members"} · {adminCount} admin
              {adminCount === 1 ? "" : "s"}
            </span>
          </div>
          <ul className="divide-y divide-milestone-line">
            {members.map((m) => {
              const username = m.name?.trim() || m.email.split("@")[0];
              const initial = username[0]?.toUpperCase() ?? "U";
              const isSelf = m.id === user.id;
              const lastAdmin = m.is_admin && adminCount <= 1;
              return (
                <li key={m.id} className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-milestone-blue/30 flex items-center justify-center shrink-0 ring-1 ring-milestone-blue/20">
                    <span className="text-milestone-blue font-bold">{initial}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate flex items-center gap-2">
                      {username}
                      {isSelf && <span className="text-[10px] font-bold text-gray-400 uppercase">You</span>}
                    </p>
                    <p className="text-sm text-gray-400 truncate">{m.email}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
                        m.is_admin
                          ? "bg-milestone-blue-dim text-milestone-blue"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {m.is_admin ? <ShieldCheck size={12} /> : <Shield size={12} />}
                      {m.is_admin ? "Admin" : "Member"}
                    </span>

                    {/* Role toggle */}
                    <form action={setMemberRole}>
                      <input type="hidden" name="user_id" value={m.id} />
                      <input type="hidden" name="make_admin" value={(!m.is_admin).toString()} />
                      <button
                        type="submit"
                        disabled={lastAdmin}
                        title={
                          lastAdmin
                            ? "Promote someone else before demoting the last admin"
                            : m.is_admin
                              ? "Demote to member"
                              : "Promote to admin"
                        }
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-milestone-line text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {m.is_admin ? "Demote" : "Make admin"}
                      </button>
                    </form>

                    {/* Remove */}
                    {!isSelf && (
                      <form action={removeMember}>
                        <input type="hidden" name="user_id" value={m.id} />
                        <button
                          type="submit"
                          disabled={lastAdmin}
                          title={lastAdmin ? "Can't remove the last admin" : "Remove member"}
                          aria-label={`Remove ${m.email}`}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-milestone-red hover:bg-milestone-red-dim disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Invite a member */}
        <div className="ms-card">
          <div className="px-5 py-3.5 border-b border-milestone-line bg-gray-50/60">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
              <UserPlus size={12} />
              Invite a member
            </p>
          </div>
          <form action={inviteMember} className="p-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-semibold text-gray-500">Email</span>
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="off"
                  placeholder="teammate@company.com"
                  className="mt-1 w-full rounded-lg border border-milestone-line px-3 py-2 text-sm focus:border-milestone-blue focus:ring-1 focus:ring-milestone-blue outline-none"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-gray-500">Temporary password</span>
                <input
                  type="text"
                  name="password"
                  required
                  minLength={6}
                  autoComplete="off"
                  placeholder="At least 6 characters"
                  className="mt-1 w-full rounded-lg border border-milestone-line px-3 py-2 text-sm focus:border-milestone-blue focus:ring-1 focus:ring-milestone-blue outline-none"
                />
              </label>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" name="is_admin" className="rounded border-milestone-line text-milestone-blue focus:ring-milestone-blue" />
                Grant admin access
              </label>
              <button
                type="submit"
                className="bg-milestone-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 active:opacity-80 transition-opacity"
              >
                Invite member
              </button>
            </div>
            <p className="text-xs text-gray-400">
              Share the temporary password with your teammate — they can change it after signing in.
            </p>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
