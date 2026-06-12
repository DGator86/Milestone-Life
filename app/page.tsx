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
      <section className="max-w-6xl mx-auto px-6 pt-28 pb-20 text-center">
        <h1 className="text-5xl sm:text-6xl md:text-[68px] font-black tracking-tight leading-[1.05] mb-6 text-gray-900">
          Know what to do next.
        </h1>
        <p className="text-xl text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
          Milestone turns goals into a ranked queue of next actions, so work never stalls.
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

        {/* App preview mockup — light theme */}
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-milestone-line bg-[#EEF2F7] shadow-card-xl overflow-hidden">
            {/* Window chrome */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-milestone-line bg-white">
              <div className="w-3 h-3 rounded-full bg-gray-200" />
              <div className="w-3 h-3 rounded-full bg-gray-200" />
              <div className="w-3 h-3 rounded-full bg-gray-200" />
              <div className="flex-1 mx-4">
                <div className="bg-milestone-line/60 rounded-md h-5 max-w-[180px] mx-auto" />
              </div>
            </div>
            {/* App layout */}
            <div className="flex" style={{ height: "280px" }}>
              {/* Sidebar */}
              <div className="w-[52px] bg-white border-r border-milestone-line flex flex-col items-center py-4 gap-3 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-milestone-blue flex items-center justify-center">
                  <div className="w-3 h-3 rounded-sm bg-white/60" />
                </div>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className={`w-5 h-5 rounded-md ${i === 0 ? "bg-milestone-line" : "bg-gray-100"}`} />
                ))}
              </div>
              {/* Content */}
              <div className="flex-1 p-5 overflow-hidden bg-[#EEF2F7]">
                {/* Focus block */}
                <div className="bg-white rounded-xl border border-milestone-line p-4 mb-3">
                  <div className="h-2.5 w-20 bg-gray-200 rounded mb-3" />
                  {[
                    { title: "Send proposal to Acme", goal: "Close Q2 deal", pct: 67, color: "#1769FF" },
                    { title: "Write architecture doc", goal: "Launch v2 API", pct: 40, color: "#36A852" },
                    { title: "Finalize onboarding flow", goal: "Reduce churn", pct: 20, color: "#1769FF" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5 border-b border-milestone-line/50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="h-2 w-24 bg-gray-100 rounded mb-1" />
                        <div className="h-3 w-36 rounded" style={{ backgroundColor: `${item.color}18` }} />
                      </div>
                      <div
                        className="w-5 h-5 rounded-full border-2 shrink-0"
                        style={{ borderColor: item.color }}
                      />
                    </div>
                  ))}
                </div>
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
                title: "Kill List",
                description:
                  "Cut goals that don't deserve your time. Focus is a feature. Ruthless prioritization, built in.",
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
          <p className="text-xs text-gray-400">Track the path. Kill the next step.</p>
        </div>
      </footer>
    </div>
  );
}
