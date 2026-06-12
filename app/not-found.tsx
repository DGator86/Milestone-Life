import Link from "next/link";
import { Zap } from "lucide-react";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #0d2040 0%, #07111F 65%)" }}
    >
      <div className="text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-milestone-blue mb-5 shadow-lg shadow-blue-900/50">
          <Zap size={22} className="text-white fill-white" />
        </div>
        <p className="text-[80px] font-black text-white/10 leading-none mb-2">404</p>
        <h1 className="text-lg font-bold text-white mb-2">Page not found</h1>
        <p className="text-sm text-white/40 mb-7 leading-relaxed">
          This page doesn&apos;t exist or was moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-milestone-blue text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
          >
            Go to dashboard
          </Link>
          <Link
            href="/"
            className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-semibold hover:bg-white/20 transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
