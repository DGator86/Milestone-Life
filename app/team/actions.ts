"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { users, workspaces } from "@/db/schema";
import { requireAdmin, countAdmins } from "@/lib/admin";
import { getWorkspace } from "@/lib/workspace";
import { sendInviteEmail } from "@/lib/email";

function back(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  redirect(`/team?${qs}`);
}

// Rename the current workspace.
export async function renameWorkspace(formData: FormData): Promise<void> {
  await requireAdmin();
  const ws = await getWorkspace();
  const nameRaw = formData.get("name");
  const name = typeof nameRaw === "string" ? nameRaw.trim().slice(0, 60) : "";
  if (!name) back({ error: "Workspace name is required" });
  await db
    .update(workspaces)
    .set({ name, updated_at: new Date().toISOString() })
    .where(eq(workspaces.id, ws.id));
  revalidatePath("/team");
  back({ ok: "Workspace renamed" });
}

// Invite a new member into the current workspace. They share the workspace's
// data. Mirrors signup but is admin-driven, sets the role, and starts no session.
export async function inviteMember(formData: FormData): Promise<void> {
  await requireAdmin();
  const ws = await getWorkspace();

  const emailRaw = formData.get("email");
  const passwordRaw = formData.get("password");
  if (typeof emailRaw !== "string" || typeof passwordRaw !== "string" || !emailRaw.trim() || !passwordRaw) {
    back({ error: "Email and a temporary password are required" });
  }
  const email = (emailRaw as string).trim().toLowerCase();
  const password = passwordRaw as string;
  if (password.length < 6) {
    back({ error: "Temporary password must be at least 6 characters" });
  }
  const isAdmin = formData.get("is_admin") === "on";

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    back({ error: "An account with this email already exists" });
  }

  const password_hash = await bcrypt.hash(password, 10);
  await db.insert(users).values({ email, password_hash, is_admin: isAdmin, workspace_id: ws.id });
  void sendInviteEmail(email, password, ws.name);

  revalidatePath("/team");
  back({ ok: `Invited ${email}` });
}

// Promote or demote a member of the current workspace. Guards the last admin.
export async function setMemberRole(formData: FormData): Promise<void> {
  await requireAdmin();
  const ws = await getWorkspace();

  const userId = formData.get("user_id");
  const makeAdmin = formData.get("make_admin") === "true";
  if (typeof userId !== "string" || !userId) back({ error: "Missing member" });

  const target = await db.query.users.findFirst({
    columns: { id: true, email: true, is_admin: true },
    where: and(eq(users.id, userId as string), eq(users.workspace_id, ws.id)),
  });
  if (!target) back({ error: "Member not found" });

  if (target!.is_admin === makeAdmin) {
    back({ ok: "No change" });
  }
  if (!makeAdmin && target!.is_admin && (await countAdmins()) <= 1) {
    back({ error: "Can't remove the last admin — promote someone else first" });
  }

  await db.update(users).set({ is_admin: makeAdmin }).where(eq(users.id, userId as string));
  revalidatePath("/team");
  back({ ok: makeAdmin ? `${target!.email} is now an admin` : `${target!.email} is now a member` });
}

// Permanently delete a member of the current workspace. Guards against
// self-removal, removing the workspace owner (would cascade-delete the shared
// data), and removing the last admin.
export async function removeMember(formData: FormData): Promise<void> {
  const adminId = await requireAdmin();
  const ws = await getWorkspace();

  const userId = formData.get("user_id");
  if (typeof userId !== "string" || !userId) back({ error: "Missing member" });
  if (userId === adminId) back({ error: "You can't remove your own account here" });
  if (userId === ws.ownerId) back({ error: "Can't remove the workspace owner" });

  const target = await db.query.users.findFirst({
    columns: { id: true, email: true, is_admin: true },
    where: and(eq(users.id, userId as string), eq(users.workspace_id, ws.id)),
  });
  if (!target) back({ error: "Member not found" });

  if (target!.is_admin && (await countAdmins()) <= 1) {
    back({ error: "Can't remove the last admin" });
  }

  await db.delete(users).where(eq(users.id, userId as string));
  revalidatePath("/team");
  back({ ok: `Removed ${target!.email}` });
}
