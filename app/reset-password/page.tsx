import Link from "next/link";
import { Zap } from "lucide-react";
import { db } from "@/db";
import { password_reset_tokens } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { resetPassword } from "./actions";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const params = await searchParams;
  const token = params.token ?? "";

  // Validate token server-side before rendering the form
  let valid = false;
  if (token) {
    const row = await db.query.password_reset_tokens.findFirst({
      where: and(eq(password_reset_tokens.token, token), isNull(password_reset_tokens.used_at)),
    });
    valid = !!row && new Date(row.expires_at) > new Date();
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #0d2040 0%, #07111F 65%)" }}
    >
      <div className="w-full max-w-sm relative">
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-milestone-blue mb-4 shadow-lg shadow-blue-900/50">
            <Zap size={22} className="text-white fill-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Milestone</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.4)] p-7">
          {!valid ? (
            <>
              <h2 className="text-[18px] font-bold text-gray-900 mb-2">Link expired or invalid</h2>
              <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                This reset link has expired or already been used. Request a new one.
              </p>
              <Link
                href="/forgot-password"
                className="block w-full text-center bg-milestone-blue text-white py-2.5 rounded-lg font-semibold hover:bg-blue-600 transition-colors text-sm"
              >
                Request new link
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-[18px] font-bold text-gray-900 mb-0.5">Set new password</h2>
              <p className="text-sm text-gray-400 mb-5">Choose a strong password.</p>

              {params.error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3.5 py-2.5 mb-4">
                  {params.error}
                </div>
              )}

              <form action={resetPassword} className="space-y-4">
                <input type="hidden" name="token" value={token} />
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    New password
                  </label>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full px-3.5 py-2.5 border border-milestone-line rounded-lg focus:outline-none focus:ring-2 focus:ring-milestone-blue text-sm transition-all"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    Confirm password
                  </label>
                  <input
                    name="confirm"
                    type="password"
                    required
                    autoComplete="new-password"
                    className="w-full px-3.5 py-2.5 border border-milestone-line rounded-lg focus:outline-none focus:ring-2 focus:ring-milestone-blue text-sm transition-all"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-milestone-blue text-white py-2.5 rounded-lg font-semibold hover:bg-blue-600 transition-colors shadow-sm shadow-blue-200"
                >
                  Update password
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
