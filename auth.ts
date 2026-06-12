import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { db } from "@/db";
import { users } from "@/db/schema";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { getAuthSecret, isGoogleAuthConfigured } from "@/lib/auth-env";

async function findUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return db.query.users.findFirst({
    where: sql`lower(${users.email}) = ${normalized}`,
  });
}

const providers: Provider[] = [
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (!email || !password || typeof email !== "string" || typeof password !== "string") {
          return null;
        }
        const user = await findUserByEmail(email);
        if (!user?.password_hash) return null;
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return null;
        return { id: user.id, email: user.email };
      },
    }),
];

if (isGoogleAuthConfigured()) {
  providers.unshift(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: getAuthSecret(),
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account }) {
      if (user?.id) {
        token.id = user.id;
        return token;
      }

      const email =
        typeof token.email === "string" ? token.email.trim().toLowerCase() : null;
      if (!email) return token;

      // Google OAuth: look up or create the user by email (case-insensitive).
      if (account?.provider === "google") {
        let dbUser = await findUserByEmail(email);
        if (!dbUser) {
          const [created] = await db
            .insert(users)
            .values({ email, name: token.name ?? null })
            .returning();
          dbUser = created;
        }
        token.id = dbUser.id;
        token.email = email;
        return token;
      }

      // Re-bind id from DB on every request so stale JWT user ids self-heal.
      const dbUser = await findUserByEmail(email);
      if (dbUser) {
        token.id = dbUser.id;
        token.email = email;
      }
      return token;
    },
  },
});
