import Link from "next/link";
import { Zap, ClipboardList } from "lucide-react";

export default function SetupPage() {
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
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse, #1769FF 0%, transparent 70%)" }}
        />
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-milestone-blue mb-4 shadow-lg shadow-blue-900/50">
            <Zap size={22} className="text-white fill-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Configure Database</h1>
          <p className="text-white/40 text-sm mt-1">
            Milestone needs a Neon database URL before it can run.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.4)] p-7 space-y-4">
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-lg bg-milestone-blue-dim flex items-center justify-center shrink-0">
              <ClipboardList size={18} className="text-milestone-blue" />
            </div>
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                Copy <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">.env.example</code> to{" "}
                <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">.env.local</code> in the project root.
              </p>
              <p>
                Set <span className="font-semibold text-gray-800">DATABASE_URL</span> from your Neon project
                dashboard and <span className="font-semibold text-gray-800">AUTH_SECRET</span> to a random secret.
              </p>
              <p className="text-xs text-gray-400">
                Run <code className="text-[11px] bg-gray-100 px-1 py-0.5 rounded">npm run db:push</code> to apply
                the schema, then restart the dev server.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/login"
              className="block text-center text-sm text-milestone-blue font-semibold hover:underline py-2"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
