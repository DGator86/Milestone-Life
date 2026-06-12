"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users, password_reset_tokens } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function resetPassword(formData: FormData) {
  const token = formData.get("token");
  const password = formData.get("password");
  const confirm = formData.get("confirm");

  if (typeof token !== "string" || typeof password !== "string" || typeof confirm !== "string") {
    redirect("/forgot-password");
  }
  if (password.length < 6) {
    redirect(`/reset-password?token=${token}&error=${encodeURIComponent("Password must be at least 6 characters")}`);
  }
  if (password !== confirm) {
    redirect(`/reset-password?token=${token}&error=${encodeURIComponent("Passwords do not match")}`);
  }

  const row = await db.query.password_reset_tokens.findFirst({
    where: and(eq(password_reset_tokens.token, token), isNull(password_reset_tokens.used_at)),
  });

  if (!row || new Date(row.expires_at) < new Date()) {
    redirect("/forgot-password?error=expired");
  }

  const password_hash = await bcrypt.hash(password, 10);
  await db.update(users).set({ password_hash }).where(eq(users.id, row.user_id));
  await db
    .update(password_reset_tokens)
    .set({ used_at: new Date().toISOString() })
    .where(eq(password_reset_tokens.id, row.id));

  redirect("/login?message=Password+updated.+Sign+in+with+your+new+password.");
}
