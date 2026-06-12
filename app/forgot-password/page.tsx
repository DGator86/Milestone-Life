import Link from "next/link";
import { Zap } from "lucide-react";
import { requestPasswordReset } from "./actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const params = await searchParams;
  const sent = params.sent === "1";

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
          {sent ? (
            <>
              <h2 className="text-[18px] font-bold text-gray-900 mb-2">Check your email</h2>
              <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                If an account with that address exists, we sent a reset link. It expires in 1 hour.
              </p>
              <Link
                href="/login"
                className="block w-full text-center bg-milestone-blue text-white py-2.5 rounded-lg font-semibold hover:bg-blue-600 transition-colors text-sm"
              >
                Back to sign in
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-[18px] font-bold text-gray-900 mb-0.5">Forgot your password?</h2>
              <p className="text-sm text-gray-400 mb-5">Enter your email and we&apos;ll send a reset link.</p>

              <form action={requestPasswordReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="w-full px-3.5 py-2.5 border border-milestone-line rounded-lg focus:outline-none focus:ring-2 focus:ring-milestone-blue focus:border-transparent text-sm transition-all"
                    placeholder="you@example.com"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-milestone-blue text-white py-2.5 rounded-lg font-semibold hover:bg-blue-600 active:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
                >
                  Send reset link
                </button>
              </form>

              <p className="text-center text-sm text-gray-400 mt-5">
                <Link href="/login" className="text-milestone-blue font-semibold hover:underline">
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
