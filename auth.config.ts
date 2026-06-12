import type { NextAuthConfig } from "next-auth";
import { getAuthSecret } from "@/lib/auth-env";

export const authConfig: NextAuthConfig = {
  secret: getAuthSecret(),
  trustHost: true,
  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }: { token: any; user?: any }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }: { session: any; token: any }) {
      if (token?.id) session.user.id = token.id;
      return session;
    },
  },
  providers: [],
};
