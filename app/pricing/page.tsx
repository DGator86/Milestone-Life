import Link from "next/link";
import { Zap, Check } from "lucide-react";
import { startCheckout } from "./actions";

const FREE_FEATURES = [
  "Unlimited goals & milestones",
  "Work, Home & Health categories",
  "Daily momentum tracking",
  "Kill List focus view",
];

const PRO_FEATURES = [
  "Everything in Free",
  "AI assistant (Gemini-powered)",
  "CRM — customers, contacts & pipelines",
  "Team workspace & member invites",
  "Advanced reporting & timeline",
  "Priority support",
];

export default function PricingPage() {
  const hasStripe = !!process.env.STRIPE_PRO_PRICE_ID;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #0d2040 0%, #07111F 65%)" }}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse, #1769FF 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative w-full max-w-3xl">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-6">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-[#1769FF] shadow-lg shadow-blue-900/50">
              <Zap size={18} className="text-white fill-white" />
            </div>
            <span className="text-white text-xl font-bold tracking-tight">Milestone</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Simple, honest pricing</h1>
          <p className="text-white/50 text-base">Start free. Upgrade when you need more.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Free */}
          <div className="bg-white/[0.06] border border-white/[0.12] rounded-2xl p-7 flex flex-col">
            <div className="mb-5">
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Free</p>
              <p className="text-4xl font-bold text-white">$0</p>
              <p className="text-white/40 text-sm mt-1">No credit card needed</p>
            </div>
            <ul className="space-y-2.5 flex-1 mb-6">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-white/60 text-sm">
                  <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Check size={10} strokeWidth={3} className="text-white/50" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block w-full text-center bg-white/10 text-white py-2.5 rounded-lg font-semibold hover:bg-white/20 transition-colors text-sm border border-white/10"
            >
              Get started free
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-white rounded-2xl p-7 flex flex-col shadow-[0_24px_60px_rgba(23,105,255,0.25)]">
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[#1769FF] text-xs font-bold uppercase tracking-widest">Pro</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EEF3FF] text-[#1769FF]">Most popular</span>
              </div>
              <p className="text-4xl font-bold text-gray-900">$9</p>
              <p className="text-gray-400 text-sm mt-1">per month, cancel anytime</p>
            </div>
            <ul className="space-y-2.5 flex-1 mb-6">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-gray-600 text-sm">
                  <div className="w-4 h-4 rounded-full bg-[#EEF3FF] flex items-center justify-center shrink-0">
                    <Check size={10} strokeWidth={3} className="text-[#1769FF]" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>
            {hasStripe ? (
              <form action={startCheckout}>
                <button
                  type="submit"
                  className="w-full bg-[#1769FF] text-white py-2.5 rounded-lg font-semibold hover:bg-blue-600 active:bg-blue-700 transition-colors shadow-sm shadow-blue-200 text-sm"
                >
                  Upgrade to Pro
                </button>
              </form>
            ) : (
              <Link
                href="/signup"
                className="block w-full text-center bg-[#1769FF] text-white py-2.5 rounded-lg font-semibold hover:bg-blue-600 transition-colors text-sm"
              >
                Get started
              </Link>
            )}
          </div>
        </div>

        <p className="text-center text-white/30 text-xs mt-8">
          Questions?{" "}
          <a href="mailto:hello@milestone.app" className="hover:text-white/50 underline">
            hello@milestone.app
          </a>
        </p>
      </div>
    </div>
  );
}
