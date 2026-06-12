"use server";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function signUp(formData: FormData) {
  const emailRaw = formData.get("email");
  const passwordRaw = formData.get("password");
  if (!emailRaw || typeof emailRaw !== "string" || !passwordRaw || typeof passwordRaw !== "string") {
    redirect(`/signup?error=${encodeURIComponent("Email and password are required")}`);
  }
  const email = emailRaw.trim().toLowerCase();
  if (passwordRaw.length < 6) {
    redirect(`/signup?error=${encodeURIComponent("Password must be at least 6 characters")}`);
  }

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    redirect(`/signup?error=${encodeURIComponent("An account with this email already exists")}`);
  }

  const password_hash = await bcrypt.hash(passwordRaw, 10);
  await db.insert(users).values({ email, password_hash });

  try {
    await signIn("credentials", { email, password: passwordRaw, redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/login?message=${encodeURIComponent("Account created — please sign in")}`);
    }
    throw error;
  }
}
