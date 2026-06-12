import Link from "next/link";
import { Zap, Building2, Handshake, Target } from "lucide-react";
import { signIn_action, signInWithGoogle } from "./actions";
import { authErrorMessage, isGoogleAuthConfigured } from "@/lib/auth-env";

const features = [
  { icon: Building2, label: "Companies", desc: "Accounts, contacts, and relationships" },
  { icon: Handshake, label: "Deals", desc: "Pipeline, opportunities, and follow-ups" },
  { icon: Target, label: "Goals", desc: "Milestones tied to what you're closing" },
];

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #0d2040 0%, #07111F 65%)" }}
    >
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-15"
          style={{ background: "radial-gradient(ellipse, #1769FF 0%, transparent 70%)" }}
        />
      </div>

      <div className="w-full max-w-[360px] relative">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-gradient-to-br from-blue-500 to-milestone-blue mb-3 shadow-blue-glow">
            <Zap size={20} className="text-white fill-white" />
          </div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Milestone</h1>
          <p className="text-white/40 text-sm mt-0.5">CRM built for closing deals</p>
        </div>

        <div className="flex gap-1.5 justify-center mb-6 flex-wrap">
          {features.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/[0.06] border border-white/[0.08] text-white/55 text-[11px] font-medium"
            >
              <Icon size={11} />
              {label}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-card-xl p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-0.5">Welcome back</h2>
          <p className="text-sm text-gray-500 mb-4">Sign in to your account</p>

          <form action={signIn_action} className="space-y-3.5">
            <div>
              <label className="ms-label">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="ms-input"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="ms-label mb-0">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-milestone-blue hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="ms-input"
                placeholder="••••••••"
              />
            </div>

            <AuthFlash searchParams={searchParams} />

            <button
              type="submit"
              className="w-full ms-btn-primary justify-center py-2 mt-0.5"
            >
              Sign in
            </button>
          </form>

          {isGoogleAuthConfigured() && (
            <>
              <div className="flex items-center gap-3 my-3.5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <form action={signInWithGoogle}>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 border border-milestone-line rounded-md py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>
              </form>
            </>
          )}

          <p className="text-center text-sm text-gray-500 mt-4">
            No account?{" "}
            <Link href="/signup" className="text-milestone-blue font-medium hover:underline">
              Sign up free
            </Link>
          </p>
        </div>

        <p className="text-center text-[11px] text-white/30 mt-5">
          <Link href="/privacy" className="hover:text-white/50">
            Privacy
          </Link>
          {" · "}
          <Link href="/terms" className="hover:text-white/50">
            Terms
          </Link>
        </p>
      </div>
    </div>
  );
}

async function AuthFlash({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  if (params.error) {
    let message = authErrorMessage(params.error);
    if (!message) {
      try {
        message = decodeURIComponent(params.error);
      } catch {
        message = params.error;
      }
    }
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2">
        {message}
      </div>
    );
  }
  if (params.message) {
    return (
      <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-md px-3 py-2">
        {params.message}
      </div>
    );
  }
  return null;
}
