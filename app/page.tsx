import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  Zap,
  Target,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Shield,
  Layers,
  BarChart2,
} from "lucide-react";

export default async function Home() {
  const session = await auth();
  if (session?.user?.id) redirect("/dashboard");

  return (
    <div className="ms-marketing min-h-screen bg-white text-gray-900 overflow-x-hidden">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 border-b border-milestone-line bg-white/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-milestone-blue flex items-center justify-center">
              <Zap size={15} className="text-white fill-white" />
            </div>
            <span className="font-bold text-[15px] tracking-tight">Milestone</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">
              How it works
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium px-3 py-2"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="flex items-center gap-1.5 bg-milestone-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Get started
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 sm:pt-28 pb-20 text-center">
        <h1 className="text-4xl sm:text-6xl md:text-[68px] font-black tracking-tight leading-[1.05] mb-6 text-gray-900">
          Organize life by milestones.
        </h1>
        <p className="text-xl text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
          Milestone turns life goals into one clear next step, made for your phone.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-20">
          <Link
            href="/signup"
            className="flex items-center gap-2 bg-milestone-blue hover:bg-blue-600 text-white px-7 py-3.5 rounded-xl text-base font-semibold transition-colors group w-full sm:w-auto justify-center"
          >
            Start for free
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-7 py-3.5 rounded-xl text-base font-medium border border-milestone-line hover:border-gray-300 transition-all w-full sm:w-auto justify-center"
          >
            Sign in to your account
          </Link>
        </div>

        {/* App preview mockup — phone-first Today screen */}
        <div className="mx-auto max-w-[360px]">
          <div className="rounded-[2.25rem] border-[10px] border-gray-900 bg-[#EEF2F7] shadow-card-xl overflow-hidden text-left">
            <div className="h-7 bg-gray-900" />
            <div className="p-4 space-y-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Today</p>
                <h2 className="text-xl font-black tracking-tight text-gray-900">Next milestone</h2>
              </div>
              <div className="rounded-2xl bg-milestone-navy p-4 text-white">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                  Health
                </p>
                <p className="text-lg font-bold leading-snug mb-4">
                  Walk 20 minutes after lunch
                </p>
                <button className="w-full rounded-xl bg-white py-3 text-sm font-bold text-gray-900">
                  Mark done
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {["All", "Work", "Home", "Health"].map((label, i) => (
                  <div
                    key={label}
                    className={`rounded-full py-2 text-center text-xs font-bold ${
                      i === 0 ? "bg-milestone-blue text-white" : "bg-white text-gray-400"
                    }`}
                  >
                    {label}
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-milestone-line bg-white overflow-hidden">
                {["Book the dentist", "Draft budget plan", "Review launch notes"].map((title, i) => (
                  <div key={title} className="flex items-center gap-3 px-4 py-3 border-b border-milestone-line last:border-0">
                    <div className={`h-5 w-5 rounded-full border-2 ${i === 0 ? "border-milestone-blue" : "border-gray-200"}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
                      <p className="text-xs text-gray-400">{i === 0 ? "Home" : i === 1 ? "Money" : "Work"}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-1 rounded-2xl bg-white px-2 py-2 text-center text-[10px] font-bold text-gray-400">
                <span className="text-milestone-blue">Today</span>
                <span>Goals</span>
                <span>Timeline</span>
                <span>Areas</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="bg-[#EEF2F7]">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4 text-gray-900">
              Everything you need to stop losing goals.
            </h2>
            <p className="text-gray-500 text-base max-w-md mx-auto leading-relaxed">
              Built for people who finish things. No project management theater.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: Target,
                title: "Milestone Paths",
                description:
                  "Break every goal into sequential steps. One active step at a time. Always know exactly what's next.",
              },
              {
                icon: TrendingUp,
                title: "Momentum Tracking",
                description:
                  "Build daily streaks. Watch progress compound. Never forget where you left off on any goal.",
              },
              {
                icon: BarChart2,
                title: "Task Health",
                description:
                  "Instantly see stuck, needs-attention, and on-track goals. Nothing falls through the cracks.",
              },
              {
                icon: Layers,
                title: "Goal Groups",
                description:
                  "Work, Home, Health — each in its own context. Organized so nothing bleeds into everything else.",
              },
              {
                icon: Shield,
                title: "Next Steps",
                description:
                  "Keep the phone screen focused on what matters now: the next milestone for each active goal.",
              },
              {
                icon: CheckCircle,
                title: "One-Click Progress",
                description:
                  "Click a milestone node to mark it done. Instant visual feedback. Zero friction, maximum momentum.",
              },
            ].map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="p-6 rounded-2xl border border-milestone-line bg-white"
              >
                <div className="w-9 h-9 rounded-xl bg-milestone-blue-dim flex items-center justify-center mb-4">
                  <Icon size={18} className="text-milestone-blue" />
                </div>
                <h3 className="text-[15px] font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">How it works</h2>
          <p className="text-gray-500 text-base max-w-sm mx-auto">
            Three steps to goals that actually move.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {[
            {
              step: "01",
              title: "Create a goal",
              description: "Name your goal, pick a group, set the type. Takes 30 seconds.",
            },
            {
              step: "02",
              title: "Define milestones",
              description:
                "Break it into 2–6 sequential steps. Each step is one specific, clear action.",
            },
            {
              step: "03",
              title: "Execute daily",
              description:
                "Open your dashboard, see the next step, click done. Build momentum every day.",
            },
          ].map(({ step, title, description }) => (
            <div
              key={step}
              className="p-7 rounded-2xl border border-milestone-line bg-white"
            >
              <div className="text-5xl font-black mb-5 leading-none select-none text-gray-100">
                {step}
              </div>
              <h3 className="text-[15px] font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="rounded-3xl bg-milestone-blue-dim border border-milestone-blue/20 p-12 sm:p-16 text-center">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4 text-gray-900">
            Stop losing goals to the void.
          </h2>
          <p className="text-gray-500 text-base mb-8 max-w-sm mx-auto leading-relaxed">
            Free to start. No credit card required. Just goals that actually move forward.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-milestone-blue hover:bg-blue-600 text-white px-8 py-3.5 rounded-xl text-base font-semibold transition-colors group"
          >
            Create your account
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-milestone-line py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-milestone-blue flex items-center justify-center">
              <Zap size={11} className="text-white fill-white" />
            </div>
            <span className="text-sm font-semibold text-gray-400">Milestone</span>
          </div>
          <p className="text-xs text-gray-400">Track the path. Finish the next step.</p>
        </div>
      </footer>
    </div>
  );
}
