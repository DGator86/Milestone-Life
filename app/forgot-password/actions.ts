"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, password_reset_tokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendPasswordResetEmail } from "@/lib/email";

export async function requestPasswordReset(formData: FormData) {
  const emailRaw = formData.get("email");
  if (typeof emailRaw !== "string" || !emailRaw.trim()) {
    redirect("/forgot-password?sent=1"); // Don't leak whether email exists
  }
  const email = emailRaw.trim().toLowerCase();

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (user) {
    // Invalidate any existing unused tokens for this user
    await db.delete(password_reset_tokens).where(eq(password_reset_tokens.user_id, user.id));

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await db.insert(password_reset_tokens).values({ user_id: user.id, token, expires_at: expiresAt });

    const base = process.env.NEXTAUTH_URL ?? "";
    void sendPasswordResetEmail(email, `${base}/reset-password?token=${token}`);
  }

  redirect("/forgot-password?sent=1");
}
